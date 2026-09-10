import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Explicitly load .env file from project root / current working directory
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

/**
 * Resolves the Gemini API Key from environment variables.
 * Standardizes access across supported alias names:
 * - GEMINI_API_KEY
 * - GOOGLE_GEMINI_API_KEY
 * - GOOGLE_GENAI_API_KEY
 * - GOOGLE_API_KEY
 */
export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  return key?.trim() || undefined;
}

/**
 * Resolves the Google Cloud Vision API Key from environment variables.
 * Standardizes access across supported alias names:
 * - GOOGLE_CLOUD_VISION_API_KEY
 * - GOOGLE_VISION_API_KEY
 * - GOOGLE_API_KEY
 * - GEMINI_API_KEY (Unified Google Cloud key fallback)
 */
export function getGoogleVisionApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_CLOUD_VISION_API_KEY ||
    process.env.GOOGLE_VISION_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;
  return key?.trim() || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function isGoogleVisionConfigured(): boolean {
  return Boolean(getGoogleVisionApiKey());
}

// Cross-populate standard process.env variables so any direct process.env reads stay consistent
const activeGeminiKey = getGeminiApiKey();
if (activeGeminiKey) {
  if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = activeGeminiKey;
  if (!process.env.GOOGLE_GEMINI_API_KEY) process.env.GOOGLE_GEMINI_API_KEY = activeGeminiKey;
}

const activeVisionKey = getGoogleVisionApiKey();
if (activeVisionKey) {
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) process.env.GOOGLE_CLOUD_VISION_API_KEY = activeVisionKey;
  if (!process.env.GOOGLE_VISION_API_KEY) process.env.GOOGLE_VISION_API_KEY = activeVisionKey;
}

/**
 * Prints service configuration status during server startup.
 * NEVER logs actual API keys.
 */
export function logStartupStatus(): void {
  const gemini = isGeminiConfigured();
  const vision = isGoogleVisionConfigured();

  console.log('\n====================================================');
  console.log(' Medical Prescription Simplifier - Service Status');
  console.log('====================================================');
  console.log(`Gemini API:         ${gemini ? 'configured' : 'missing'}`);
  console.log(`Google Vision API:  ${vision ? 'configured' : 'missing'}`);
  console.log(`Environment:        ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port:               ${process.env.PORT || 3000}`);
  console.log('====================================================');

  if (!gemini) {
    console.warn('⚠️  Warning: Gemini API is not configured. Add GEMINI_API_KEY to your .env file.');
  }
  if (!vision) {
    console.info('ℹ️  Note: Google Cloud Vision API key is not configured. Direct Gemini Multimodal Vision will be used for image extraction.');
  }
  console.log('');
}
