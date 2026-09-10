import crypto from 'crypto';
import { getGoogleVisionApiKey } from './config';

export interface VisionOCRLine {
  text: string;
  confidence: number;
  topRatio: number;
  bottomRatio: number;
  leftRatio: number;
  rightRatio: number;
}

export interface VisionOCRResult {
  fullText: string;
  lines: VisionOCRLine[];
  confidence: number;
  isHandwritten: boolean;
  detectedLanguages: string[];
  provider: 'google_cloud_vision' | 'fallback_multimodal';
  error?: string;
}

export class GoogleVisionService {
  private static instance: GoogleVisionService;
  private static cache = new Map<string, { result: VisionOCRResult; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
  public static isBillingOrServiceDisabled = false;

  public static getInstance(): GoogleVisionService {
    if (!GoogleVisionService.instance) {
      GoogleVisionService.instance = new GoogleVisionService();
    }
    return GoogleVisionService.instance;
  }

  public static isAvailable(): boolean {
    return !GoogleVisionService.isBillingOrServiceDisabled;
  }

  /**
   * Retrieves the best available Google Cloud Vision API Key from environment variables.
   */
  public getApiKey(): string | undefined {
    return getGoogleVisionApiKey();
  }

  private hashImage(base64: string): string {
    return crypto.createHash('sha256').update(base64).digest('hex');
  }

  /**
   * Performs high-accuracy OCR via Google Cloud Vision API (DOCUMENT_TEXT_DETECTION + TEXT_DETECTION)
   */
  public async extractTextFromImage(imageBase64: string): Promise<VisionOCRResult> {
    if (GoogleVisionService.isBillingOrServiceDisabled) {
      return {
        fullText: '',
        lines: [],
        confidence: 0,
        isHandwritten: false,
        detectedLanguages: [],
        provider: 'fallback_multimodal',
        error: 'Google Cloud Vision billing inactive. Direct Gemini Multimodal Vision activated.',
      };
    }

    const cleanBase64 = imageBase64
      .replace(/^data:[^;]+;base64,/, '')
      .replace(/\s+/g, '');

    if (!cleanBase64) {
      return {
        fullText: '',
        lines: [],
        confidence: 0,
        isHandwritten: false,
        detectedLanguages: [],
        provider: 'google_cloud_vision',
        error: 'Empty image data provided for Vision OCR.',
      };
    }

    // Check in-memory hash cache
    const cacheKey = `gcv_${this.hashImage(cleanBase64)}`;
    const cached = GoogleVisionService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GoogleVisionService.CACHE_TTL_MS) {
      return cached.result;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('Google Cloud Vision API is not configured. Add the required API key to your .env file.');
      return {
        fullText: '',
        lines: [],
        confidence: 0,
        isHandwritten: false,
        detectedLanguages: [],
        provider: 'fallback_multimodal',
        error: 'Google Cloud Vision API is not configured. Add the required API key to your .env file.',
      };
    }

    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: cleanBase64,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 50,
            },
            {
              type: 'TEXT_DETECTION',
              maxResults: 50,
            },
          ],
          imageContext: {
            languageHints: ['en', 'hi', 'te'],
          },
        },
      ],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Medical-Prescription-Simplifier/1.0',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        if (errMsg.includes('billing to be enabled') || errMsg.includes('billing') || response.status === 403) {
          GoogleVisionService.isBillingOrServiceDisabled = true;
          console.info('Google Cloud Vision notice: Project billing inactive. Automatically routing to Google Gemini Multimodal Vision engine.');
        } else {
          console.warn(`Google Cloud Vision API notice: ${errMsg}. Routing to Google Gemini Multimodal Vision engine.`);
        }
        return {
          fullText: '',
          lines: [],
          confidence: 0,
          isHandwritten: false,
          detectedLanguages: [],
          provider: 'fallback_multimodal',
          error: `Vision API Note: ${errMsg}`,
        };
      }

      const data = await response.json();
      const annotation = data?.responses?.[0];

      if (!annotation) {
        return {
          fullText: '',
          lines: [],
          confidence: 0,
          isHandwritten: false,
          detectedLanguages: [],
          provider: 'google_cloud_vision',
          error: 'No text annotation in Google Cloud Vision response.',
        };
      }

      if (annotation.error) {
        console.warn(`Vision API annotation error: ${annotation.error.message}`);
        return {
          fullText: '',
          lines: [],
          confidence: 0,
          isHandwritten: false,
          detectedLanguages: [],
          provider: 'fallback_multimodal',
          error: `Vision API Error: ${annotation.error.message}`,
        };
      }

      const fullText = annotation.fullTextAnnotation?.text || annotation.textAnnotations?.[0]?.description || '';
      const lines: VisionOCRLine[] = [];
      const detectedLanguages: string[] = [];
      let totalConfidence = 0;
      let symbolCount = 0;
      let isHandwritten = false;

      // Extract detailed page, block, paragraph, and word structures from DOCUMENT_TEXT_DETECTION
      const pages = annotation.fullTextAnnotation?.pages || [];
      for (const page of pages) {
        if (page.property?.detectedLanguages) {
          for (const lang of page.property.detectedLanguages) {
            if (lang.languageCode && !detectedLanguages.includes(lang.languageCode)) {
              detectedLanguages.push(lang.languageCode);
            }
          }
        }

        const pageWidth = page.width || 1000;
        const pageHeight = page.height || 1000;

        for (const block of page.blocks || []) {
          if (block.blockType === 'TEXT' || !block.blockType) {
            for (const paragraph of block.paragraphs || []) {
              let paragraphText = '';
              let minX = 1, minY = 1, maxX = 0, maxY = 0;
              let paraConfidence = paragraph.confidence || 0.85;

              // Calculate bounding box and words
              for (const word of paragraph.words || []) {
                let wordText = '';
                for (const symbol of word.symbols || []) {
                  wordText += symbol.text;
                  if (symbol.confidence) {
                    totalConfidence += symbol.confidence;
                    symbolCount++;
                  }
                }
                paragraphText += (paragraphText ? ' ' : '') + wordText;

                for (const vertex of word.boundingBox?.vertices || []) {
                  const x = (vertex.x ?? 0) / pageWidth;
                  const y = (vertex.y ?? 0) / pageHeight;
                  if (x < minX) minX = Math.max(0, x);
                  if (x > maxX) maxX = Math.min(1, x);
                  if (y < minY) minY = Math.max(0, y);
                  if (y > maxY) maxY = Math.min(1, y);
                }
              }

              if (paragraphText.trim()) {
                lines.push({
                  text: paragraphText.trim(),
                  confidence: Math.round(paraConfidence * 100),
                  topRatio: Math.min(1, Math.max(0, minY)),
                  bottomRatio: Math.min(1, Math.max(0, maxY)),
                  leftRatio: Math.min(1, Math.max(0, minX)),
                  rightRatio: Math.min(1, Math.max(0, maxX)),
                });
              }
            }
          }
        }
      }

      // If document text pages were empty, fallback to textAnnotations
      if (lines.length === 0 && annotation.textAnnotations && annotation.textAnnotations.length > 1) {
        for (let i = 1; i < annotation.textAnnotations.length; i++) {
          const item = annotation.textAnnotations[i];
          lines.push({
            text: item.description || '',
            confidence: 85,
            topRatio: 0,
            bottomRatio: 1,
            leftRatio: 0,
            rightRatio: 1,
          });
        }
      }

      const avgConfidence = symbolCount > 0
        ? Math.round((totalConfidence / symbolCount) * 100)
        : fullText.length > 0 ? 88 : 0;

      // Handwriting heuristic: check if avgConfidence is slightly lower or words have variable spacing
      if (avgConfidence < 85 || (annotation.fullTextAnnotation?.pages?.[0]?.blocks || []).length > 5) {
        isHandwritten = true;
      }

      const finalResult: VisionOCRResult = {
        fullText: fullText.trim(),
        lines,
        confidence: avgConfidence,
        isHandwritten,
        detectedLanguages: detectedLanguages.length > 0 ? detectedLanguages : ['en'],
        provider: 'google_cloud_vision',
      };

      GoogleVisionService.cache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
      return finalResult;
    } catch (err: any) {
      console.error('Google Cloud Vision fetch exception:', err?.message || err);
      return {
        fullText: '',
        lines: [],
        confidence: 0,
        isHandwritten: false,
        detectedLanguages: [],
        provider: 'fallback_multimodal',
        error: `Vision API Network Exception: ${err?.message || String(err)}`,
      };
    }
  }
}

export const googleVisionService = GoogleVisionService.getInstance();
