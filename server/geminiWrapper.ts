import { GenerateContentResponse, GoogleGenAI, ThinkingLevel } from '@google/genai';
import { GeminiQuotaExceededError, GeminiServiceUnavailableError } from './errors';

/**
 * Mutex lock to ensure only ONE active Gemini API request executes at any given moment.
 * Subsequent requests queue safely, preventing concurrent request bursts that cause 429 quota exhaustion.
 */
class AsyncRequestLock {
  private isLocked = false;
  private waitingQueue: (() => void)[] = [];

  /**
   * Acquire the request lock. Resolves with an unlock function.
   */
  async acquire(): Promise<() => void> {
    if (!this.isLocked) {
      this.isLocked = true;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.release();
        }
      };
    }

    return new Promise<() => void>((resolve) => {
      this.waitingQueue.push(() => {
        this.isLocked = true;
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.release();
          }
        });
      });
    });
  }

  private release() {
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift();
      if (next) {
        next();
      }
    } else {
      this.isLocked = false;
    }
  }

  /**
   * Check if a request is currently active
   */
  get locked(): boolean {
    return this.isLocked;
  }
}

export interface GeminiRequestOptions {
  client: GoogleGenAI;
  buildRequest: (modelName: string) => { contents: any; config?: any };
  primaryModel?: string;
  availabilityFallbackModel?: string;
  lowThinking?: boolean;
}

export class GeminiRequestWrapper {
  private static lock = new AsyncRequestLock();
  private static readonly PRIMARY_MODEL = 'gemini-3.1-flash-lite';
  private static readonly AVAILABILITY_FALLBACK_MODEL = 'gemini-3.8-flash';
  private static readonly BACKUP_FALLBACK_MODEL = 'gemini-3.7-flash';

  /**
   * Check if an error represents 429 RESOURCE_EXHAUSTED or Quota Limits
   */
  static isQuotaExhaustedError(err: any): boolean {
    if (!err) return false;
    const errMsg = err?.message || String(err);
    const errStatus = err?.status || err?.error?.status;
    const errCode = err?.code || err?.error?.code;

    return (
      errStatus === 'RESOURCE_EXHAUSTED' ||
      errStatus === 429 ||
      errCode === 429 ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('Quota exceeded') ||
      errMsg.includes('429') ||
      errMsg.includes('free_tier_requests') ||
      errMsg.includes('GenerateRequestsPer') ||
      errMsg.includes('rate-limit')
    );
  }

  /**
   * Check if an error represents 503 Service Unavailable / High Demand
   */
  static isServiceUnavailableError(err: any): boolean {
    if (!err) return false;
    const errMsg = err?.message || String(err);
    const errStatus = err?.status || err?.error?.status;
    const errCode = err?.code || err?.error?.code;

    return (
      errStatus === 'UNAVAILABLE' ||
      errStatus === 503 ||
      errCode === 503 ||
      err?.error?.code === 503 ||
      err?.error?.status === 'UNAVAILABLE' ||
      errMsg.includes('503') ||
      errMsg.includes('high demand') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('UNAVAILABLE') ||
      errMsg.includes('Service Unavailable')
    );
  }

  /**
   * Check if an error is a transient socket/network error
   */
  static isTransientNetworkError(err: any): boolean {
    if (!err) return false;
    const errMsg = err?.message || String(err);
    return (
      errMsg.includes('fetch failed') ||
      errMsg.includes('ECONNRESET') ||
      errMsg.includes('ETIMEDOUT') ||
      errMsg.includes('socket hang up') ||
      err?.name === 'TypeError' ||
      err?.name === 'FetchError'
    );
  }

  /**
   * Executes a Gemini API call protected by the global request lock and strict error handling.
   * - Ensures only ONE request executes at a time.
   * - On 429: Immediately stops retries, does NOT cycle models, returns user-friendly error.
   * - On 503: Performs a single controlled backoff retry, then falls back to availability model if needed.
   */
  static async execute<T = GenerateContentResponse>(options: GeminiRequestOptions): Promise<T> {
    const {
      client,
      buildRequest,
      primaryModel = this.PRIMARY_MODEL,
      availabilityFallbackModel = this.AVAILABILITY_FALLBACK_MODEL,
      lowThinking = true,
    } = options;

    if (!client) {
      throw new GeminiServiceUnavailableError('Gemini API client is not configured.');
    }

    // Acquire request lock to guarantee single active Gemini request execution
    const releaseLock = await this.lock.acquire();

    try {
      const candidateModels = [
        primaryModel,
        availabilityFallbackModel,
        this.BACKUP_FALLBACK_MODEL,
        'gemini-3.1-pro-preview',
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
        const model = candidateModels[modelIdx];
        const hasNextModel = modelIdx < candidateModels.length - 1;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const req = buildRequest(model);
            const config = { ...req.config };

            if (lowThinking) {
              config.thinkingConfig = { thinkingBudget: 0 };
            }

            const response = await client.models.generateContent({
              model,
              contents: req.contents,
              config,
            });

            if (response) {
              return response as unknown as T;
            }
          } catch (err: any) {
            const errMsg = err?.message || String(err);

            // 1. Quota Exhaustion (429): If a specific model hit its quota limit, switch to alternate model if available
            if (this.isQuotaExhaustedError(err)) {
              if (hasNextModel) {
                const nextModel = candidateModels[modelIdx + 1];
                console.info(
                  `Model ${model} quota notice (429), failing over to candidate model ${nextModel}...`
                );
                break;
              }
              console.warn(
                `Gemini API quota limit reached (429). Halting request pipeline without cycling models.`
              );
              throw new GeminiQuotaExceededError(
                'Gemini API quota has been reached. Please try again later or check your Gemini API quota.',
                err?.details
              );
            }

            const is503 = this.isServiceUnavailableError(err);
            const isNetwork = this.isTransientNetworkError(err);
            const isNotFound = errMsg.includes('404') || errMsg.includes('not found') || err?.status === 404;

            // 2. If model is 503 (high demand) and an alternate model is available, fail over immediately
            if ((is503 || isNotFound) && hasNextModel) {
              const nextModel = candidateModels[modelIdx + 1];
              console.info(`Model ${model} high demand notice (503), immediately switching to ${nextModel}...`);
              break; // Proceed to next candidate model immediately without waiting
            }

            // 3. Transient Network glitch on attempt 1: single backoff retry
            if (isNetwork && attempt === 1) {
              console.info(`Transient socket/network retry for ${model}...`);
              await new Promise((r) => setTimeout(r, 700));
              continue;
            }

            // 4. Last candidate model on 503 attempt 1: single backoff retry
            if (is503 && attempt === 1) {
              console.info(`Model ${model} high demand notice (503), retrying with backoff...`);
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }

            // 5. Fallback on network or 404 if more models exist
            if ((isNetwork || isNotFound) && hasNextModel) {
              break;
            }

            // Exhausted candidate models
            if (!hasNextModel) {
              if (is503) {
                throw new GeminiServiceUnavailableError(
                  'Gemini AI service is temporarily experiencing high demand. Please try again in a moment.'
                );
              }
              throw err;
            }
            break;
          }
        }
      }

      throw new GeminiServiceUnavailableError('Gemini AI service was unable to return a response.');
    } finally {
      releaseLock();
    }
  }

  /**
   * Helper to run an arbitrary task with the global Gemini request lock
   */
  static async runWithLock<R>(task: () => Promise<R>): Promise<R> {
    const releaseLock = await this.lock.acquire();
    try {
      return await task();
    } finally {
      releaseLock();
    }
  }
}
