import './server/config';
import { isGeminiConfigured, isGoogleVisionConfigured, logStartupStatus } from './server/config';

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { aiService } from './server/aiService';
import { db } from './server/db';
import {
  GeminiQuotaExceededError,
  GeminiServiceUnavailableError,
  VisionError,
  OcrEmptyError,
  InvalidImageError,
  InvalidGeminiResponseError,
  ServerError,
  PrescriptionExtractionFailedError,
} from './server/errors';
import { googleVisionService } from './server/googleVisionService';
import { KNOWN_DRUG_DATABASE, KNOWN_INTERACTIONS, MEDICAL_ABBREVIATIONS } from './server/medicalKnowledge';
import { BenchmarkEvaluator } from './server/testSuite';
import { TestingService } from './server/testingService';
import { FeedbackDatasetService } from './server/feedbackDatasetService';
import { BatchQueueService } from './server/batchQueueService';
import { Medicine, MedicineScheduleItem, Prescription, SupportedLanguage } from './src/types';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Enable CORS for localhost frontend development and cross-origin access
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'Accept'],
    })
  );

  // JSON Body Parser with 50MB limit for high-resolution prescription images/PDFs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Config Status & Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Medical Prescription Simplifier API',
      aiModel: isGeminiConfigured() ? 'gemini-3.7-flash' : 'local-medical-engine',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/config/status', (req: Request, res: Response) => {
    const hasVisionKey = isGoogleVisionConfigured();
    const hasGeminiKey = isGeminiConfigured();

    res.json({
      status: 'ok',
      visionConfigured: hasVisionKey,
      geminiConfigured: hasGeminiKey,
      ocrEngine: hasVisionKey ? 'Google Cloud Vision API (DOCUMENT_TEXT_DETECTION)' : 'Gemini Multimodal Vision',
      reasoningEngine: 'Google Gemini 3.7 / Flash Multimodal',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Helper auth session extractor
  const getUserIdFromReq = (req: Request): string => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return (req.headers['x-user-id'] as string) || 'demo_user_001';
  };

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/demo-login', (req: Request, res: Response) => {
    let demoUser = db.getUser('demo_user_001');
    if (!demoUser) {
      demoUser = db.createUser({
        id: 'demo_user_001',
        email: 'patient@healthsafe.org',
        name: 'Alex Morgan',
      });
    }
    res.json({
      token: demoUser.id,
      user: demoUser,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    let user = db.getUserByEmail(email);
    if (!user) {
      user = db.createUser({
        email,
        name: email.split('@')[0],
      });
    }
    res.json({
      token: user.id,
      user,
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, name, allergies, conditions, isPregnant, ageGroup, preferredLanguage } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    let existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    const user = db.createUser({
      email,
      name: name || email.split('@')[0],
      allergies: allergies || [],
      conditions: conditions || [],
      isPregnant: Boolean(isPregnant),
      ageGroup: ageGroup || 'adult',
      preferredLanguage: preferredLanguage || 'en',
    });
    res.json({
      token: user.id,
      user,
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }
    res.json({ user });
  });

  app.patch('/api/auth/profile', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const updated = db.updateUser(userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: updated });
  });

  // ----------------------------------------------------
  // PRESCRIPTION INPUT & OCR EXTRACTION
  // ----------------------------------------------------
  app.post('/api/prescriptions/upload', async (req: Request, res: Response) => {
    console.log('Prescription request received');
    try {
      const userId = getUserIdFromReq(req);
      const { text, imageBase64, mimeType, sourceType, language } = req.body;

      if (!text && !imageBase64) {
        const errorBody = {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'Please provide prescription text, an image, or a document file to analyze.',
          },
        };
        console.log('Final API response:', errorBody);
        return res.status(400).json(errorBody);
      }

      const cleanImageBase64 = imageBase64
        ? imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
        : undefined;
      const cleanMimeType = (mimeType || 'image/jpeg').replace(/;.*$/, '');

      const lang: SupportedLanguage = language || 'en';
      const extracted = await aiService.extractPrescription(
        { text, imageBase64: cleanImageBase64, mimeType: cleanMimeType },
        lang
      );

      console.log('Vision result:', {
        provider: extracted?.visionOcrResult?.provider || (cleanImageBase64 ? 'google_cloud_vision' : 'text_parser'),
        detectedLines: extracted?.visionOcrResult?.lines?.length || 0,
        ocrConfidence: extracted?.visionOcrResult?.confidence || 85,
      });

      console.log('Gemini result:', {
        medicinesDetected: extracted?.medicines?.length || 0,
        overallConfidence: extracted?.overallConfidence || 'medium',
        confidenceScore: extracted?.confidenceScore || 80,
      });

      if (!extracted.medicines || extracted.medicines.length === 0) {
        throw new PrescriptionExtractionFailedError(
          'No medicine information could be reliably extracted from this prescription.'
        );
      }

      // Build simplified schedule groups from extracted medicines according to doctor's explicit instructions
      const morningList: MedicineScheduleItem[] = [];
      const afternoonList: MedicineScheduleItem[] = [];
      const eveningList: MedicineScheduleItem[] = [];
      const bedtimeList: MedicineScheduleItem[] = [];
      const asNeededList: MedicineScheduleItem[] = [];
      const unclearList: MedicineScheduleItem[] = [];

      for (const med of extracted.medicines) {
        const item: MedicineScheduleItem = {
          medicineId: med.id,
          medicineName: med.name,
          strength: med.strength,
          dose: med.dosage,
          route: med.route,
          instructions: med.instructions,
          withFoodNotes:
            med.withFood === 'before_food'
              ? 'Take before food (empty stomach)'
              : med.withFood === 'with_food' || med.withFood === 'after_food'
              ? 'Take with or after food'
              : 'Follow package guidance',
          duration: med.duration,
          timingCategory: 'morning',
        };

        const timing = Array.isArray(med.timingOfDay) ? med.timingOfDay : [];
        if (timing.includes('morning')) morningList.push({ ...item, timingCategory: 'morning' });
        if (timing.includes('afternoon')) afternoonList.push({ ...item, timingCategory: 'afternoon' });
        if (timing.includes('evening')) eveningList.push({ ...item, timingCategory: 'evening' });
        if (timing.includes('bedtime')) bedtimeList.push({ ...item, timingCategory: 'bedtime' });
        if (timing.includes('as_needed')) asNeededList.push({ ...item, timingCategory: 'as_needed' });
        if (
          timing.includes('unclear') ||
          (!timing.includes('morning') &&
            !timing.includes('afternoon') &&
            !timing.includes('evening') &&
            !timing.includes('bedtime') &&
            !timing.includes('as_needed'))
        ) {
          unclearList.push({ ...item, timingCategory: 'unclear' });
        }
      }

      const prescription: Prescription = {
        id: `rx_${Date.now()}`,
        userId,
        title: extracted.title || 'New Extracted Prescription',
        doctorName: extracted.doctorName,
        clinicName: extracted.clinicName,
        date: extracted.date || new Date().toISOString().split('T')[0],
        sourceType: sourceType || (cleanImageBase64 ? 'image' : 'text'),
        rawInputText: text,
        imageUrl: cleanImageBase64 ? `data:${cleanMimeType};base64,${cleanImageBase64}` : undefined,
        overallConfidence: extracted.overallConfidence,
        confidenceScore: extracted.confidenceScore,
        status: 'extracted',
        medicines: extracted.medicines,
        simplifiedSchedule: {
          morning: morningList,
          afternoon: afternoonList,
          evening: eveningList,
          bedtime: bedtimeList,
          asNeeded: asNeededList,
          unclear: unclearList,
        },
        safetyFindings: extracted.safetyFindings,
        interactions: extracted.interactions,
        duplicateDetections: extracted.duplicateDetections,
        questionsForDoctor: extracted.questionsForDoctor,
        abbreviationsFound: extracted.abbreviationsFound,
        simplifiedSummary: extracted.simplifiedSummary,
        language: lang,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = db.savePrescription(prescription);

      // Pre-warm common language translations in background
      aiService.prewarmTranslations(saved);

      // Initialize assistant greeting
      db.addChatMessage(saved.id, {
        id: `msg_init_${Date.now()}`,
        prescriptionId: saved.id,
        sender: 'assistant',
        text: `I have extracted ${saved.medicines.length} medicine(s) from your prescription. Please verify the detected names, doses, and schedules below. You can ask me any questions about timing, abbreviations, or precautions!`,
        timestamp: new Date().toISOString(),
        suggestedQuestions: saved.questionsForDoctor.slice(0, 3),
      });

      const responsePayload = {
        success: true,
        data: {
          ...saved,
          doctor_instructions: saved.simplifiedSummary || (saved.doctorName ? `Prescribed by Dr. ${saved.doctorName}` : ''),
          warnings: (saved.safetyFindings || []).map((f) => f.title || f.description),
        },
      };

      console.log('Backend final response:', {
        success: true,
        medicineCount: responsePayload.data.medicines.length,
        prescriptionId: saved.id,
        confidenceScore: responsePayload.data.confidenceScore,
        schedule: {
          morning: responsePayload.data.simplifiedSchedule.morning.length,
          afternoon: responsePayload.data.simplifiedSchedule.afternoon.length,
          evening: responsePayload.data.simplifiedSchedule.evening.length,
          bedtime: responsePayload.data.simplifiedSchedule.bedtime.length,
          asNeeded: responsePayload.data.simplifiedSchedule.asNeeded.length,
          unclear: responsePayload.data.simplifiedSchedule.unclear.length,
        },
      });

      res.json(responsePayload);
    } catch (err: any) {
      console.error('Prescription processing error:', err);

      if (
        err instanceof PrescriptionExtractionFailedError ||
        err?.code === 'PRESCRIPTION_EXTRACTION_FAILED'
      ) {
        const errorBody = {
          success: false,
          error: {
            code: 'PRESCRIPTION_EXTRACTION_FAILED',
            message: err?.message || 'No medicine information could be reliably extracted from this prescription.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(422).json(errorBody);
      }

      if (
        err instanceof GeminiQuotaExceededError ||
        err?.code === 'GEMINI_QUOTA_EXCEEDED' ||
        err?.status === 429
      ) {
        const errorBody = {
          success: false,
          error: {
            code: 'GEMINI_QUOTA_EXCEEDED',
            message: 'Gemini API quota has been reached. Please try again later or check your Gemini API quota.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(429).json(errorBody);
      }

      if (
        err instanceof GeminiServiceUnavailableError ||
        err?.code === 'GEMINI_UNAVAILABLE' ||
        err?.code === 'SERVICE_UNAVAILABLE' ||
        err?.status === 503
      ) {
        const errorBody = {
          success: false,
          error: {
            code: 'GEMINI_UNAVAILABLE',
            message: err?.message || 'The AI service is temporarily experiencing high demand. Please try again shortly.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(503).json(errorBody);
      }

      if (err instanceof VisionError || err?.code === 'VISION_ERROR') {
        const errorBody = {
          success: false,
          error: {
            code: 'VISION_ERROR',
            message: err?.message || 'Failed to process document image with Google Cloud Vision OCR.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(502).json(errorBody);
      }

      if (err instanceof OcrEmptyError || err?.code === 'OCR_EMPTY') {
        const errorBody = {
          success: false,
          error: {
            code: 'OCR_EMPTY',
            message: err?.message || 'No legible text or medical prescriptions were detected in this image. Please upload a clearer photo or enter details manually.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(422).json(errorBody);
      }

      if (err instanceof InvalidImageError || err?.code === 'INVALID_IMAGE') {
        const errorBody = {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: err?.message || 'Invalid image format or corrupted file provided. Please provide a clear JPEG, PNG, or WebP image.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(400).json(errorBody);
      }

      if (err instanceof InvalidGeminiResponseError || err?.code === 'INVALID_GEMINI_RESPONSE') {
        const errorBody = {
          success: false,
          error: {
            code: 'INVALID_GEMINI_RESPONSE',
            message: err?.message || 'AI model generated an incomplete or invalid response format.',
          },
        };
        console.log('Backend final response:', errorBody);
        return res.status(502).json(errorBody);
      }

      const errorBody = {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err?.message || 'An unexpected internal error occurred while analyzing the prescription.',
        },
      };
      console.log('Backend final response:', errorBody);
      res.status(500).json(errorBody);
    }
  });

  app.post('/api/prescriptions/manual', (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromReq(req);
      const { title, doctorName, clinicName, date, medicines } = req.body;

      if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ error: 'At least one medicine must be provided' });
      }

      const formattedMeds: Medicine[] = medicines.map((m: any, idx: number) => ({
        id: m.id || `med_${Date.now()}_${idx}`,
        name: m.name || 'Unspecified Medicine',
        brandName: m.brandName,
        genericName: m.genericName || m.name,
        strength: m.strength || 'Standard dose',
        dosage: m.dosage || '1 tablet',
        frequency: m.frequency || 'Once daily',
        frequencyExpanded: m.frequencyExpanded || m.frequency,
        route: m.route || 'Oral',
        duration: m.duration || 'As prescribed',
        instructions: m.instructions || 'Take as instructed by doctor.',
        timingOfDay: m.timingOfDay || ['morning'],
        withFood: m.withFood || 'unspecified',
        confidence: {
          name: 'high' as const,
          strength: 'high' as const,
          dosage: 'high' as const,
          frequency: 'high' as const,
          duration: 'high' as const,
          overall: 'high' as const,
          notes: 'Manually confirmed by patient.',
        },
        userVerified: true,
        educationalInfo: m.educationalInfo || KNOWN_DRUG_DATABASE[m.name.toLowerCase()] || undefined,
      }));

      const morningList: MedicineScheduleItem[] = [];
      const afternoonList: MedicineScheduleItem[] = [];
      const eveningList: MedicineScheduleItem[] = [];
      const bedtimeList: MedicineScheduleItem[] = [];
      const asNeededList: MedicineScheduleItem[] = [];
      const unclearList: MedicineScheduleItem[] = [];

      for (const med of formattedMeds) {
        const item: MedicineScheduleItem = {
          medicineId: med.id,
          medicineName: med.name,
          strength: med.strength,
          dose: med.dosage,
          route: med.route,
          instructions: med.instructions,
          withFoodNotes: med.withFood === 'before_food' ? 'Before food' : 'With or after food',
          duration: med.duration,
          timingCategory: 'morning',
        };

        if (med.timingOfDay.includes('morning')) morningList.push({ ...item, timingCategory: 'morning' });
        if (med.timingOfDay.includes('afternoon')) afternoonList.push({ ...item, timingCategory: 'afternoon' });
        if (med.timingOfDay.includes('evening')) eveningList.push({ ...item, timingCategory: 'evening' });
        if (med.timingOfDay.includes('bedtime')) bedtimeList.push({ ...item, timingCategory: 'bedtime' });
        if (med.timingOfDay.includes('as_needed')) asNeededList.push({ ...item, timingCategory: 'as_needed' });
        if (med.timingOfDay.includes('unclear')) unclearList.push({ ...item, timingCategory: 'unclear' });
      }

      const prescription: Prescription = {
        id: `rx_${Date.now()}`,
        userId,
        title: title || 'Manual Prescription Entry',
        doctorName,
        clinicName,
        date: date || new Date().toISOString().split('T')[0],
        sourceType: 'manual',
        overallConfidence: 'high',
        confidenceScore: 98,
        status: 'verified',
        medicines: formattedMeds,
        simplifiedSchedule: {
          morning: morningList,
          afternoon: afternoonList,
          evening: eveningList,
          bedtime: bedtimeList,
          asNeeded: asNeededList,
          unclear: unclearList,
        },
        safetyFindings: [],
        interactions: [],
        duplicateDetections: [],
        questionsForDoctor: [
          'What are the common side effects I should anticipate?',
          'Should I take these medications with meals?',
          'What is the planned treatment duration?',
        ],
        abbreviationsFound: [],
        simplifiedSummary: `Manual entry with ${formattedMeds.length} medicine(s) recorded.`,
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = db.savePrescription(prescription);
      res.json(saved);
    } catch (err: any) {
      console.error('Manual prescription entry error:', err);
      res.status(500).json({ error: 'Failed to save manual prescription' });
    }
  });

  app.post('/api/prescriptions/demo', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const demo = db.resetDemoData(userId);
    res.json(demo);
  });

  app.get('/api/prescriptions', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const list = db.getPrescriptions(userId);
    res.json(list);
  });

  app.get('/api/prescriptions/:id', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const rx = db.getPrescription(req.params.id, userId);
    if (!rx) {
      return res.status(404).json({ error: 'Prescription not found or access denied' });
    }
    res.json(rx);
  });

  app.patch('/api/prescriptions/:id', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const rx = db.getPrescription(req.params.id, userId);
    if (!rx) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    const updated = db.savePrescription({
      ...rx,
      ...req.body,
      id: rx.id,
      userId: rx.userId,
    });
    res.json(updated);
  });

  app.delete('/api/prescriptions/:id', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const success = db.deletePrescription(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: 'Prescription not found or already deleted' });
    }
    res.json({ message: 'Prescription permanently deleted' });
  });

  // ----------------------------------------------------
  // "ASK MY PRESCRIPTION" AI CHAT
  // ----------------------------------------------------
  app.get('/api/prescriptions/:id/chat', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const rx = db.getPrescription(req.params.id, userId);
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });
    const messages = db.getChat(rx.id);
    res.json(messages);
  });

  app.post('/api/prescriptions/:id/chat', async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromReq(req);
      const rx = db.getPrescription(req.params.id, userId);
      if (!rx) return res.status(404).json({ error: 'Prescription not found' });

      const { message, language } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // Record user message
      const userMsg = {
        id: `msg_u_${Date.now()}`,
        prescriptionId: rx.id,
        sender: 'user' as const,
        text: message,
        timestamp: new Date().toISOString(),
      };
      db.addChatMessage(rx.id, userMsg);

      const history = db.getChat(rx.id);
      const aiResponse = await aiService.answerPrescriptionQuestion(
        rx,
        history,
        message,
        (language as SupportedLanguage) || rx.language || 'en'
      );

      const assistantMsg = {
        id: `msg_a_${Date.now()}`,
        prescriptionId: rx.id,
        sender: 'assistant' as const,
        text: aiResponse.text,
        timestamp: new Date().toISOString(),
        safetyNotice: aiResponse.safetyNotice,
        suggestedQuestions: aiResponse.suggestedQuestions,
      };
      db.addChatMessage(rx.id, assistantMsg);

      res.json(assistantMsg);
    } catch (err: any) {
      console.error('Chat error:', err);
      if (
        err instanceof GeminiQuotaExceededError ||
        err?.code === 'GEMINI_QUOTA_EXCEEDED' ||
        err?.status === 429
      ) {
        return res.status(429).json({
          error: 'Gemini API quota has been reached. Please try again later or check your Gemini API quota.',
        });
      }
      if (err instanceof GeminiServiceUnavailableError || err?.code === 'GEMINI_UNAVAILABLE') {
        return res.status(503).json({
          error: err.message || 'Gemini API is not configured. Add the required API key to your .env file.',
        });
      }
      res.status(500).json({ error: 'Failed to process chat response' });
    }
  });

  // ----------------------------------------------------
  // MULTILINGUAL TRANSLATION & DEEP ANALYSIS
  // ----------------------------------------------------
  app.post('/api/prescriptions/:id/translate', async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromReq(req);
      const rx = db.getPrescription(req.params.id, userId);
      if (!rx) return res.status(404).json({ error: 'Prescription not found' });

      const { targetLanguage } = req.body;
      const lang: SupportedLanguage = targetLanguage || 'en';

      const translation = await aiService.translatePrescription(rx, lang);
      const updatedRx = db.savePrescription({
        ...rx,
        language: lang,
        simplifiedSummary: translation.simplifiedSummary,
        questionsForDoctor: translation.questions,
      });

      res.json({
        prescription: updatedRx,
        scheduleNotes: translation.scheduleNotes,
      });
    } catch (err: any) {
      console.error('Translation route error:', err);
      if (
        err instanceof GeminiQuotaExceededError ||
        err?.code === 'GEMINI_QUOTA_EXCEEDED' ||
        err?.status === 429
      ) {
        return res.status(429).json({
          error: 'Gemini API quota has been reached. Please try again later or check your Gemini API quota.',
        });
      }
      res.status(500).json({ error: 'Failed to translate prescription' });
    }
  });

  // ----------------------------------------------------
  // DRUG INTERACTION & ABBREVIATION ENGINE
  // ----------------------------------------------------
  app.post('/api/interactions/check', (req: Request, res: Response) => {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.json({
        interactions: [],
        message: 'Provide at least two medicine names to perform interaction checks.',
      });
    }

    const medNames = medicines.map((m: string) => m.toLowerCase());
    const matched: any[] = [];

    for (const int of KNOWN_INTERACTIONS) {
      const a = int.medicineA.toLowerCase().split('/')[0].trim();
      const b = int.medicineB.toLowerCase().split('/')[0].trim();
      if (medNames.some((m) => m.includes(a)) && medNames.some((m) => m.includes(b))) {
        matched.push(int);
      }
    }

    res.json({
      totalChecked: medicines.length,
      interactionsFound: matched.length,
      interactions: matched,
      status: matched.length > 0 ? 'potential_interaction' : 'no_known_interaction',
      disclaimer:
        'Always consult your pharmacist or doctor before taking new over-the-counter or prescription medicines together.',
    });
  });

  app.get('/api/abbreviations', (req: Request, res: Response) => {
    const { query, category } = req.query;
    let list = [...MEDICAL_ABBREVIATIONS];
    if (category && typeof category === 'string' && category !== 'all') {
      list = list.filter((a) => a.category === category);
    }
    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.abbr.toLowerCase().includes(q) ||
          a.meaning.toLowerCase().includes(q) ||
          a.plainExplanation.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });

  app.get('/api/medicines/:name', (req: Request, res: Response) => {
    const name = req.params.name.toLowerCase();
    for (const [key, val] of Object.entries(KNOWN_DRUG_DATABASE)) {
      if (name.includes(key) || val.brandAliases.some((b) => name.includes(b))) {
        return res.json({ found: true, details: val });
      }
    }
    res.json({
      found: false,
      message: 'Medicine not in predefined offline library. Consult your healthcare provider.',
    });
  });

  // ----------------------------------------------------
  // MEDICATION CABINET & PATIENT ORGANIZER
  // ----------------------------------------------------
  app.get('/api/cabinet', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const cabinet = db.getMedicationCabinet(userId);
    res.json(cabinet);
  });

  // ----------------------------------------------------
  // PRIVACY & DATA RIGHTS
  // ----------------------------------------------------
  app.get('/api/privacy/export', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const user = db.getUser(userId);
    const prescriptions = db.getPrescriptions(userId);
    res.json({
      exportDate: new Date().toISOString(),
      userProfile: user,
      prescriptions,
      privacyStatement:
        'All extracted medical data is owned by you. AI processing is performed securely server-side without external public disclosure.',
    });
  });

  app.delete('/api/privacy/purge', (req: Request, res: Response) => {
    const userId = getUserIdFromReq(req);
    const prescriptions = db.getPrescriptions(userId);
    for (const rx of prescriptions) {
      db.deletePrescription(rx.id, userId);
    }
    res.json({ message: 'All personal prescription records have been permanently purged.' });
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD & TELEMETRY
  // ----------------------------------------------------
  app.get('/api/admin/metrics', (req: Request, res: Response) => {
    const metrics = db.getMetrics();
    const auditLogs = db.getAuditLogs();
    res.json({ metrics, auditLogs });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Medical Prescription Simplifier API',
      aiModel: process.env.GEMINI_API_KEY ? 'gemini-3.7-flash' : 'local-medical-engine',
      timestamp: new Date().toISOString(),
    });
  });

  // ----------------------------------------------------
  // INTERNAL OCR BENCHMARK & VISION EVALUATION
  // ----------------------------------------------------
  app.get('/api/internal/ocr-benchmark', async (req: Request, res: Response) => {
    try {
      const benchmarkReport = await BenchmarkEvaluator.evaluateSuite();
      res.json({
        status: 'success',
        report: benchmarkReport,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Benchmark execution failed', details: err?.message });
    }
  });

  // ----------------------------------------------------
  // PRESCRIPTION TESTING & ACCURACY EVALUATION API
  // ----------------------------------------------------
  app.get('/api/testing/cases', async (req: Request, res: Response) => {
    try {
      const cases = await TestingService.getTestCases();
      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve testing cases', details: err?.message });
    }
  });

  app.get('/api/testing/cases/:id', async (req: Request, res: Response) => {
    try {
      const testCase = await TestingService.getTestCase(req.params.id);
      if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
      }
      res.json(testCase);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve test case', details: err?.message });
    }
  });

  app.get('/api/testing/cases/:id/image', async (req: Request, res: Response) => {
    try {
      const img = await TestingService.getImageBuffer(req.params.id);
      if (!img) {
        return res.status(404).send('Image not found');
      }
      res.setHeader('Content-Type', img.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(img.buffer);
    } catch (err: any) {
      res.status(500).send('Error serving image');
    }
  });

  app.get('/api/testing/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await TestingService.getDashboardMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to calculate testing metrics', details: err?.message });
    }
  });

  app.post('/api/testing/cases', async (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Payload must contain an "items" array with test image items' });
      }
      const created = await TestingService.addTestCases(items);
      res.json({ success: true, count: created.length, cases: created });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create test cases', details: err?.message });
    }
  });

  app.put('/api/testing/cases/:id', async (req: Request, res: Response) => {
    try {
      const updated = await TestingService.updateTestCase(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Test case not found' });
      }
      res.json({ success: true, testCase: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update test case', details: err?.message });
    }
  });

  app.post('/api/testing/cases/:id/run', async (req: Request, res: Response) => {
    try {
      const result = await TestingService.runTest(req.params.id);
      res.json({ success: true, testCase: result });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to run test execution', details: err?.message });
    }
  });

  app.post('/api/testing/batch-run', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      const results = await TestingService.runBatch(ids);
      res.json({ success: true, count: results.length, cases: results });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to execute batch test run', details: err?.message });
    }
  });

  // Automated Batch Queue: Run all unevaluated tests with safe concurrency & live progress
  app.post('/api/testing/batch/run-unevaluated', async (req: Request, res: Response) => {
    try {
      const status = await BatchQueueService.startOrResumeBatch();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to start unevaluated batch job', details: err?.message });
    }
  });

  app.get('/api/testing/batch/status', async (req: Request, res: Response) => {
    try {
      const status = await BatchQueueService.getStatus();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to get batch status', details: err?.message });
    }
  });

  app.post('/api/testing/batch/pause', (req: Request, res: Response) => {
    try {
      const status = BatchQueueService.pauseBatch();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to pause batch', details: err?.message });
    }
  });

  app.post('/api/testing/batch/resume', (req: Request, res: Response) => {
    try {
      const status = BatchQueueService.resumeBatch();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to resume batch', details: err?.message });
    }
  });

  app.post('/api/testing/batch/stop', (req: Request, res: Response) => {
    try {
      const status = BatchQueueService.stopBatch();
      res.json({ success: true, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to stop batch', details: err?.message });
    }
  });

  app.post('/api/testing/recalculate', async (req: Request, res: Response) => {
    try {
      const result = await TestingService.recalculateAllTestCases();
      const metrics = await TestingService.getDashboardMetrics();
      res.json({ success: true, updatedCount: result.updatedCount, metrics, count: result.cases.length });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to recalculate test cases', details: err?.message });
    }
  });

  app.post('/api/testing/seed-demo', async (req: Request, res: Response) => {
    try {
      await TestingService.seedDemoTestCases();
      const cases = await TestingService.getTestCases();
      const metrics = await TestingService.getDashboardMetrics();
      res.json({ success: true, count: cases.length, cases, metrics });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to re-seed demo test cases', details: err?.message });
    }
  });

  app.delete('/api/testing/cases/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await TestingService.deleteTestCase(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete test case', details: err?.message });
    }
  });

  app.get('/api/testing/export-csv', async (req: Request, res: Response) => {
    try {
      const csv = await TestingService.exportCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="prescription_evaluation_results.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to export testing CSV', details: err?.message });
    }
  });

  // ----------------------------------------------------
  // FEEDBACK-LEARNING BENCHMARK DATASET API
  // ----------------------------------------------------
  app.get('/api/testing/feedback-dataset', (req: Request, res: Response) => {
    try {
      const records = FeedbackDatasetService.getAllRecords();
      const stats = FeedbackDatasetService.getStats();
      res.json({ success: true, count: records.length, records, stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load feedback dataset', details: err?.message });
    }
  });

  app.get('/api/testing/feedback-dataset/stats', (req: Request, res: Response) => {
    try {
      const stats = FeedbackDatasetService.getStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load feedback stats', details: err?.message });
    }
  });

  app.post('/api/testing/feedback-dataset', (req: Request, res: Response) => {
    try {
      const record = FeedbackDatasetService.addFeedbackRecord(req.body);
      const stats = FeedbackDatasetService.getStats();
      res.json({ success: true, record, stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record feedback item', details: err?.message });
    }
  });

  app.get('/api/testing/feedback-dataset/export', (req: Request, res: Response) => {
    try {
      const format = (req.query.format as string) || 'json';
      if (format === 'csv') {
        const csv = FeedbackDatasetService.exportCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="feedback_learning_dataset.csv"');
        return res.send(csv);
      }
      const json = FeedbackDatasetService.exportJSON();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="feedback_learning_dataset.json"');
      res.send(json);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to export feedback dataset', details: err?.message });
    }
  });

  // ----------------------------------------------------
  // API 404 HANDLER (Ensures /api/* always returns JSON, never HTML)
  // ----------------------------------------------------
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Global API Error Handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Express uncaught error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error: 'An internal server error occurred',
      message: err?.message || 'Unknown error',
    });
  });

  // ----------------------------------------------------
  // VITE DEV MIDDLEWARE / STATIC ASSETS
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logStartupStatus();
    console.log(`Medical Prescription Simplifier server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
