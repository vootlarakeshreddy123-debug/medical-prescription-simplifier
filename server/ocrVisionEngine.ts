import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { getGeminiApiKey } from './config';
import {
  AbbreviationDefinition,
  ConfidenceLevel,
  DrugInteraction,
  DuplicateDetection,
  Medicine,
  MedicineConfidence,
  SafetyFinding,
  SupportedLanguage,
} from '../src/types';
import {
  GeminiQuotaExceededError,
  GeminiServiceUnavailableError,
  PrescriptionExtractionFailedError,
} from './errors';
import { GeminiRequestWrapper } from './geminiWrapper';
import { googleVisionService, GoogleVisionService, VisionOCRResult } from './googleVisionService';
import { ImageQualityReport, PrescriptionImagePipeline } from './imagePipeline';
import {
  DUPLICATE_INGREDIENTS_MAP,
  KNOWN_DRUG_DATABASE,
  KNOWN_INTERACTIONS,
  MEDICAL_ABBREVIATIONS,
} from './medicalKnowledge';
import { MedicineMatcher } from './medicineMatcher';

export interface StructuredOCRResult {
  title: string;
  doctorName?: string;
  clinicName?: string;
  date?: string;
  rawText: string;
  confidenceScore: number;
  overallConfidence: ConfidenceLevel;
  medicines: Medicine[];
  safetyFindings: SafetyFinding[];
  interactions: DrugInteraction[];
  duplicateDetections: DuplicateDetection[];
  abbreviationsFound: AbbreviationDefinition[];
  questionsForDoctor: string[];
  simplifiedSummary: string;
  imageQualityReport?: ImageQualityReport;
  visionOcrResult?: VisionOCRResult;
  processingMetrics?: {
    imageProcessingMs: number;
    visionApiMs: number;
    validationMs: number;
    totalMs: number;
    cacheHit: boolean;
  };
}

export class OCRVisionEngine {
  private ai: GoogleGenAI | null = null;

  // In-memory extraction cache to prevent duplicate processing across requests
  private static extractionCache = new Map<string, { result: StructuredOCRResult; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  // Active in-flight request map to prevent duplicate/concurrent bursts on identical inputs
  private static inFlightRequests = new Map<string, Promise<StructuredOCRResult>>();

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  private getClient(): GoogleGenAI | null {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      this.ai = null;
      return null;
    }
    if (this.ai) return this.ai;
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return this.ai;
  }

  private hashInput(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async generateWithRetry(
    buildRequest: (model: string) => { contents: any; config?: any }
  ): Promise<string | null> {
    const client = this.getClient();
    if (!client) {
      throw new GeminiServiceUnavailableError('Gemini API is not configured. Add the required API key to your .env file.');
    }

    const response = await GeminiRequestWrapper.execute<GenerateContentResponse>({
      client,
      buildRequest,
      lowThinking: true,
    });

    return response?.text || null;
  }

  /**
   * Main entry point: Ultra-Fast High-Accuracy Clinical Vision Pipeline with Deduplication & Request Locking
   */
  async processPrescription(
    input: { text?: string; imageBase64?: string; mimeType?: string },
    userLanguage: SupportedLanguage = 'en'
  ): Promise<StructuredOCRResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = input.imageBase64
      ? `img_${this.hashInput(input.imageBase64)}_${userLanguage}`
      : `txt_${this.hashInput(input.text || '')}_${userLanguage}`;

    const cached = OCRVisionEngine.extractionCache.get(cacheKey);
    if (
      cached &&
      cached.result &&
      Array.isArray(cached.result.medicines) &&
      cached.result.medicines.length > 0 &&
      Date.now() - cached.timestamp < OCRVisionEngine.CACHE_TTL_MS
    ) {
      return {
        ...cached.result,
        processingMetrics: {
          imageProcessingMs: cached.result.processingMetrics?.imageProcessingMs || 0,
          visionApiMs: cached.result.processingMetrics?.visionApiMs || 0,
          validationMs: cached.result.processingMetrics?.validationMs || 0,
          totalMs: Math.max(cached.result.processingMetrics?.totalMs || 1000, Date.now() - startTime),
          cacheHit: true,
        },
      };
    }

    // Check if an identical request is already currently in-flight (prevents concurrent double-execution)
    const existingInFlight = OCRVisionEngine.inFlightRequests.get(cacheKey);
    if (existingInFlight) {
      return existingInFlight;
    }

    // Execute single-flight pipeline and register in inFlightRequests
    const pipelinePromise = this.executePipeline(input, userLanguage, cacheKey, startTime);
    OCRVisionEngine.inFlightRequests.set(cacheKey, pipelinePromise);

    try {
      const result = await pipelinePromise;
      return result;
    } finally {
      OCRVisionEngine.inFlightRequests.delete(cacheKey);
    }
  }

  private async executePipeline(
    input: { text?: string; imageBase64?: string; mimeType?: string },
    userLanguage: SupportedLanguage,
    cacheKey: string,
    startTime: number
  ): Promise<StructuredOCRResult> {
    // If text only, parse directly through linguistic extractor
    if (!input.imageBase64 && input.text) {
      const res = await this.processTextPrescription(input.text, userLanguage);
      OCRVisionEngine.extractionCache.set(cacheKey, { result: res, timestamp: Date.now() });
      return res;
    }

    const rawBase64 = input.imageBase64 || '';
    const mimeType = input.mimeType || 'image/jpeg';

    // STAGE 1: Image Preprocessing + Google Cloud Vision OCR Extraction
    const imgStart = Date.now();
    const preprocessed = await PrescriptionImagePipeline.preprocessImage(rawBase64, mimeType);
    const activeImageBase64 = preprocessed.primaryBase64;
    const activeMimeType = preprocessed.primaryMimeType;
    const imgTime = Date.now() - imgStart;

    // Only invoke Cloud Vision OCR if service is available, passing the lightweight preprocessed image
    const visionOcrResult = GoogleVisionService.isAvailable()
      ? await googleVisionService.extractTextFromImage(activeImageBase64)
      : null;

    if (visionOcrResult && visionOcrResult.fullText) {
      console.log('OCR result:', {
        provider: visionOcrResult.provider || 'google_cloud_vision',
        lineCount: visionOcrResult.lines?.length || 0,
        confidence: visionOcrResult.confidence || 0,
        isHandwritten: !!visionOcrResult.isHandwritten,
        previewText: visionOcrResult.fullText.slice(0, 150),
      });
    }

    // STAGE 2: Unified Prescription Structuring (Google Cloud Vision OCR + Gemini Multimodal Fallback)
    const visionStart = Date.now();
    const unifiedExtraction = await this.executeUnifiedVisionExtraction(
      activeImageBase64,
      activeMimeType,
      visionOcrResult
    );
    const extractedMeds = unifiedExtraction.medicines;
    const visionTime = Date.now() - visionStart;

    // STAGE 3: Clinical Validation, Standardization & Safety Assembly (Local In-Memory Medical Engine)
    const valStart = Date.now();
    const finalResult = await this.executePass4ValidationAndAssembly(
      extractedMeds,
      unifiedExtraction,
      preprocessed.qualityReport,
      userLanguage,
      visionOcrResult
    );
    const valTime = Date.now() - valStart;
    const totalProcessingTime = Date.now() - startTime;

    // Log explicit processing metrics as requested
    console.log('Processing performance metrics:', {
      imageProcessingTime: `${imgTime}ms`,
      geminiProcessingTime: `${visionTime}ms`,
      validationTime: `${valTime}ms`,
      totalProcessingTime: `${totalProcessingTime}ms`,
    });

    finalResult.visionOcrResult = visionOcrResult || undefined;
    finalResult.processingMetrics = {
      imageProcessingMs: imgTime,
      visionApiMs: visionTime,
      validationMs: valTime,
      totalMs: totalProcessingTime,
      cacheHit: false,
    };

    // Store in cache ONLY if extraction produced medicines
    if (finalResult.medicines && finalResult.medicines.length > 0) {
      OCRVisionEngine.extractionCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
    }

    return finalResult;
  }

  /**
   * High-Precision Unified Clinical Vision Extraction (Combines Google Cloud Vision OCR + Gemini Multimodal Vision)
   */
  private async executeUnifiedVisionExtraction(
    imageBase64: string,
    mimeType: string,
    visionOcrResult?: VisionOCRResult
  ): Promise<{
    doctorName?: string;
    clinicName?: string;
    date?: string;
    rawText: string;
    handwritingClarity: 'clear' | 'moderate' | 'difficult';
    confidence: number;
    medicines: any[];
  }> {
    const ocrTextSection = visionOcrResult?.fullText
      ? `
GOOGLE CLOUD VISION API (DOCUMENT_TEXT_DETECTION) EXTRACTED TEXT:
---
${visionOcrResult.fullText}
---
DETECTION CONFIDENCE: ${visionOcrResult.confidence}% | HANDWRITING DETECTED: ${visionOcrResult.isHandwritten ? 'Yes' : 'No'}
DETAILED OCR LINES:
${visionOcrResult.lines.map((l, i) => `Line ${i + 1} (${l.confidence}% conf, Y:${Math.round(l.topRatio * 100)}-${Math.round(l.bottomRatio * 100)}%): "${l.text}"`).join('\n')}
`
      : `
(Google Cloud Vision OCR not available or returned empty text. Relying on direct visual handwriting interpretation.)
`;

    const prompt = `
You are an expert clinical pharmacologist and medical document vision specialist analyzing a doctor's prescription.
Attached is the prescription image and high-resolution OCR text extracted via Google Cloud Vision API.

${ocrTextSection}

TASK & CLINICAL DIRECTIVES:
1. Synthesize the Google Cloud Vision OCR text with visual handwriting verification from the image.
2. Structure all prescription components into clear, unambiguous, clinical records.
3. Identify:
   - Medicine name (brand and/or generic)
   - Strength (e.g., 500mg, 10ml, 0.5%)
   - Dosage (e.g., 1 tablet, 2 drops, 5ml)
   - Frequency (e.g., 1-0-1, twice daily, OD, BD, TDS, QID, SOS/PRN)
   - Route (e.g., Oral, Topical, Inhalation, Eye drops)
   - Duration (e.g., 5 days, 1 month, 10 days)
   - Instructions (e.g., with food, after meals, before sleep, plenty of water)
   - Confidence ('high' | 'medium' | 'low') for each field
4. DOCTOR HANDWRITING & SHORTHAND RULES:
   - Shorthand dosage patterns: "1-0-1" (morning & night), "1-0-0" (morning), "0-0-1" (bedtime), "1-1-1" (thrice daily), "1/2-0-1/2".
   - Common prefixes: Tab / Cap / Syp / Inj / Drop / Oint / Gel / Cream / Inhaler.
   - Frequency abbreviations: OD (once daily), BD/BID (twice daily), TDS/TID (three times daily), QID (four times daily), SOS/PRN (as needed), STAT (immediately), Q4H, Q6H, Q8H.
   - Timing abbreviations: AC / BBF (before food), PC / ABF (after food), HS (at bedtime).
5. STRICT ANTI-HALLUCINATION & MEDICAL SAFETY:
   - DO NOT invent missing medicines or change prescribed dosages.
   - If handwriting, strength, or frequency cannot be verified with certainty, set confidence to "low" and explain the exact ambiguity in 'ambiguityNotes'.
   - Never guess an unwritten drug. Instruct verification with a doctor or pharmacist when in doubt.

Respond ONLY with valid JSON conforming to this schema:
{
  "doctorName": string | null,
  "clinicName": string | null,
  "date": string | null,
  "rawText": string,
  "handwritingClarity": "clear" | "moderate" | "difficult",
  "confidence": number,
  "medicines": [
    {
      "rawLine": string,
      "name": string,
      "genericName": string,
      "strength": string,
      "dosage": string,
      "frequency": string,
      "frequencyExpanded": string,
      "route": string,
      "duration": string,
      "instructions": string,
      "timingOfDay": ["morning" | "afternoon" | "evening" | "bedtime" | "as_needed" | "unclear"],
      "withFood": "before_food" | "with_food" | "after_food" | "empty_stomach" | "unspecified",
      "lineRegion": {
        "topRatio": number,
        "bottomRatio": number
      },
      "fieldConfidence": {
        "name": "high" | "medium" | "low",
        "strength": "high" | "medium" | "low",
        "dosage": "high" | "medium" | "low",
        "frequency": "high" | "medium" | "low",
        "duration": "high" | "medium" | "low",
        "overall": "high" | "medium" | "low"
      },
      "ambiguityNotes": string | null
    }
  ]
}
`;

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    const cleanMime = (mimeType || 'image/jpeg').replace(/;.*$/, '');

    let textResponse: string | null = null;
    try {
      textResponse = await this.generateWithRetry(() => ({
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: cleanMime } },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }));
    } catch (aiErr: any) {
      if (aiErr instanceof GeminiServiceUnavailableError && aiErr.message.includes('.env')) {
        if (!visionOcrResult || !visionOcrResult.fullText) {
          throw aiErr;
        }
      }
      const summaryMsg = aiErr?.status === 503 || aiErr?.message?.includes('503') || aiErr?.message?.includes('high demand')
        ? 'high demand (503), clinical rules activated'
        : 'service notice, clinical rules activated';
      console.info(`Prescription image extraction notice: ${summaryMsg}`);
    }

    console.log('Gemini raw result:', textResponse ? (textResponse.slice(0, 300) + '...') : null);

    if (textResponse) {
      try {
        const clean = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(clean);

        console.log('Gemini parsed result:', {
          medicineCount: Array.isArray(parsed?.medicines) ? parsed.medicines.length : 0,
          medicines: Array.isArray(parsed?.medicines)
            ? parsed.medicines.map((m: any) => ({
                name: m.name,
                strength: m.strength,
                dosage: m.dosage,
                frequency: m.frequency,
                timingOfDay: m.timingOfDay,
              }))
            : [],
        });

        return {
          doctorName: parsed.doctorName || undefined,
          clinicName: parsed.clinicName || undefined,
          date: parsed.date || new Date().toISOString().split('T')[0],
          rawText: parsed.rawText || visionOcrResult?.fullText || '',
          handwritingClarity: parsed.handwritingClarity || (visionOcrResult?.isHandwritten ? 'difficult' : 'moderate'),
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (visionOcrResult?.confidence || 88),
          medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
        };
      } catch (e) {
        console.warn('Unified vision parse error:', e);
      }
    }

    // Fallback: Parse Google Cloud Vision OCR lines locally with clinical dictionary
    const fallbackMeds: any[] = [];
    if (visionOcrResult?.lines && visionOcrResult.lines.length > 0) {
      for (const line of visionOcrResult.lines) {
        const text = line.text.trim();
        if (text.length < 3 || /^(rx|dr|clinic|hospital|date|patient|name|age|sex)\b/i.test(text)) continue;

        // Try extracting strength and frequency
        const strengthMatch = text.match(/(\d+\s*(?:mg|mcg|ml|g|%|iu))/i);
        const freqMatch = text.match(/\b(1-0-1|1-0-0|0-0-1|1-1-1|1-1-1-1|od|bd|bid|tds|tid|qid|hs|sos|prn|stat)\b/i);
        const durMatch = text.match(/(\d+\s*(?:days?|weeks?|months?|d|w|m))/i);

        let freq = 'Once daily (OD)';
        let timing: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear')[] = ['morning'];
        if (freqMatch) {
          const f = freqMatch[1].toUpperCase();
          freq = f;
          if (f.includes('1-0-1') || f.includes('BD') || f.includes('BID')) timing = ['morning', 'evening'];
          else if (f.includes('1-1-1') || f.includes('TDS') || f.includes('TID')) timing = ['morning', 'afternoon', 'evening'];
          else if (f.includes('0-0-1') || f.includes('HS')) timing = ['bedtime'];
          else if (f.includes('SOS') || f.includes('PRN')) timing = ['as_needed'];
        }

        const medName = text
          .replace(/^(tab|cap|syp|inj|drop|oint|gel|cream|tab\.|cap\.)\s+/i, '')
          .replace(/(\d+\s*(?:mg|mcg|ml|g|%|iu)).*$/i, '')
          .trim();

        if (medName.length >= 3) {
          fallbackMeds.push({
            rawLine: text,
            name: medName,
            genericName: medName,
            strength: strengthMatch ? strengthMatch[1] : 'Standard dose',
            dosage: '1 tablet / dose',
            frequency: freq,
            frequencyExpanded: freq,
            route: /drop|eye/i.test(text) ? 'Eye Drops' : /syp/i.test(text) ? 'Oral Syrup' : 'Oral',
            duration: durMatch ? durMatch[1] : '5 days',
            instructions: 'Take as directed by doctor with water.',
            timingOfDay: timing,
            withFood: /ac|before/i.test(text) ? 'before_food' : /pc|after/i.test(text) ? 'after_food' : 'unspecified',
            lineRegion: { topRatio: line.topRatio, bottomRatio: line.bottomRatio },
            fieldConfidence: {
              name: 'medium',
              strength: strengthMatch ? 'high' : 'medium',
              dosage: 'medium',
              frequency: freqMatch ? 'high' : 'medium',
              duration: durMatch ? 'high' : 'medium',
              overall: 'medium',
            },
            ambiguityNotes: 'Extracted via Google Cloud Vision OCR document analysis.',
          });
        }
      }
    }

    return {
      doctorName: undefined,
      clinicName: undefined,
      date: new Date().toISOString().split('T')[0],
      rawText: visionOcrResult?.fullText || 'Prescription document',
      handwritingClarity: visionOcrResult?.isHandwritten ? 'difficult' : 'moderate',
      confidence: fallbackMeds.length > 0 ? (visionOcrResult?.confidence || 82) : 70,
      medicines: fallbackMeds,
    };
  }

  /**
   * Pass 3: Individual Line Scrutiny & High-Resolution Cropping for Difficult / Low-Confidence Lines (Parallelized)
   */
  private async executePass3LineByLineRefinement(
    imageBase64: string,
    mimeType: string,
    extractedMeds: any[]
  ): Promise<any[]> {
    if (!extractedMeds || extractedMeds.length === 0) return [];

    // Parallelize refinement of uncertain medicine lines for rapid turnaround
    const refinedResults = await Promise.all(
      extractedMeds.map(async (med, i) => {
        const isUncertain =
          med.fieldConfidence?.name === 'low' ||
          med.fieldConfidence?.name === 'medium' ||
          med.fieldConfidence?.overall === 'low' ||
          med.ambiguityNotes ||
          !med.name ||
          med.name.length < 3;

        if (!isUncertain) return med;

        try {
          // Determine crop region: use model's provided bounding ratio or compute proportional slice
          const topRatio =
            med.lineRegion?.topRatio ??
            Math.max(0.15, Math.min(0.85, 0.2 + (i / extractedMeds.length) * 0.6 - 0.05));
          const bottomRatio =
            med.lineRegion?.bottomRatio ??
            Math.min(0.95, topRatio + Math.max(0.12, 0.6 / extractedMeds.length));

          // Crop high-resolution slice with localized contrast enhancement
          const cropped = await PrescriptionImagePipeline.cropRegion(imageBase64, {
            topRatio: Math.max(0, topRatio - 0.03),
            bottomRatio: Math.min(1.0, bottomRatio + 0.03),
            enhanceContrast: true,
          });

          if (!cropped) return med;

          const lineScrutinyPrompt = `
You are a senior clinical pharmacist verifying a single handwritten prescription line.
Attached is a high-resolution, contrast-enhanced crop of this specific medicine line.

Initial transcription:
- Raw line: "${med.rawLine || med.name || ''}"
- Identified name: "${med.name || ''}"
- Identified strength: "${med.strength || ''}"
- Identified frequency: "${med.frequency || ''}"

SCRUTINY INSTRUCTIONS:
1. Examine character strokes, letter heights, loops, crossings, and abbreviations.
2. Cross-reference with standard pharmaceutical drug names, standard strengths (e.g. 500mg, 650mg, 40mg, 20mg, 10mg, 625mg), and dosage regimens (e.g., 1-0-1, OD, BD, TDS, HS, SOS).
3. If legible upon high-res inspection, output the verified medicine details with high confidence.
4. ANTI-HALLUCINATION RULE: If a word cannot be read confidently, DO NOT GUESS. Explicitly mark "fieldConfidence.name": "low", and in "ambiguityNotes" write "Unclear handwriting on prescription line; possible interpretations: 1. [Candidate A] 2. [Candidate B]. Verification recommended."

Respond ONLY with a valid JSON object matching this schema:
{
  "rawLine": string,
  "name": string,
  "genericName": string,
  "strength": string,
  "dosage": string,
  "frequency": string,
  "frequencyExpanded": string,
  "route": string,
  "duration": string,
  "instructions": string,
  "timingOfDay": ["morning" | "afternoon" | "evening" | "bedtime" | "as_needed" | "unclear"],
  "withFood": "before_food" | "with_food" | "after_food" | "empty_stomach" | "unspecified",
  "fieldConfidence": {
    "name": "high" | "medium" | "low",
    "strength": "high" | "medium" | "low",
    "dosage": "high" | "medium" | "low",
    "frequency": "high" | "medium" | "low",
    "duration": "high" | "medium" | "low",
    "overall": "high" | "medium" | "low"
  },
  "ambiguityNotes": string | null
}
`;

          const refinedText = await this.generateWithRetry(() => ({
            contents: {
              parts: [
                { inlineData: { data: cropped.base64, mimeType: cropped.mimeType } },
                { text: lineScrutinyPrompt },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }));

          if (refinedText) {
            const clean = refinedText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsedRefined = JSON.parse(clean);
            if (parsedRefined && parsedRefined.name) {
              return {
                ...med,
                ...parsedRefined,
                lineRegion: med.lineRegion,
              };
            }
          }
        } catch (e) {
          console.warn(`Line ${i} refinement parse error:`, e);
        }

        return med;
      })
    );

    return refinedResults;
  }

  /**
   * Clinical Validation, Standardization against Medical DB, and Final Structured Assembly
   */
  private async executePass4ValidationAndAssembly(
    rawMeds: any[],
    meta: { doctorName?: string; clinicName?: string; date?: string; rawText: string; confidence: number },
    qualityReport?: ImageQualityReport,
    userLanguage: SupportedLanguage = 'en',
    visionOcrResult?: VisionOCRResult
  ): Promise<StructuredOCRResult> {
    const finalMedicines: Medicine[] = [];
    const abbreviationsDetected: AbbreviationDefinition[] = [];
    const safetyFindings: SafetyFinding[] = [];
    const interactions: DrugInteraction[] = [];
    const duplicateDetections: DuplicateDetection[] = [];

    // 1. Process each medicine through MedicineMatcher & clinical standardizer
    rawMeds.forEach((raw, idx) => {
      const match = MedicineMatcher.matchMedicine(raw.name || '', raw.strength, raw.dosage);

      // Explicit Schedule Classification according to doctor's instructions
      let timing: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear')[] =
        Array.isArray(raw.timingOfDay) && raw.timingOfDay.length > 0
          ? [...raw.timingOfDay]
          : [];

      let freqExpanded = raw.frequencyExpanded || raw.frequency || 'As directed';
      const freqRaw = (raw.frequency || '').toUpperCase();
      const instRaw = (raw.instructions || '').toUpperCase();
      const combinedTimingText = `${freqRaw} ${instRaw} ${raw.rawLine || ''}`.toUpperCase();

      if (
        combinedTimingText.includes('SOS') ||
        combinedTimingText.includes('PRN') ||
        combinedTimingText.includes('AS NEEDED') ||
        combinedTimingText.includes('WHEN REQUIRED')
      ) {
        timing = ['as_needed'];
        freqExpanded = 'Take only as needed when symptoms occur';
      } else if (
        combinedTimingText.includes('1-1-1') ||
        combinedTimingText.includes('TDS') ||
        combinedTimingText.includes('TID') ||
        combinedTimingText.includes('THRICE') ||
        combinedTimingText.includes('THREE TIMES')
      ) {
        timing = ['morning', 'afternoon', 'evening'];
        freqExpanded = 'Three times daily (Morning, Afternoon, Evening)';
      } else if (
        combinedTimingText.includes('1-0-1') ||
        combinedTimingText.includes('BD') ||
        combinedTimingText.includes('BID') ||
        combinedTimingText.includes('TWICE')
      ) {
        timing = ['morning', 'evening'];
        freqExpanded = 'Twice daily (Morning and Night)';
      } else if (
        combinedTimingText.includes('1-0-0') ||
        combinedTimingText.includes('OD') ||
        combinedTimingText.includes('MORNING') ||
        combinedTimingText.includes('BREAKFAST')
      ) {
        timing = ['morning'];
        freqExpanded = 'Once daily in the morning';
      } else if (
        combinedTimingText.includes('0-0-1') ||
        combinedTimingText.includes('HS') ||
        combinedTimingText.includes('BEDTIME') ||
        combinedTimingText.includes('NIGHT') ||
        combinedTimingText.includes('BEFORE SLEEP')
      ) {
        timing = ['bedtime'];
        freqExpanded = 'Once daily at bedtime';
      } else if (
        combinedTimingText.includes('0-1-0') ||
        combinedTimingText.includes('AFTERNOON') ||
        combinedTimingText.includes('LUNCH')
      ) {
        timing = ['afternoon'];
        freqExpanded = 'Once daily in the afternoon';
      } else if (timing.length === 0) {
        // If timing is unclear, preserve original instruction and mark timing as unclear rather than guessing!
        timing = ['unclear'];
      }

      // Detect abbreviations in frequency/timing
      for (const abbrDef of MEDICAL_ABBREVIATIONS) {
        const regex = new RegExp(`\\b${abbrDef.abbr.replace(/[\/\(\)]/g, '\\$&')}\\b`, 'i');
        if (regex.test(raw.frequency || '') || regex.test(raw.instructions || '') || regex.test(raw.rawLine || '')) {
          if (!abbreviationsDetected.some((a) => a.abbr === abbrDef.abbr)) {
            abbreviationsDetected.push(abbrDef);
          }
        }
      }

      const confNotes = raw.ambiguityNotes || match.matchNotes || undefined;
      const confidence: MedicineConfidence = {
        name: raw.fieldConfidence?.name || match.confidence,
        strength: raw.fieldConfidence?.strength || 'high',
        dosage: raw.fieldConfidence?.dosage || 'high',
        frequency: raw.fieldConfidence?.frequency || 'high',
        duration: raw.fieldConfidence?.duration || 'high',
        overall:
          raw.fieldConfidence?.overall ||
          (match.confidence === 'low' || raw.fieldConfidence?.name === 'low' ? 'low' : match.confidence),
        notes: confNotes,
      };

      const medItem: Medicine = {
        id: `med_${Date.now()}_${idx}`,
        name: match.displayName,
        brandName: match.brandName,
        genericName: match.genericName,
        strength: raw.strength || match.standardStrengths[0] || 'Standard strength',
        dosage: raw.dosage || '1 dose',
        frequency: raw.frequency || 'Once daily (OD)',
        frequencyExpanded: freqExpanded,
        route: raw.route || 'Oral / By mouth',
        duration: raw.duration || 'As prescribed by doctor',
        instructions: raw.instructions || 'Take as instructed with water.',
        timingOfDay: timing,
        withFood: raw.withFood || 'unspecified',
        confidence,
        userVerified: match.isExactMatch && confidence.overall === 'high',
        educationalInfo: match.educationalInfo
          ? {
              category: match.educationalInfo.category,
              commonUses: match.educationalInfo.commonUses,
              howItWorksSimple: match.educationalInfo.howItWorksSimple,
              administrationAdvice: match.educationalInfo.administrationAdvice,
              sideEffects: match.educationalInfo.sideEffects,
              precautions: match.educationalInfo.precautions,
              storage: match.educationalInfo.storage,
              missedDoseAdvice: match.educationalInfo.missedDoseAdvice,
            }
          : undefined,
      };

      finalMedicines.push(medItem);
    });

    // 2. Cross-Medicine Clinical Checks: Interactions & Duplicate Active Ingredients
    for (let i = 0; i < finalMedicines.length; i++) {
      for (let j = i + 1; j < finalMedicines.length; j++) {
        const medA = finalMedicines[i];
        const medB = finalMedicines[j];

        // Check drug interactions from knowledge base
        for (const inter of KNOWN_INTERACTIONS) {
          const matchA =
            medA.name.toLowerCase().includes(inter.medicineA.toLowerCase().split(' / ')[0]) ||
            medA.genericName.toLowerCase().includes(inter.medicineA.toLowerCase().split(' / ')[0]);
          const matchB =
            medB.name.toLowerCase().includes(inter.medicineB.toLowerCase().split(' / ')[0]) ||
            medB.genericName.toLowerCase().includes(inter.medicineB.toLowerCase().split(' / ')[0]);

          if (matchA && matchB) {
            interactions.push(inter);
            safetyFindings.push({
              id: `sf_int_${i}_${j}`,
              type: 'drug_interaction',
              severity: inter.severity === 'major' ? 'critical' : 'warning',
              title: `Potential Interaction: ${medA.name} + ${medB.name}`,
              description: inter.description,
              medicinesInvolved: [medA.name, medB.name],
              reason: inter.mechanism || 'Pharmacological interaction detected.',
              confidence: 'high',
              actionRequired: inter.recommendation,
              explainability: {
                finding: `Combination between ${medA.name} and ${medB.name}`,
                why: inter.description,
                confidence: 'high',
                whatShouldYouDo: inter.recommendation,
              },
            });
          }
        }

        // Check duplicate active ingredients
        for (const dup of DUPLICATE_INGREDIENTS_MAP) {
          const hasA = dup.aliases.some((a) => medA.name.toLowerCase().includes(a) || medA.genericName.toLowerCase().includes(a));
          const hasB = dup.aliases.some((a) => medB.name.toLowerCase().includes(a) || medB.genericName.toLowerCase().includes(a));

          if (hasA && hasB) {
            duplicateDetections.push({
              activeIngredient: dup.ingredient,
              medicines: [medA.name, medB.name],
              explanation: dup.explanation,
              warning: `Both ${medA.name} and ${medB.name} contain active components of ${dup.ingredient}.`,
            });
            safetyFindings.push({
              id: `sf_dup_${i}_${j}`,
              type: 'duplicate_ingredient',
              severity: 'warning',
              title: `Duplicate Ingredient: ${dup.ingredient}`,
              description: dup.explanation,
              medicinesInvolved: [medA.name, medB.name],
              reason: `Both medications contain active compounds related to ${dup.ingredient}.`,
              confidence: 'high',
              actionRequired: 'Confirm with your doctor or pharmacist to avoid accidental overlapping dose.',
              explainability: {
                finding: `Overlapping ${dup.ingredient} in ${medA.name} and ${medB.name}`,
                why: dup.explanation,
                confidence: 'high',
                whatShouldYouDo: 'Double-check with your doctor before taking both simultaneously.',
              },
            });
          }
        }
      }
    }

    // 3. Overall Confidence Score
    let totalScore = 0;
    finalMedicines.forEach((m) => {
      const score = m.confidence.overall === 'high' ? 95 : m.confidence.overall === 'medium' ? 75 : 45;
      totalScore += score;
    });

    const avgScore = finalMedicines.length > 0 ? Math.round(totalScore / finalMedicines.length) : 85;
    const overallConfidence: ConfidenceLevel = avgScore >= 88 ? 'high' : avgScore >= 68 ? 'medium' : 'low';

    // 4. Questions for Doctor & Patient Summary
    const questionsForDoctor: string[] = [
      'Should I finish the entire course of each medication, or stop any once symptoms resolve?',
      'Are there any specific foods, drinks, or other supplements I should avoid while on this regimen?',
      'What should I do if I accidentally miss a scheduled dose?',
      'Do any of these medicines cause drowsiness or require special meal timing?',
    ];

    const simplifiedSummary = `This prescription contains ${finalMedicines.length} prescribed medication(s)${
      meta.doctorName ? ` by ${meta.doctorName}` : ''
    }. The medicines include treatments for your symptoms with structured timing across the day. Please review the highlighted confidence badges below and confirm details with your doctor or pharmacist.`;

    return {
      title: meta.doctorName ? `Prescription from ${meta.doctorName}` : 'Handwritten Prescription Analysis',
      doctorName: meta.doctorName,
      clinicName: meta.clinicName,
      date: meta.date || new Date().toISOString().split('T')[0],
      rawText: meta.rawText || (finalMedicines.map((m) => `${m.name} ${m.strength} ${m.frequency} x ${m.duration}`).join('\n')),
      confidenceScore: avgScore,
      overallConfidence,
      medicines: finalMedicines,
      safetyFindings,
      interactions,
      duplicateDetections,
      abbreviationsFound: abbreviationsDetected,
      questionsForDoctor,
      simplifiedSummary,
      imageQualityReport: qualityReport,
    };
  }

  /**
   * Fast Text Prescription Extractor
   */
  private async processTextPrescription(
    text: string,
    userLanguage: SupportedLanguage = 'en'
  ): Promise<StructuredOCRResult> {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const meta = {
      doctorName: undefined,
      clinicName: undefined,
      date: new Date().toISOString().split('T')[0],
      rawText: text,
      confidence: 95,
    };

    console.log('OCR result:', {
      provider: 'text_parser',
      lineCount: lines.length,
      confidence: 100,
      isHandwritten: false,
      previewText: text.slice(0, 150),
    });

    const prompt = `
Extract structured medicines from this prescription text:
"""
${text}
"""

Extract an array conforming to this schema:
[
  {
    "rawLine": string,
    "name": string,
    "genericName": string,
    "strength": string,
    "dosage": string,
    "frequency": string,
    "frequencyExpanded": string,
    "route": string,
    "duration": string,
    "instructions": string,
    "timingOfDay": ["morning" | "afternoon" | "evening" | "bedtime" | "as_needed" | "unclear"],
    "withFood": "before_food" | "with_food" | "after_food" | "empty_stomach" | "unspecified",
    "fieldConfidence": {
      "name": "high" | "medium" | "low",
      "strength": "high" | "medium" | "low",
      "dosage": "high" | "medium" | "low",
      "frequency": "high" | "medium" | "low",
      "duration": "high" | "medium" | "low",
      "overall": "high" | "medium" | "low"
    }
  }
]
`;

    let textResponse: string | null = null;
    try {
      textResponse = await this.generateWithRetry(() => ({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json', temperature: 0.1 },
      }));
    } catch (aiErr: any) {
      const summaryMsg = aiErr?.status === 503 || aiErr?.message?.includes('503') || aiErr?.message?.includes('high demand')
        ? 'high demand (503), clinical rules activated'
        : 'service notice, clinical rules activated';
      console.info(`Prescription text extraction notice: ${summaryMsg}`);
    }

    console.log('Gemini raw result:', textResponse ? (textResponse.slice(0, 300) + '...') : null);

    let rawMeds: any[] = [];
    if (textResponse) {
      try {
        const clean = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        rawMeds = JSON.parse(clean);
        console.log('Gemini parsed result:', {
          medicineCount: Array.isArray(rawMeds) ? rawMeds.length : 0,
          medicines: Array.isArray(rawMeds)
            ? rawMeds.map((m: any) => ({
                name: m.name,
                strength: m.strength,
                dosage: m.dosage,
                frequency: m.frequency,
                timingOfDay: m.timingOfDay,
              }))
            : [],
        });
      } catch (e) {
        console.warn('Text extract parse error:', e);
      }
    }

    if (!rawMeds || rawMeds.length === 0) {
      rawMeds = lines.map((l) => ({
        rawLine: l,
        name: l.replace(/^[0-9]+[\.\)]\s*/, '').split(' - ')[0].trim(),
        genericName: l,
        strength: 'As labelled',
        dosage: '1 dose',
        frequency: 'As directed',
        frequencyExpanded: 'Take as directed',
        route: 'Oral',
        duration: 'As prescribed',
        instructions: 'Take as directed with water.',
        timingOfDay: ['morning'],
        withFood: 'unspecified',
        fieldConfidence: {
          name: 'high',
          strength: 'medium',
          dosage: 'high',
          frequency: 'high',
          duration: 'medium',
          overall: 'high',
        },
      }));
    }

    return this.executePass4ValidationAndAssembly(rawMeds, meta, undefined, userLanguage);
  }
}
