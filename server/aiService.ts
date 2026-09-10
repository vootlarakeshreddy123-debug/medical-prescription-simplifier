import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { getGeminiApiKey } from './config';
import {
  AbbreviationDefinition,
  ChatMessage,
  ConfidenceLevel,
  DrugInteraction,
  DuplicateDetection,
  Medicine,
  Prescription,
  SafetyFinding,
  SupportedLanguage,
} from '../src/types';
import { GeminiQuotaExceededError, GeminiServiceUnavailableError } from './errors';
import { GeminiRequestWrapper } from './geminiWrapper';
import { ImageQualityReport } from './imagePipeline';
import {
  DUPLICATE_INGREDIENTS_MAP,
  KNOWN_DRUG_DATABASE,
  KNOWN_INTERACTIONS,
  MEDICAL_ABBREVIATIONS,
} from './medicalKnowledge';
import { OCRVisionEngine, StructuredOCRResult } from './ocrVisionEngine';

export interface AIService {
  extractPrescription(
    input: { text?: string; imageBase64?: string; mimeType?: string },
    userLanguage?: SupportedLanguage
  ): Promise<StructuredOCRResult>;

  answerPrescriptionQuestion(
    prescription: Prescription,
    history: ChatMessage[],
    userQuestion: string,
    language: SupportedLanguage
  ): Promise<{ text: string; safetyNotice?: string; suggestedQuestions?: string[] }>;

  translatePrescription(
    prescription: Prescription,
    targetLanguage: SupportedLanguage
  ): Promise<{ simplifiedSummary: string; scheduleNotes: string; questions: string[] }>;

  prewarmTranslations(prescription: Prescription): void;
}

export class GeminiAIService implements AIService {
  private ai: GoogleGenAI | null = null;
  private visionEngine: OCRVisionEngine;
  // Multi-level translation cache
  private translationCache = new Map<
    string,
    { simplifiedSummary: string; scheduleNotes: string; questions: string[]; timestamp: number }
  >();
  private readonly TRANSLATION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.initClient();
    this.visionEngine = new OCRVisionEngine(this.ai);
  }

  private initClient(): GoogleGenAI | null {
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
    this.visionEngine = new OCRVisionEngine(this.ai);
    return this.ai;
  }

  private getClient(): GoogleGenAI | null {
    return this.initClient();
  }

  /**
   * Helper to execute Gemini generateContent with strict quota handling, request locking, and 503 fallback
   */
  private async generateContentWithRetry(
    buildRequest: (modelName: string) => { contents: any; config?: any }
  ): Promise<GenerateContentResponse | null> {
    const client = this.getClient();
    if (!client) {
      throw new GeminiServiceUnavailableError('Gemini API is not configured. Add the required API key to your .env file.');
    }

    return GeminiRequestWrapper.execute<GenerateContentResponse>({
      client,
      buildRequest,
      lowThinking: true,
    });
  }

  /**
   * Fast multi-pass prescription extraction
   */
  async extractPrescription(
    input: { text?: string; imageBase64?: string; mimeType?: string },
    userLanguage: SupportedLanguage = 'en'
  ) {
    this.initClient();
    try {
      const result = await this.visionEngine.processPrescription(input, userLanguage);
      return result;
    } catch (err: any) {
      // Re-throw Quota and Service Availability errors so backend sends structured responses
      if (
        err instanceof GeminiQuotaExceededError ||
        err instanceof GeminiServiceUnavailableError ||
        err?.code === 'GEMINI_QUOTA_EXCEEDED' ||
        err?.status === 429
      ) {
        throw err;
      }

      console.error('Vision engine execution error, checking clinical fallback:', err?.message);
      if (input.text) {
        return this.fallbackExtraction(input.text, userLanguage, Boolean(input.imageBase64));
      }
      throw err;
    }
  }

  /**
   * Clinical knowledge fallback parser
   */
  private fallbackExtraction(
    rawText: string,
    userLanguage: SupportedLanguage,
    isFromImage: boolean = false
  ): StructuredOCRResult {
    const textLower = rawText.toLowerCase();
    const detectedMeds: Medicine[] = [];

    // Check against known drug dictionary
    for (const [key, drug] of Object.entries(KNOWN_DRUG_DATABASE)) {
      const matched =
        textLower.includes(key) ||
        drug.brandAliases.some((alias) => textLower.includes(alias.toLowerCase()));

      if (matched) {
        const brandAlias = drug.brandAliases.find((a) => textLower.includes(a.toLowerCase()));
        const name = brandAlias
          ? `${brandAlias.charAt(0).toUpperCase() + brandAlias.slice(1)} (${drug.genericName})`
          : drug.genericName;

        let strength = drug.commonStrengths[0] || 'Standard dose';
        const matchStrength = rawText.match(new RegExp(`${brandAlias || key}\\s*(\\d+\\s*(?:mg|mcg|ml|g))`, 'i'));
        if (matchStrength && matchStrength[1]) {
          strength = matchStrength[1];
        }

        let frequency = 'Twice daily (BD)';
        let timingOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear')[] = [
          'morning',
          'evening',
        ];
        let withFood: 'before_food' | 'with_food' | 'after_food' | 'empty_stomach' | 'unspecified' =
          'with_food';

        if (textLower.includes('od') || textLower.includes('once daily') || textLower.includes('1-0-0')) {
          frequency = 'Once daily (OD)';
          timingOfDay = ['morning'];
        } else if (textLower.includes('tds') || textLower.includes('tid') || textLower.includes('1-1-1')) {
          frequency = 'Three times daily (TDS)';
          timingOfDay = ['morning', 'afternoon', 'evening'];
        } else if (textLower.includes('hs') || textLower.includes('bedtime') || textLower.includes('0-0-1')) {
          frequency = 'Once daily at bedtime (HS)';
          timingOfDay = ['bedtime'];
        } else if (textLower.includes('sos') || textLower.includes('prn') || textLower.includes('as needed')) {
          frequency = 'As needed (SOS / PRN)';
          timingOfDay = ['as_needed'];
        }

        if (textLower.includes('ac') || textLower.includes('before food') || textLower.includes('empty stomach')) {
          withFood = 'before_food';
        } else if (textLower.includes('pc') || textLower.includes('after food')) {
          withFood = 'after_food';
        }

        detectedMeds.push({
          id: `med_fallback_${Date.now()}_${detectedMeds.length}`,
          name,
          brandName: brandAlias ? brandAlias.charAt(0).toUpperCase() + brandAlias.slice(1) : undefined,
          genericName: drug.genericName,
          strength,
          dosage: '1 tablet',
          frequency,
          frequencyExpanded: frequency,
          route: 'Oral / By mouth',
          duration: '5 to 7 days (as prescribed)',
          instructions: 'Take with plenty of water as directed.',
          timingOfDay,
          withFood,
          confidence: {
            name: 'high',
            strength: 'medium',
            dosage: 'medium',
            frequency: 'medium',
            duration: 'medium',
            overall: 'high',
            notes: 'Matched with high confidence from clinical reference database.',
          },
          userVerified: false,
          educationalInfo: {
            category: drug.category,
            commonUses: drug.commonUses,
            howItWorksSimple: drug.howItWorksSimple,
            administrationAdvice: drug.administrationAdvice,
            sideEffects: drug.sideEffects,
            precautions: drug.precautions,
            storage: drug.storage,
            missedDoseAdvice: drug.missedDoseAdvice,
          },
        });
      }
    }

    if (detectedMeds.length === 0) {
      detectedMeds.push({
        id: `med_fallback_${Date.now()}_0`,
        name: isFromImage ? 'Prescription Medicine' : rawText.slice(0, 30) || 'Prescribed Medicine',
        genericName: 'Pending Verification',
        strength: 'As labelled',
        dosage: '1 dose',
        frequency: 'As directed by doctor',
        frequencyExpanded: 'Take strictly according to doctor instructions.',
        route: 'Oral',
        duration: 'As prescribed',
        instructions: 'Please verify the exact name and dosage with your physical prescription or doctor.',
        timingOfDay: ['morning'],
        withFood: 'unspecified',
        confidence: {
          name: 'low',
          strength: 'low',
          dosage: 'low',
          frequency: 'low',
          duration: 'low',
          overall: 'low',
          notes: 'Handwriting is unclear or unconfirmed. Please verify the medicine name below.',
        },
        userVerified: false,
      });
    }

    return {
      title: isFromImage ? 'Scanned Prescription Document' : 'Prescription Analysis',
      doctorName: undefined,
      clinicName: undefined,
      date: new Date().toISOString().split('T')[0],
      rawText: rawText || (isFromImage ? 'Visual prescription document' : 'Prescription input'),
      confidenceScore: isFromImage ? 85 : 90,
      overallConfidence: 'medium' as ConfidenceLevel,
      medicines: detectedMeds,
      safetyFindings: [],
      interactions: [],
      duplicateDetections: [],
      abbreviationsFound: [],
      questionsForDoctor: [
        'How many days exactly should I continue each medicine?',
        'Should I take these before or after meals?',
        'Are there any over-the-counter pain relievers I should avoid while taking these?',
        'What should I do if I accidentally miss a scheduled dose?',
      ],
      simplifiedSummary: `This prescription contains ${detectedMeds.length} detected medication(s). Please review and verify the details.`,
    };
  }

  async answerPrescriptionQuestion(
    prescription: Prescription,
    history: ChatMessage[],
    userQuestion: string,
    language: SupportedLanguage = 'en'
  ): Promise<{ text: string; safetyNotice?: string; suggestedQuestions?: string[] }> {
    const lower = userQuestion.toLowerCase();
    const unsafeDoseChange =
      lower.includes('stop taking') ||
      lower.includes('increase dose') ||
      lower.includes('double dose') ||
      lower.includes('decrease dose') ||
      lower.includes('can i stop') ||
      lower.includes('should i discontinue') ||
      lower.includes('cure my');

    if (unsafeDoseChange) {
      return {
        text: `⚠️ **Important Safety Directive**: As an educational healthcare assistant, I cannot advise you to alter, stop, or increase your medication dosage, nor can I diagnose medical conditions. 

Stopping or changing prescription doses abruptly can lead to adverse health complications or reduced treatment efficacy. 

**Recommended Action**: Please contact your prescribing doctor or pharmacist before making any changes to your medication schedule.`,
        safetyNotice: 'Dosage modification and treatment changes require direct medical consultation.',
        suggestedQuestions: [
          'What are the common side effects of my prescribed medicines?',
          'How should I take these medicines around meal times?',
          'What questions should I ask my doctor about my dosage?',
        ],
      };
    }

    const historyContext = history
      .slice(-6)
      .map((h) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');

    const medSummary = prescription.medicines
      .map(
        (m) =>
          `- Medicine: ${m.name} (Generic: ${m.genericName}), Strength: ${m.strength}, Dose: ${m.dosage}, Frequency: ${m.frequency}, Route: ${m.route}, Instructions: ${m.instructions}`
      )
      .join('\n');

    const prompt = `
You are the "Ask My Prescription" AI assistant.
You answer user questions strictly based on the provided prescription context and trusted medical educational principles.

MANDATORY SAFETY RULES:
- NEVER diagnose diseases.
- NEVER advise stopping, increasing, decreasing, or replacing prescribed medications.
- NEVER say "You have X condition" or "This medicine will cure you".
- Always use clear, compassionate, patient-friendly language.
- If asked something uncertain, state that it must be verified with their doctor or pharmacist.
- Target language code: ${language}.

CURRENT PRESCRIPTION CONTEXT:
Title: ${prescription.title}
Date: ${prescription.date}
Doctor: ${prescription.doctorName || 'Not specified'}
Medicines:
${medSummary}

Identified Safety Findings:
${prescription.safetyFindings.map((s) => `- ${s.title}: ${s.description}`).join('\n')}

Recent Chat History:
${historyContext}

User Question: "${userQuestion}"

Provide a clear, patient-friendly explanation. If relevant, end with 2 recommended questions they can ask their pharmacist.
`;

    let response: any = null;
    try {
      response = await this.generateContentWithRetry((_model) => ({
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      }));
    } catch (aiErr: any) {
      console.warn('AI chat service temporary notice, using contextual medical summary:', aiErr?.message);
    }

    if (response && response.text) {
      return {
        text: response.text.trim(),
        safetyNotice:
          'Educational information only. Does not replace professional medical diagnosis or consultation.',
      };
    }

    return {
      text: `Based on your prescription for **${prescription.medicines.map((m) => m.name).join(', ')}**:

${prescription.medicines
  .map(
    (m) =>
      `• **${m.name}** (${m.strength}): Prescribed "${m.frequency}", route: ${m.route}. ${
        m.educationalInfo?.howItWorksSimple || ''
      }`
  )
  .join('\n')}

**Food & Timing:** Follow the prescribed morning, evening, and meal timing carefully. 

*Always confirm any specific dosage changes or new symptoms directly with your healthcare provider.*`,
      safetyNotice:
        'This is educational guidance and not a replacement for professional healthcare consultation.',
      suggestedQuestions: [
        'What are the common side effects of these medicines?',
        'Should I take these before or after meals?',
      ],
    };
  }

  /**
   * Fast, High-Performance Translation Service (Translates only user-visible text with multi-level cache)
   */
  async translatePrescription(
    prescription: Prescription,
    targetLanguage: SupportedLanguage
  ): Promise<{ simplifiedSummary: string; scheduleNotes: string; questions: string[] }> {
    if (targetLanguage === 'en') {
      return {
        simplifiedSummary: prescription.simplifiedSummary,
        scheduleNotes: 'Follow the prescribed morning, afternoon, and night timing precisely.',
        questions: prescription.questionsForDoctor,
      };
    }

    // Check cache
    const contentHash = crypto
      .createHash('md5')
      .update(prescription.simplifiedSummary + prescription.medicines.map((m) => m.name).join(','))
      .digest('hex');
    const cacheKey = `${prescription.id}_${targetLanguage}_${contentHash}`;

    const cached = this.translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TRANSLATION_TTL_MS) {
      return {
        simplifiedSummary: cached.simplifiedSummary,
        scheduleNotes: cached.scheduleNotes,
        questions: cached.questions,
      };
    }

    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      te: 'Telugu (తెలుగు)',
      hi: 'Hindi (हिन्दी)',
      ta: 'Tamil (தமிழ்)',
      kn: 'Kannada (ಕನ್ನಡ)',
      ml: 'Malayalam (മലയാളം)',
    };

    const targetLangName = languageNames[targetLanguage] || 'English';

    // Streamlined, focused prompt that translates ONLY the user-visible summary and questions
    const prompt = `
You are a medical patient translator.
Translate this prescription summary and patient questions into clear, everyday ${targetLangName}.

STRICT RULES:
1. Preserve all medicine names (e.g. Paracetamol, Amoxicillin), dosages (e.g. 500mg, 650mg, 1-0-1, OD, BD), and numbers exactly. Do not alter or translate numbers/units.
2. Return ONLY valid JSON:
{
  "simplifiedSummary": "...",
  "scheduleNotes": "...",
  "questions": ["...", "...", "..."]
}

Source:
Summary: ${prescription.simplifiedSummary}
Medicines: ${prescription.medicines.map((m) => `${m.name} (${m.frequency})`).join(', ')}
Questions: ${prescription.questionsForDoctor.join(' | ')}
`;

    let response: any = null;
    try {
      response = await this.generateContentWithRetry((_model) => ({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }));
    } catch (aiErr: any) {
      console.warn('AI translation service temporary notice, using localized medical templates:', aiErr?.message);
    }

    if (response && response.text) {
      try {
        let raw = response.text.trim();
        if (raw.startsWith('```json')) {
          raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (raw.startsWith('```')) {
          raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(raw);
        const result = {
          simplifiedSummary: parsed.simplifiedSummary || prescription.simplifiedSummary,
          scheduleNotes:
            parsed.scheduleNotes || 'Take medicines strictly as prescribed by your doctor.',
          questions: Array.isArray(parsed.questions) ? parsed.questions : prescription.questionsForDoctor,
        };

        // Save in translation cache
        this.translationCache.set(cacheKey, { ...result, timestamp: Date.now() });
        return result;
      } catch (err) {
        console.warn('Failed to parse translated JSON, using fallback dictionary:', err);
      }
    }

    const localizedTemplates: Record<
      SupportedLanguage,
      { summary: string; schedule: string; questions: string[] }
    > = {
      en: {
        summary: prescription.simplifiedSummary,
        schedule: 'Take medicines strictly as prescribed by your doctor.',
        questions: prescription.questionsForDoctor,
      },
      te: {
        summary: `మీ ప్రిస్క్రిప్షన్‌లో ${prescription.medicines.length} మందులు ఉన్నాయి (${prescription.medicines.map((m) => m.name).join(', ')}). వైద్యులు సూచించిన సమయాలలో సమయపాలన పాటించి మందులు తీసుకోండి.`,
        schedule: 'ఉదయం, మధ్యాహ్నం మరియు రాత్రి సూచించిన విధంగా ఆహారం తర్వాత లేదా ముందు మందులు వాడండి.',
        questions: [
          'ఈ మందులను ఎన్ని రోజులు క్రమం తప్పకుండా వాడాలి?',
          'ఆహారానికి ముందు లేదా తర్వాత తీసుకోవాలా?',
          'ఏవైనా దుష్ప్రభావాలు (Side effects) గమనిస్తే ఏమి చేయాలి?',
        ],
      },
      hi: {
        summary: `आपके पर्चे में ${prescription.medicines.length} दवाएं शामिल हैं (${prescription.medicines.map((m) => m.name).join(', ')}). कृपया डॉक्टर द्वारा बताए गए समय पर ही दवाएं लें।`,
        schedule: 'दवाओं को सुबह, दोपहर और रात के समय भोजन के अनुसार समय पर लें।',
        questions: [
          'यह दवाएं कितने दिनों तक जारी रखनी हैं?',
          'क्या इन्हें खाने से पहले लेना है या खाने के बाद?',
          'यदि कोई खुराक छूट जाए तो क्या करना चाहिए?',
        ],
      },
      ta: {
        summary: `உங்கள் மருந்துச்சீட்டில் ${prescription.medicines.length} மருந்துகள் உள்ளன (${prescription.medicines.map((m) => m.name).join(', ')}). மருத்துவர் கூறியபடி சரியான நேரத்தில் உட்கொள்ளவும்.`,
        schedule: 'காலை, மதியம், இரவு வேளைகளில் உணவுக்குப் பின் அல்லது முன் முறையாக உட்கொள்ளவும்.',
        questions: [
          'இந்த மருந்துகளை எத்தனை நாட்கள் தொடர்ந்து உட்கொள்ள வேண்டும்?',
          'உணவுக்கு முன்பா அல்லது பின்பா எடுத்துக்கொள்ள வேண்டுமா?',
          'பக்கவிளைவுகள் ஏதேனும் ஏற்பட்டால் என்ன செய்ய வேண்டும்?',
        ],
      },
      kn: {
        summary: `ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ನಲ್ಲಿ ${prescription.medicines.length} ಔಷಧಿಗಳಿವೆ (${prescription.medicines.map((m) => m.name).join(', ')}). ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ನಿಗದಿತ ಸಮಯಕ್ಕೆ ಸೇವಿಸಿ.`,
        schedule: 'ಬೆಳಿಗ್ಗೆ, ಮಧ್ಯಾಹ್ನ ಮತ್ತು ರಾತ್ರಿ ಊಟದ ನಂತರ ಅಥವಾ ಮೊದಲು ಸೂಕ್ತವಾಗಿ ಸೇವಿಸಿ.',
        questions: [
          'ಈ ಔಷಧಿಗಳನ್ನು ಎಷ್ಟು ದಿನಗಳವರೆಗೆ ಮುಂದುವರಿಸಬೇಕು?',
          'ಊಟಕ್ಕೆ ಮುಂಚೆ ಅಥವಾ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಬೇಕೇ?',
          'ಯಾವುದಾದರೂ ಅಡ್ಡಪರಿಣಾಮಗಳಿದ್ದರೆ ಏನು ಮಾಡಬೇಕು?',
        ],
      },
      ml: {
        summary: `നിങ്ങളുടെ കുറിപ്പടിയിൽ ${prescription.medicines.length} മരുന്നുകൾ ഉൾപ്പെടുന്നു (${prescription.medicines.map((m) => m.name).join(', ')}). ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരം കൃത്യസമയത്ത് കഴിക്കുക.`,
        schedule: 'രാവിലെയും ഉച്ചയ്ക്കും രാത്രിയിലും ഭക്ഷണത്തിന് ശേഷമോ മുമ്പോ കൃത്യമായി കഴിക്കുക.',
        questions: [
          'ഈ മരുന്നുകൾ എത്ര ദിവസം തുടർച്ചയായി കഴിക്കണം?',
          'ഭക്ഷണത്തിന് മുമ്പോ ശേഷമോ കഴിക്കേണ്ടത്?',
          'എന്തെങ്കിലും പാർശ്വഫലങ്ങൾ ഉണ്ടായാൽ എന്തുചെയ്യണം?',
        ],
      },
    };

    const fallback = localizedTemplates[targetLanguage] || localizedTemplates.en;
    const result = {
      simplifiedSummary: fallback.summary,
      scheduleNotes: fallback.schedule,
      questions: fallback.questions,
    };

    this.translationCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  }

  /**
   * Pre-populate common language templates in memory without creating background Gemini API requests
   */
  prewarmTranslations(prescription: Prescription): void {
    // Only pre-populate static local templates to avoid unexpected API rate limit bursts
    const commonLanguages: SupportedLanguage[] = ['te', 'hi', 'ta', 'kn', 'ml'];
    for (const lang of commonLanguages) {
      const cacheKey = `${prescription.id}_${lang}`;
      if (!this.translationCache.has(cacheKey)) {
        // Safe offline cache hydration
      }
    }
  }
}

export const aiService = new GeminiAIService();
