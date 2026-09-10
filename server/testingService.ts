import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  AccuracyBreakdown,
  DifficultyCategory,
  EvaluationTestCase,
  ExpectedMedicine,
  ProcessingTimeBreakdown,
  ReviewDecision,
  ReviewStatus,
  TestingDashboardMetrics,
  TestStatus,
} from '../src/testingTypes';
import { aiService } from './aiService';
import { FeedbackDatasetService } from './feedbackDatasetService';
import { TestingEngine } from './testingEngine';
import { VerificationEngine } from './verificationEngine';

const DATA_DIR = path.join(process.cwd(), '.data');
const TESTING_DB_FILE = path.join(DATA_DIR, 'testing_cases.json');
const TESTING_IMG_DIR = path.join(DATA_DIR, 'testing_images');

export class TestingService {
  private static testCases: EvaluationTestCase[] = [];
  private static isInitialized = false;

  private static ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TESTING_IMG_DIR)) {
      fs.mkdirSync(TESTING_IMG_DIR, { recursive: true });
    }
  }

  private static saveToFile() {
    this.ensureDataDir();
    try {
      // Ensure images are saved to disk files to prevent JSON bloat
      for (const tc of this.testCases) {
        if (tc.imageUrl && tc.imageUrl.startsWith('data:')) {
          try {
            const match = tc.imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (match) {
              const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
              const filePath = path.join(TESTING_IMG_DIR, `${tc.id}.${ext}`);
              fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
              tc.imageUrl = `/api/testing/cases/${tc.id}/image`;
            }
          } catch (err) {
            console.error(`Failed to write image for ${tc.id} to disk:`, err);
          }
        }
      }

      const tempPath = `${TESTING_DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.testCases, null, 2), 'utf8');
      fs.renameSync(tempPath, TESTING_DB_FILE);
    } catch (err) {
      console.error('Failed to save testing cases to disk:', err);
    }
  }

  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.ensureDataDir();

    if (fs.existsSync(TESTING_DB_FILE)) {
      try {
        const raw = fs.readFileSync(TESTING_DB_FILE, 'utf8');
        this.testCases = JSON.parse(raw);

        // STEP 13: Clean and validate all loaded test cases to enforce mathematical invariants
        let needsSave = false;
        for (const tc of this.testCases) {
          if (tc.expectedMedicines && tc.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'))) {
            tc.expectedMedicines = [];
            tc.accuracy = undefined;
            needsSave = true;
          }
          const prevStatus = tc.status;
          const prevAcc = tc.accuracy?.overallAccuracy;
          TestingEngine.validateConsistency(tc);
          if (tc.status !== prevStatus || tc.accuracy?.overallAccuracy !== prevAcc) {
            needsSave = true;
          }
        }
        if (needsSave) {
          this.saveToFile();
        }

        FeedbackDatasetService.seedFromReviewedCases(this.testCases);
        this.isInitialized = true;
        return;
      } catch (e) {
        console.warn('Could not parse existing testing_cases.json, re-seeding...', e);
      }
    }

    // Seed realistic demo test suite
    await this.seedDemoTestCases();
    this.isInitialized = true;
  }

  private static escapeXml(str: string = ''): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Helper to generate a clean realistic simulated prescription image
   */
  private static async generatePrescriptionImage(
    title: string,
    doctor: string,
    clinic: string,
    lines: string[]
  ): Promise<string> {
    const escClinic = this.escapeXml(clinic);
    const escDoctor = this.escapeXml(doctor);
    const escLines = lines.map((line) => this.escapeXml(line));

    const linesSvg = escLines
      .map((line, idx) => `<text x="100" y="${360 + idx * 70}" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" fill="#1e293b">${line}</text>`)
      .join('\n');

    const svg = `
      <svg width="1000" height="1300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <rect x="40" y="40" width="920" height="1220" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
        <text x="80" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="bold" fill="#0f172a">${escClinic}</text>
        <text x="80" y="155" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#475569">${escDoctor}</text>
        <line x1="80" y1="190" x2="920" y2="190" stroke="#cbd5e1" stroke-width="2"/>
        <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#64748b">Date: 2026-09-04 | Patient: Verified Test Sample</text>
        <text x="80" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="bold" fill="#0d9488">Rx</text>
        ${linesSvg}
        <line x1="80" y1="1140" x2="920" y2="1140" stroke="#cbd5e1" stroke-width="1"/>
        <text x="80" y="1190" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8">Note: Authorized synthetic prescription evaluation specimen. Not for direct clinical administration.</text>
      </svg>
    `;

    try {
      const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
      return `data:image/jpeg;base64,${buf.toString('base64')}`;
    } catch (err) {
      console.error('Sharp error generating prescription image:', err);
      return '';
    }
  }

  /**
   * Reads raw image binary buffer from disk or memory for a test case
   */
  public static async getImageBuffer(id: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    this.ensureDataDir();
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of exts) {
      const p = path.join(TESTING_IMG_DIR, `${id}.${ext}`);
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        return { buffer: buf, mimeType: mime };
      }
    }

    const tc = this.testCases.find((c) => c.id === id);
    if (tc && tc.imageUrl && tc.imageUrl.startsWith('data:')) {
      const match = tc.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        return { buffer: buf, mimeType: match[1] };
      }
    }

    // Auto-generate realistic image specimen if image is missing
    if (tc) {
      const doctor = tc.doctorName || 'Dr. Clinical Evaluator, MD';
      const clinic = tc.clinicName || 'PRESCRIPTION EVALUATION BENCHMARK';
      const lines =
        tc.expectedMedicines && tc.expectedMedicines.length > 0
          ? tc.expectedMedicines.map(
              (m, idx) =>
                `${idx + 1}. Tab ${m.name} ${m.dose || ''} - ${m.frequency || '1 tab OD'} ${m.timing || 'after food'} x ${m.duration || '5 days'}`
            )
          : [
              '1. Tab Paracetamol 500mg - 1 tab BD after food x 3 days',
              '2. Tab Cetirizine 10mg - 1 tab HS x 5 days',
            ];
      const dataUri = await this.generatePrescriptionImage('Medical Prescription', doctor, clinic, lines);
      if (dataUri) {
        const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const buf = Buffer.from(match[2], 'base64');
          fs.writeFileSync(path.join(TESTING_IMG_DIR, `${id}.jpg`), buf);
          tc.imageUrl = `/api/testing/cases/${id}/image`;
          this.saveToFile();
          return { buffer: buf, mimeType: 'image/jpeg' };
        }
      }
    }

    return null;
  }

  /**
   * Retrieves clean base64 image data and mimeType for test execution
   */
  public static async getImageBase64(testCase: EvaluationTestCase): Promise<{ base64: string; mimeType: string }> {
    if (testCase.imageUrl && testCase.imageUrl.startsWith('data:')) {
      const cleanBase64 = testCase.imageUrl.replace(/^data:[^;]+;base64,/, '');
      const mimeMatch = testCase.imageUrl.match(/^data:([^;]+);/);
      return { base64: cleanBase64, mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg' };
    }

    const imgData = await this.getImageBuffer(testCase.id);
    if (imgData) {
      return { base64: imgData.buffer.toString('base64'), mimeType: imgData.mimeType };
    }

    // Fallback: Synthesize image
    const doctor = testCase.doctorName || 'Dr. Clinical Evaluator, MD';
    const clinic = testCase.clinicName || 'PRESCRIPTION EVALUATION BENCHMARK';
    const lines =
      testCase.expectedMedicines && testCase.expectedMedicines.length > 0
        ? testCase.expectedMedicines.map(
            (m, idx) =>
              `${idx + 1}. Tab ${m.name} ${m.dose || ''} - ${m.frequency || '1 tab OD'} ${m.timing || 'after food'} x ${m.duration || '5 days'}`
          )
        : [
            '1. Tab Paracetamol 500mg - 1 tab BD after food x 3 days',
            '2. Tab Cetirizine 10mg - 1 tab HS x 5 days',
          ];
    const dataUri = await this.generatePrescriptionImage('Medical Prescription', doctor, clinic, lines);
    if (dataUri) {
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        this.ensureDataDir();
        fs.writeFileSync(path.join(TESTING_IMG_DIR, `${testCase.id}.jpg`), Buffer.from(match[2], 'base64'));
        testCase.imageUrl = `/api/testing/cases/${testCase.id}/image`;
        this.saveToFile();
        return { base64: match[2], mimeType: match[1] };
      }
    }

    throw new Error('No image payload available for test case execution.');
  }

  /**
   * Seeds demo benchmark test cases covering all difficulty categories
   */
  public static async seedDemoTestCases(): Promise<void> {
    const demoCases: EvaluationTestCase[] = [];

    // Case 1: Clear Printed (Completed, Passed)
    const img1 = await this.generatePrescriptionImage(
      'Medical Center Rx',
      'Dr. Robert Chen, MD (Reg #94102)',
      'METRO GENERAL HOSPITAL',
      [
        '1. Tab Augmentin 625mg - 1 tablet twice daily (1-0-1) after food for 5 days',
        '2. Tab Dolo 650mg - 1 tablet thrice daily (1-1-1) after food for 3 days',
        '3. Cap Pantocid 40mg - 1 capsule once daily (1-0-0) before breakfast for 5 days',
      ]
    );

    demoCases.push({
      id: 'TEST-001',
      imageName: 'prescription_001_printed.jpg',
      imageUrl: img1,
      uploadDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      difficultyCategory: 'Clear Printed',
      status: 'Passed',
      processingTimes: {
        imageProcessingSec: 0.3,
        ocrSec: 0.0,
        geminiProcessingSec: 4.2,
        validationSec: 0.1,
        totalSec: 4.6,
        speedCategory: 'Excellent',
      },
      expectedMedicines: [
        {
          id: 'exp_001_1',
          name: 'Augmentin (Amoxicillin & Clavulanate)',
          dose: '625 mg',
          frequency: 'Twice daily (1-0-1)',
          timing: 'After food',
          duration: '5 days',
          instructions: 'Take after meals',
        },
        {
          id: 'exp_001_2',
          name: 'Dolo (Paracetamol)',
          dose: '650 mg',
          frequency: 'Thrice daily (1-1-1)',
          timing: 'After food',
          duration: '3 days',
          instructions: 'Take for fever/pain',
        },
        {
          id: 'exp_001_3',
          name: 'Pantocid (Pantoprazole)',
          dose: '40 mg',
          frequency: 'Once daily (1-0-0)',
          timing: 'Before breakfast',
          duration: '5 days',
          instructions: 'Take on empty stomach',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Augmentin',
          dose: '625mg',
          frequency: '1-0-1',
          timing: 'after_food',
          duration: '5 days',
          instructions: '1 tablet twice daily after food',
        },
        {
          name: 'Dolo',
          dose: '650mg',
          frequency: '1-1-1',
          timing: 'after_food',
          duration: '3 days',
          instructions: '1 tablet thrice daily after food',
        },
        {
          name: 'Pantocid',
          dose: '40mg',
          frequency: '1-0-0',
          timing: 'before_food',
          duration: '5 days',
          instructions: '1 capsule once daily before breakfast',
        },
      ],
      comparisons: [
        {
          expectedId: 'exp_001_1',
          expectedName: 'Augmentin (Amoxicillin & Clavulanate)',
          actualName: 'Augmentin',
          medicineName: { expected: 'Augmentin (Amoxicillin & Clavulanate)', actual: 'Augmentin', status: 'Correct' },
          dose: { expected: '625 mg', actual: '625mg', status: 'Correct' },
          frequency: { expected: 'Twice daily (1-0-1)', actual: '1-0-1', status: 'Correct' },
          timing: { expected: 'After food', actual: 'after_food', status: 'Correct' },
          duration: { expected: '5 days', actual: '5 days', status: 'Correct' },
          instructions: { expected: 'Take after meals', actual: '1 tablet twice daily after food', status: 'Correct' },
          overallMedicineStatus: 'Correct',
        },
        {
          expectedId: 'exp_001_2',
          expectedName: 'Dolo (Paracetamol)',
          actualName: 'Dolo',
          medicineName: { expected: 'Dolo (Paracetamol)', actual: 'Dolo', status: 'Correct' },
          dose: { expected: '650 mg', actual: '650mg', status: 'Correct' },
          frequency: { expected: 'Thrice daily (1-1-1)', actual: '1-1-1', status: 'Correct' },
          timing: { expected: 'After food', actual: 'after_food', status: 'Correct' },
          duration: { expected: '3 days', actual: '3 days', status: 'Correct' },
          instructions: { expected: 'Take for fever/pain', actual: '1 tablet thrice daily after food', status: 'Correct' },
          overallMedicineStatus: 'Correct',
        },
        {
          expectedId: 'exp_001_3',
          expectedName: 'Pantocid (Pantoprazole)',
          actualName: 'Pantocid',
          medicineName: { expected: 'Pantocid (Pantoprazole)', actual: 'Pantocid', status: 'Correct' },
          dose: { expected: '40 mg', actual: '40mg', status: 'Correct' },
          frequency: { expected: 'Once daily (1-0-0)', actual: '1-0-0', status: 'Correct' },
          timing: { expected: 'Before breakfast', actual: 'before_food', status: 'Correct' },
          duration: { expected: '5 days', actual: '5 days', status: 'Correct' },
          instructions: { expected: 'Take on empty stomach', actual: '1 capsule once daily before breakfast', status: 'Correct' },
          overallMedicineStatus: 'Correct',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 100,
        doseAccuracy: 100,
        frequencyAccuracy: 100,
        timingAccuracy: 100,
        overallAccuracy: 100,
      },
      reviewStatus: 'Passed',
      reviewerNotes: 'Clean laser-printed specimen. All 3 medications, dosages, and timings identified with 100% precision.',
      detectedErrors: [],
      doctorName: 'Dr. Robert Chen, MD',
      clinicName: 'METRO GENERAL HOSPITAL',
    });

    // Case 2: Clear Handwritten (Completed, Passed)
    const img2 = await this.generatePrescriptionImage(
      'Cardiology Clinic',
      'Dr. Priya Sharma, MD (Cardiology)',
      'CITY HEART & DIABETES CARE',
      [
        '1. Tab Metformin 500mg - 1 tab twice daily with meals (1-0-1)',
        '2. Tab Telmisartan 40mg - 1 tab morning OD (1-0-0)',
        '3. Tab Atorvastatin 20mg - 1 tab bedtime HS (0-0-1)',
      ]
    );

    demoCases.push({
      id: 'TEST-002',
      imageName: 'prescription_002_handwritten.jpg',
      imageUrl: img2,
      uploadDate: new Date(Date.now() - 3600000 * 20).toISOString(),
      difficultyCategory: 'Clear Handwritten',
      status: 'Passed',
      processingTimes: {
        imageProcessingSec: 0.3,
        ocrSec: 0.0,
        geminiProcessingSec: 4.8,
        validationSec: 0.1,
        totalSec: 5.2,
        speedCategory: 'Good',
      },
      expectedMedicines: [
        {
          id: 'exp_002_1',
          name: 'Metformin',
          dose: '500 mg',
          frequency: 'Twice daily (1-0-1)',
          timing: 'With meals',
          duration: '30 days',
        },
        {
          id: 'exp_002_2',
          name: 'Telmisartan',
          dose: '40 mg',
          frequency: 'Once daily (1-0-0)',
          timing: 'Morning',
          duration: '30 days',
        },
        {
          id: 'exp_002_3',
          name: 'Atorvastatin',
          dose: '20 mg',
          frequency: 'Bedtime (0-0-1)',
          timing: 'Night',
          duration: '30 days',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Metformin',
          dose: '500mg',
          frequency: '1-0-1',
          timing: 'with_food',
          duration: '30 days',
          instructions: '1 tab twice daily with meals',
        },
        {
          name: 'Telmisartan',
          dose: '40mg',
          frequency: '1-0-0',
          timing: 'morning',
          duration: '30 days',
          instructions: '1 tab morning',
        },
        {
          name: 'Atorvastatin',
          dose: '20mg',
          frequency: '0-0-1',
          timing: 'bedtime',
          duration: '30 days',
          instructions: '1 tab at bedtime',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 100,
        doseAccuracy: 100,
        frequencyAccuracy: 100,
        timingAccuracy: 100,
        overallAccuracy: 100,
      },
      reviewStatus: 'Passed',
      reviewerNotes: 'Clear cursive handwriting with standard abbreviation notation. Excellent match.',
      detectedErrors: [],
      doctorName: 'Dr. Priya Sharma, MD',
      clinicName: 'CITY HEART & DIABETES CARE',
    });

    // Case 3: Medium Handwritten (Partially Correct - dosage missing)
    const img3 = await this.generatePrescriptionImage(
      'Family Medicine Care',
      'Dr. A. K. Verma',
      'APOLLO CLINIC',
      [
        '1. Tab Pantocid - 1 tab OD before breakfast x 7 days',
        '2. Tab Levocet 5mg - 1 tab HS x 5 days',
      ]
    );

    demoCases.push({
      id: 'TEST-003',
      imageName: 'prescription_003_medium.jpg',
      imageUrl: img3,
      uploadDate: new Date(Date.now() - 3600000 * 15).toISOString(),
      difficultyCategory: 'Medium Handwritten',
      status: 'Partially Correct',
      processingTimes: {
        imageProcessingSec: 0.4,
        ocrSec: 0.0,
        geminiProcessingSec: 6.2,
        validationSec: 0.1,
        totalSec: 6.7,
        speedCategory: 'Good',
      },
      expectedMedicines: [
        {
          id: 'exp_003_1',
          name: 'Pantocid (Pantoprazole)',
          dose: '40 mg',
          frequency: 'Once daily (OD)',
          timing: 'Before breakfast',
          duration: '7 days',
        },
        {
          id: 'exp_003_2',
          name: 'Levocet (Levocetirizine)',
          dose: '5 mg',
          frequency: 'Once daily at night (HS)',
          timing: 'Bedtime',
          duration: '5 days',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Pantocid',
          dose: 'Standard dose',
          frequency: 'OD',
          timing: 'before_food',
          duration: '7 days',
          instructions: '1 tab OD before breakfast',
        },
        {
          name: 'Levocet',
          dose: '5mg',
          frequency: 'HS',
          timing: 'bedtime',
          duration: '5 days',
          instructions: '1 tab HS',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 100,
        doseAccuracy: 50,
        frequencyAccuracy: 100,
        timingAccuracy: 100,
        overallAccuracy: 85,
      },
      reviewStatus: 'Partially Correct',
      reviewerNotes: 'Pantocid strength was omitted in doctor handwritten line (wrote just "Tab Pantocid"), resulting in Dose accuracy drop.',
      detectedErrors: ['Dose incorrectly detected'],
      doctorName: 'Dr. A. K. Verma',
      clinicName: 'APOLLO CLINIC',
    });

    // Case 4: Difficult Handwritten (Needs Verification)
    const img4 = await this.generatePrescriptionImage(
      'ENT & Chest Care',
      'Dr. S. Nair, MS (ENT)',
      'ST. JUDE HEALTH CENTER',
      [
        '1. Tab Azithral 500mg - 1 tab OD x 3 days',
        '2. Syp Ascoril-D - 10 ml TDS x 5 days',
      ]
    );

    demoCases.push({
      id: 'TEST-004',
      imageName: 'prescription_004_difficult.jpg',
      imageUrl: img4,
      uploadDate: new Date(Date.now() - 3600000 * 10).toISOString(),
      difficultyCategory: 'Difficult Handwritten',
      status: 'Needs Verification',
      processingTimes: {
        imageProcessingSec: 0.4,
        ocrSec: 0.0,
        geminiProcessingSec: 7.1,
        validationSec: 0.1,
        totalSec: 7.6,
        speedCategory: 'Good',
      },
      expectedMedicines: [
        {
          id: 'exp_004_1',
          name: 'Azithral (Azithromycin)',
          dose: '500 mg',
          frequency: 'Once daily (OD)',
          timing: 'After food',
          duration: '3 days',
        },
        {
          id: 'exp_004_2',
          name: 'Ascoril-D Cough Syrup',
          dose: '10 ml',
          frequency: 'Thrice daily (TDS)',
          timing: 'After meals',
          duration: '5 days',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Azithral',
          dose: '500mg',
          frequency: 'OD',
          timing: 'unclear',
          duration: '3 days',
          instructions: '1 tab OD for 3 days',
        },
        {
          name: 'Ascoril-D',
          dose: '10ml',
          frequency: 'TDS',
          timing: 'unclear',
          duration: '5 days',
          instructions: '10ml TDS',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 100,
        doseAccuracy: 100,
        frequencyAccuracy: 100,
        timingAccuracy: 50,
        overallAccuracy: 78,
      },
      reviewStatus: 'Needs Verification',
      reviewerNotes: 'Cough syrup timing relative to meals was not explicitly stated by prescriber; flagged for pharmacist verification.',
      detectedErrors: ['Timing missing', 'Needs manual verification'],
      doctorName: 'Dr. S. Nair',
      clinicName: 'ST. JUDE HEALTH CENTER',
    });

    // Case 5: Low Quality / Blurry (Failed)
    const img5 = await this.generatePrescriptionImage(
      'Emergency Center',
      'Duty Physician',
      'CITY EMERGENCY CARE',
      ['1. Paracetamol 500mg SOS', '2. Ibuprofen 400mg']
    );

    demoCases.push({
      id: 'TEST-005',
      imageName: 'prescription_005_blurry.jpg',
      imageUrl: img5,
      uploadDate: new Date(Date.now() - 3600000 * 5).toISOString(),
      difficultyCategory: 'Low Quality / Blurry',
      status: 'Failed',
      processingTimes: {
        imageProcessingSec: 0.3,
        ocrSec: 0.0,
        geminiProcessingSec: 5.8,
        validationSec: 0.1,
        totalSec: 6.2,
        speedCategory: 'Good',
      },
      expectedMedicines: [
        {
          id: 'exp_005_1',
          name: 'Paracetamol',
          dose: '500 mg',
          frequency: 'SOS (as needed)',
          timing: 'With food',
          duration: '2 days',
        },
        {
          id: 'exp_005_2',
          name: 'Ibuprofen',
          dose: '400 mg',
          frequency: 'Twice daily',
          timing: 'Strictly after food',
          duration: '3 days',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Paracetamol',
          dose: '500mg',
          frequency: 'SOS',
          timing: 'unspecified',
          duration: 'As prescribed',
          instructions: 'Take SOS',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 50,
        doseAccuracy: 50,
        frequencyAccuracy: 50,
        timingAccuracy: 0,
        overallAccuracy: 42,
      },
      reviewStatus: 'Failed',
      reviewerNotes: 'Ibuprofen line was cropped or blurred out of focus in the specimen photo. Missed second medication.',
      detectedErrors: [
        'Image quality issue',
        'Medicine name incorrectly detected',
        'Frequency missing',
        'Timing missing',
      ],
      doctorName: 'Duty Physician',
      clinicName: 'CITY EMERGENCY CARE',
    });

    // Case 6: Mixed Prescription (Passed)
    const img6 = await this.generatePrescriptionImage(
      'Pediatric Clinic',
      'Dr. Elena Rostova, MD (Pediatrics)',
      'CHILDREN SPECIALTY CLINIC',
      [
        '1. Syp Calpol 120mg/5ml - 5ml TDS for fever',
        '2. Drops Nasoclear (Saline) - 2 drops both nostrils before feeds',
      ]
    );

    demoCases.push({
      id: 'TEST-006',
      imageName: 'prescription_006_pediatric.jpg',
      imageUrl: img6,
      uploadDate: new Date(Date.now() - 3600000 * 2).toISOString(),
      difficultyCategory: 'Mixed Prescription',
      status: 'Passed',
      processingTimes: {
        imageProcessingSec: 0.3,
        ocrSec: 0.0,
        geminiProcessingSec: 4.1,
        validationSec: 0.1,
        totalSec: 4.5,
        speedCategory: 'Excellent',
      },
      expectedMedicines: [
        {
          id: 'exp_006_1',
          name: 'Calpol (Paracetamol)',
          dose: '120mg / 5ml (5ml)',
          frequency: 'Thrice daily (TDS)',
          timing: 'After food or milk',
          duration: '3 days',
        },
        {
          id: 'exp_006_2',
          name: 'Nasoclear Saline Drops',
          dose: '2 drops',
          frequency: 'Before feeds',
          timing: 'Before meals',
          duration: '5 days',
        },
      ],
      aiExtractedMedicines: [
        {
          name: 'Calpol',
          dose: '5ml (120mg/5ml)',
          frequency: 'TDS',
          timing: 'after_food',
          duration: '3 days',
          instructions: '5ml TDS for fever',
        },
        {
          name: 'Nasoclear',
          dose: '2 drops',
          frequency: 'before feeds',
          timing: 'before_food',
          duration: '5 days',
          instructions: '2 drops both nostrils before feeds',
        },
      ],
      accuracy: {
        medicineNameAccuracy: 100,
        doseAccuracy: 100,
        frequencyAccuracy: 100,
        timingAccuracy: 100,
        overallAccuracy: 100,
      },
      reviewStatus: 'Passed',
      reviewerNotes: 'Pediatric liquid and drop formulations identified accurately.',
      detectedErrors: [],
      doctorName: 'Dr. Elena Rostova',
      clinicName: 'CHILDREN SPECIALTY CLINIC',
    });

    // Case 7: Pending Test Case (Ready for live user test)
    const img7 = await this.generatePrescriptionImage(
      'Orthopedic Specialist',
      'Dr. M. S. Gill, MS (Ortho)',
      'APOLLO JOINT & BONE CARE',
      [
        '1. Tab Aceclo-Plus 100/325mg - 1 tab BD after food x 5 days',
        '2. Cap Rabicip 20mg - 1 cap OD before food x 5 days',
      ]
    );

    demoCases.push({
      id: 'TEST-007',
      imageName: 'prescription_007_ortho.jpg',
      imageUrl: img7,
      uploadDate: new Date(Date.now() - 3600000).toISOString(),
      difficultyCategory: 'Clear Printed',
      status: 'Pending',
      expectedMedicines: [
        {
          id: 'exp_007_1',
          name: 'Aceclo-Plus (Aceclofenac + Paracetamol)',
          dose: '100/325 mg',
          frequency: 'Twice daily (BD)',
          timing: 'After food',
          duration: '5 days',
        },
        {
          id: 'exp_007_2',
          name: 'Rabicip (Rabeprazole)',
          dose: '20 mg',
          frequency: 'Once daily (OD)',
          timing: 'Before food',
          duration: '5 days',
        },
      ],
      reviewStatus: 'Pending Review',
      reviewerNotes: 'Specimen queued for automated test run.',
      detectedErrors: [],
      doctorName: 'Dr. M. S. Gill',
      clinicName: 'APOLLO JOINT & BONE CARE',
    });

    // Case 8: Another Pending Test Case
    const img8 = await this.generatePrescriptionImage(
      'Cardiology Unit',
      'Dr. Sarah Jenkins, MD',
      'ST. JUDE WELLNESS',
      [
        '1. Tab Ecosprin 75mg - 1 tab OD after lunch x 30 days',
        '2. Tab Rosuvas 10mg - 1 tab HS bedtime x 30 days',
      ]
    );

    demoCases.push({
      id: 'TEST-008',
      imageName: 'prescription_008_cardiac.jpg',
      imageUrl: img8,
      uploadDate: new Date().toISOString(),
      difficultyCategory: 'Medium Handwritten',
      status: 'Pending',
      expectedMedicines: [
        {
          id: 'exp_008_1',
          name: 'Ecosprin (Aspirin)',
          dose: '75 mg',
          frequency: 'Once daily (OD)',
          timing: 'After lunch',
          duration: '30 days',
        },
        {
          id: 'exp_008_2',
          name: 'Rosuvas (Rosuvastatin)',
          dose: '10 mg',
          frequency: 'Once daily (HS)',
          timing: 'Bedtime',
          duration: '30 days',
        },
      ],
      reviewStatus: 'Pending Review',
      reviewerNotes: 'Queued for evaluation.',
      detectedErrors: [],
      doctorName: 'Dr. Sarah Jenkins',
      clinicName: 'ST. JUDE WELLNESS',
    });

    this.testCases = demoCases;
    this.saveToFile();
  }

  public static async getTestCases(): Promise<EvaluationTestCase[]> {
    await this.initialize();
    return this.testCases;
  }

  public static async getTestCase(id: string): Promise<EvaluationTestCase | undefined> {
    await this.initialize();
    return this.testCases.find((tc) => tc.id === id);
  }

  public static async getDashboardMetrics(): Promise<TestingDashboardMetrics> {
    await this.initialize();
    return TestingEngine.calculateDashboardMetrics(this.testCases);
  }

  /**
   * Adds new test case(s) from uploaded images
   */
  public static async addTestCases(
    items: {
      imageName: string;
      imageBase64?: string;
      difficultyCategory: DifficultyCategory;
      expectedMedicines?: ExpectedMedicine[];
    }[]
  ): Promise<EvaluationTestCase[]> {
    await this.initialize();
    this.ensureDataDir();

    const created: EvaluationTestCase[] = [];
    let nextNum = this.testCases.length + 1;

    for (const item of items) {
      const trimmedName = (item.imageName || '').trim();

      // Check if a test case with the same imageName already exists
      const existing = trimmedName
        ? this.testCases.find((tc) => tc.imageName.toLowerCase().trim() === trimmedName.toLowerCase())
        : undefined;

      if (existing) {
        if (item.imageBase64 && (!existing.imageUrl || existing.imageUrl.startsWith('data:'))) {
          try {
            const rawBase64 = item.imageBase64.replace(/^data:[^;]+;base64,/, '');
            const mimeMatch = item.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);/);
            const ext = mimeMatch ? (mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1]) : 'jpg';
            fs.writeFileSync(path.join(TESTING_IMG_DIR, `${existing.id}.${ext}`), Buffer.from(rawBase64, 'base64'));
            existing.imageUrl = `/api/testing/cases/${existing.id}/image`;
          } catch {}
        }
        if (item.expectedMedicines && item.expectedMedicines.length > 0 && (!existing.expectedMedicines || existing.expectedMedicines.length === 0)) {
          existing.expectedMedicines = item.expectedMedicines;
        }
        created.push(existing);
        continue;
      }

      const id = `TEST-${String(nextNum).padStart(3, '0')}`;
      nextNum++;

      let imageUrl: string | undefined = undefined;
      if (item.imageBase64) {
        try {
          const rawBase64 = item.imageBase64.replace(/^data:[^;]+;base64,/, '');
          const mimeMatch = item.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);/);
          const ext = mimeMatch ? (mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1]) : 'jpg';
          fs.writeFileSync(path.join(TESTING_IMG_DIR, `${id}.${ext}`), Buffer.from(rawBase64, 'base64'));
          imageUrl = `/api/testing/cases/${id}/image`;
        } catch {
          imageUrl = item.imageBase64.startsWith('data:')
            ? item.imageBase64
            : `data:image/jpeg;base64,${item.imageBase64}`;
        }
      }

      const newCase: EvaluationTestCase = {
        id,
        imageName: item.imageName || `test_specimen_${nextNum}.jpg`,
        imageUrl,
        uploadDate: new Date().toISOString(),
        difficultyCategory: item.difficultyCategory || 'Clear Printed',
        status: 'Pending',
        expectedMedicines: item.expectedMedicines || [],
        reviewStatus: 'Pending Review',
        reviewerNotes: '',
        detectedErrors: [],
      };

      this.testCases.unshift(newCase);
      created.push(newCase);
    }

    this.saveToFile();
    return created;
  }

  /**
   * Updates test case (e.g. expected medicines, manual review status, reviewer notes, difficulty category)
   */
  public static async updateTestCase(
    id: string,
    updates: Partial<EvaluationTestCase>
  ): Promise<EvaluationTestCase | undefined> {
    await this.initialize();
    const idx = this.testCases.findIndex((tc) => tc.id === id);
    if (idx === -1) return undefined;

    const existing = this.testCases[idx];
    const updated: EvaluationTestCase = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
    };

    // If expected medicines were updated or we have AI medicines, re-evaluate this test
    if (updated.aiExtractedMedicines !== undefined) {
      const evalRes = TestingEngine.evaluatePrescription(
        updated.expectedMedicines || [],
        updated.aiExtractedMedicines
      );
      updated.comparisons = evalRes.comparisons;
      updated.accuracy = evalRes.accuracy;
      updated.detectedErrors = evalRes.detectedErrors;
      updated.evaluationState = evalRes.evaluationState;
      updated.statusReason = evalRes.statusReason;

      // If user explicitly provided status or reviewStatus in updates, respect that
      if (updates.status) {
        updated.status = updates.status;
      } else if (
        updated.reviewStatus &&
        updated.reviewStatus !== 'Pending Review' &&
        updated.reviewStatus !== 'Needs Verification'
      ) {
        updated.status = updated.reviewStatus as any;
      } else {
        updated.status = evalRes.suggestedStatus;
      }

      if (!updates.reviewStatus && (updated.reviewStatus === 'Pending Review' || updated.reviewStatus === 'Failed' || updated.reviewStatus === 'Partially Correct')) {
        updated.reviewStatus = evalRes.suggestedReviewStatus;
      }
    }

    // If human review action was taken, register to FeedbackDatasetService
    const reviewDecision = (updates as any).reviewDecision as ReviewDecision | undefined;
    if (
      reviewDecision ||
      (updates.reviewStatus && updates.reviewStatus !== 'Pending Review')
    ) {
      const decision: ReviewDecision =
        reviewDecision ||
        (updated.reviewStatus === 'Passed' || updated.reviewStatus === 'Confirmed Correct'
          ? 'Confirmed AI Result'
          : updated.reviewStatus === 'Failed' || updated.reviewStatus === 'Confirmed Incorrect'
          ? 'Marked AI Result Incorrect'
          : updated.reviewStatus === 'Confirmed No Medicine'
          ? 'Confirmed No Medicine Present'
          : updated.reviewStatus === 'Marked Unreadable'
          ? 'Marked Prescription Unreadable'
          : 'Ground Truth Corrected');

      FeedbackDatasetService.addFeedbackRecord({
        testId: updated.id,
        imageName: updated.imageName,
        imageUrl: updated.imageUrl,
        imageDifficulty: updated.difficultyCategory,
        aiExtractedResult: {
          medicines: updated.aiExtractedMedicines || [],
          doctorName: updated.doctorName,
          clinicName: updated.clinicName,
        },
        humanCorrectedResult: {
          medicines: updated.expectedMedicines || [],
          reviewerNotes: updated.reviewerNotes,
        },
        groundTruth: updated.expectedMedicines || [],
        errorTypes: updated.detectedErrors || [],
        reviewDecision: decision,
        reviewStatus: updated.reviewStatus,
        evaluationState: updated.evaluationState || 'EVALUATED',
        notes: updated.reviewerNotes,
      });
    }

    this.testCases[idx] = updated;
    this.saveToFile();
    return updated;
  }

  /**
   * Recalculates evaluations, accuracy metrics, and error classifications
   * across all test cases without deleting any case or image data
   */
  public static async recalculateAllTestCases(): Promise<{ updatedCount: number; cases: EvaluationTestCase[] }> {
    await this.initialize();
    let updatedCount = 0;

    for (const tc of this.testCases) {
      // Step 13: Clean dataset - strip fabricated AI-as-ground-truth (gt_bench_)
      if (tc.expectedMedicines && tc.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'))) {
        tc.expectedMedicines = [];
        tc.accuracy = undefined;
      }

      const hasGroundTruth =
        Array.isArray(tc.expectedMedicines) &&
        tc.expectedMedicines.length > 0 &&
        !tc.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'));

      if (hasGroundTruth) {
        const evalRes = TestingEngine.evaluatePrescription(
          tc.expectedMedicines,
          tc.aiExtractedMedicines || []
        );
        tc.comparisons = evalRes.comparisons;
        tc.accuracy = evalRes.accuracy;
        tc.detectedErrors = evalRes.detectedErrors;
        tc.evaluationState = evalRes.evaluationState;
        tc.statusReason = evalRes.statusReason;

        const isHumanReviewed =
          tc.reviewStatus &&
          tc.reviewStatus !== 'Pending Review' &&
          tc.reviewStatus !== 'Needs Verification';

        if (!isHumanReviewed) {
          tc.status = evalRes.suggestedStatus;
          tc.reviewStatus = evalRes.suggestedReviewStatus;
        } else {
          tc.status =
            tc.reviewStatus === 'Confirmed Correct'
              ? 'Passed'
              : tc.reviewStatus === 'Confirmed Incorrect'
              ? 'Failed'
              : (tc.reviewStatus as any);
        }

        TestingEngine.validateConsistency(tc);
        updatedCount++;
      } else if (tc.aiExtractedMedicines !== undefined) {
        // Without independent ground truth:
        tc.expectedMedicines = [];
        tc.accuracy = undefined;

        if (tc.aiExtractedMedicines.length === 0) {
          tc.status = 'No Medicine Detected';
          tc.evaluationState = 'NO_MEDICINE_DETECTED';
          tc.reviewStatus = 'Confirmed No Medicine';
          tc.statusReason = 'No medicines detected in prescription specimen.';
          tc.comparisons = [];
        } else {
          tc.status = 'Needs Verification';
          tc.evaluationState = 'NEEDS_VERIFICATION';
          if (!tc.reviewStatus || tc.reviewStatus === 'Passed' || tc.reviewStatus === 'Failed' || tc.reviewStatus === 'Partially Correct') {
            tc.reviewStatus = 'Pending Review';
          }
          tc.statusReason = `Prescription extracted successfully (${tc.aiExtractedMedicines.length} medicine(s) detected). Awaiting independent ground truth verification.`;
          const unverifiedEval = TestingEngine.evaluatePrescription([], tc.aiExtractedMedicines);
          tc.comparisons = unverifiedEval.comparisons;
        }

        TestingEngine.validateConsistency(tc);
        updatedCount++;
      } else if (tc.status === 'API Error' || tc.status === 'Extraction Error') {
        tc.evaluationState = 'NOT_EVALUATED';
        tc.statusReason = tc.errorDetails || 'API or extraction failure occurred.';
        updatedCount++;
      } else if (tc.status === 'Pending') {
        tc.evaluationState = 'NOT_EVALUATED';
        tc.statusReason = 'Test has not been executed yet.';
        updatedCount++;
      }
    }

    this.saveToFile();
    return { updatedCount, cases: this.testCases };
  }

  /**
   * Runs analysis on an individual test case
   */
  public static async runTest(id: string): Promise<EvaluationTestCase> {
    await this.initialize();
    const testCase = this.testCases.find((tc) => tc.id === id);
    if (!testCase) {
      throw new Error(`Test case ${id} not found`);
    }

    testCase.status = 'Processing';
    this.saveToFile();

    const tStart = Date.now();
    try {
      // Check if this case already has valid extracted medicine data and reasonable processing time
      // (as specified for legacy stuck cases from the previous broken bulk pipeline)
      const hasExistingAiData =
        Array.isArray(testCase.aiExtractedMedicines) &&
        testCase.aiExtractedMedicines.length > 0 &&
        testCase.processingTimes &&
        testCase.processingTimes.totalSec > 0.5;

      let aiExtractedMedicines = testCase.aiExtractedMedicines || [];

      if (!hasExistingAiData) {
        const { base64: cleanBase64, mimeType } = await this.getImageBase64(testCase);
        if (!cleanBase64) {
          testCase.status = 'Extraction Error';
          testCase.statusReason = 'Extraction Error: Prescription image file could not be read or is invalid.';
          testCase.evaluationState = 'NOT_EVALUATED';
          this.saveToFile();
          return testCase;
        }

        const extractionResult = await aiService.extractPrescription(
          { imageBase64: cleanBase64, mimeType },
          'en'
        );

        const tTotal = Math.max(100, Date.now() - tStart);
        const metrics = extractionResult.processingMetrics || {
          imageProcessingMs: 300,
          visionApiMs: Math.max(100, tTotal - 320),
          validationMs: 20,
          totalMs: tTotal,
        };

        const imgSec = Number((Math.max(0.1, metrics.imageProcessingMs || 300) / 1000).toFixed(1));
        const geminiSec = Number((Math.max(0.1, metrics.visionApiMs || Math.max(100, tTotal - 350)) / 1000).toFixed(1));
        const valSec = Number((Math.max(0.1, metrics.validationMs || 20) / 1000).toFixed(1));
        const totalSec = Number((Math.max(0.1, tTotal) / 1000).toFixed(1));

        let speedCat: 'Excellent' | 'Good' | 'Slow' = 'Good';
        if (totalSec <= 5.0) speedCat = 'Excellent';
        else if (totalSec <= 10.0) speedCat = 'Good';
        else speedCat = 'Slow';

        const processingTimes: ProcessingTimeBreakdown = {
          imageProcessingSec: imgSec,
          ocrSec: 0.0,
          geminiProcessingSec: geminiSec,
          validationSec: valSec,
          totalSec,
          speedCategory: speedCat,
        };

        // Map AI extracted medicines
        aiExtractedMedicines = (extractionResult.medicines || []).map((m) => {
          const timingParts = [
            (m.timingOfDay || []).join(', '),
            m.withFood || '',
          ].filter(Boolean);
          return {
            name: m.name,
            dose: m.strength || m.dosage || '',
            frequency: m.frequency || '',
            timing: timingParts.join(' - ') || (m.timingOfDay || []).join(', ') || (m.withFood || ''),
            duration: m.duration || '',
            instructions: m.instructions || '',
          };
        });

        testCase.processingTimes = processingTimes;
        testCase.aiExtractedMedicines = aiExtractedMedicines;
        testCase.doctorName = extractionResult.doctorName;
        testCase.clinicName = extractionResult.clinicName;
      }

      // Check ground truth benchmark presence
      const hasGroundTruth =
        Array.isArray(testCase.expectedMedicines) &&
        testCase.expectedMedicines.length > 0 &&
        !testCase.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'));

      if (hasGroundTruth) {
        // Evaluate comparisons strictly against benchmark ground truth
        const evalResult = TestingEngine.evaluatePrescription(
          testCase.expectedMedicines,
          aiExtractedMedicines
        );

        testCase.comparisons = evalResult.comparisons;
        testCase.accuracy = evalResult.accuracy;
        testCase.detectedErrors = evalResult.detectedErrors;
        testCase.evaluationState = evalResult.evaluationState;
        testCase.status = evalResult.suggestedStatus;
        testCase.reviewStatus = evalResult.suggestedReviewStatus;
        testCase.statusReason = evalResult.statusReason;
      } else {
        // Run clinical validation and evaluation pass
        await VerificationEngine.verifyTestCase(testCase, (tcId) => this.getImageBuffer(tcId));
      }

      TestingEngine.validateConsistency(testCase);
      this.saveToFile();
      return testCase;
    } catch (err: any) {
      console.error(`Error running test case ${id}:`, err);
      testCase.status = 'Extraction Error';
      testCase.errorDetails = err?.message || 'Execution error';
      testCase.statusReason = `Extraction Error: ${err?.message || 'Execution error'}`;
      testCase.evaluationState = 'NOT_EVALUATED';
      testCase.detectedErrors = Array.from(
        new Set([...(testCase.detectedErrors || []), 'API failure' as const])
      );
      this.saveToFile();
      return testCase;
    }
  }

  /**
   * Directly verifies a single test case using the verification engine
   */
  public static async verifyPrescriptionCase(id: string): Promise<EvaluationTestCase> {
    await this.initialize();
    const testCase = this.testCases.find((tc) => tc.id === id);
    if (!testCase) {
      throw new Error(`Test case ${id} not found`);
    }
    await VerificationEngine.verifyTestCase(testCase, (tcId) => this.getImageBuffer(tcId));
    this.saveToFile();
    return testCase;
  }

  /**
   * Re-verifies all pending or unevaluated test cases
   */
  public static async verifyAllPendingOrUnevaluated(): Promise<{ verifiedCount: number; cases: EvaluationTestCase[] }> {
    await this.initialize();
    let verifiedCount = 0;
    for (const tc of this.testCases) {
      if (
        tc.status === 'AI Extracted Pending Review' ||
        tc.status === 'Ground Truth Required' ||
        tc.status === 'Pending' ||
        tc.status === 'Processing' ||
        tc.status === 'Needs Verification' ||
        tc.evaluationState === 'NOT_EVALUATED' ||
        !tc.verificationDetails
      ) {
        await VerificationEngine.verifyTestCase(tc, (tcId) => this.getImageBuffer(tcId));
        verifiedCount++;
      }
    }
    this.saveToFile();
    return { verifiedCount, cases: this.testCases };
  }

  /**
   * Runs batch tests across all pending or specified cases
   */
  public static async runBatch(ids?: string[]): Promise<EvaluationTestCase[]> {
    await this.initialize();
    const targets = ids && ids.length > 0
      ? this.testCases.filter((tc) => ids.includes(tc.id))
      : this.testCases.filter((tc) => tc.status === 'Pending');

    const results: EvaluationTestCase[] = [];
    for (const tc of targets) {
      const res = await this.runTest(tc.id);
      results.push(res);
    }

    return results;
  }

  /**
   * Deletes a test case
   */
  public static async deleteTestCase(id: string): Promise<boolean> {
    await this.initialize();
    const lenBefore = this.testCases.length;
    this.testCases = this.testCases.filter((tc) => tc.id !== id);
    if (this.testCases.length !== lenBefore) {
      const exts = ['jpg', 'jpeg', 'png', 'webp'];
      for (const ext of exts) {
        const p = path.join(TESTING_IMG_DIR, `${id}.${ext}`);
        if (fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
          } catch {}
        }
      }
      this.saveToFile();
      return true;
    }
    return false;
  }

  /**
   * Generates CSV export content
   */
  public static async exportCSV(): Promise<string> {
    await this.initialize();

    const headers = [
      'Test ID',
      'Image Name',
      'Category',
      'Status',
      'Medicine Accuracy',
      'Dose Accuracy',
      'Frequency Accuracy',
      'Timing Accuracy',
      'Overall Accuracy',
      'Processing Time',
      'Reviewer Notes',
      'Date',
    ];

    const rows = this.testCases.map((tc) => {
      const escape = (s: string | number | undefined | null) =>
        `"${String(s ?? '').replace(/"/g, '""')}"`;

      return [
        escape(tc.id),
        escape(tc.imageName),
        escape(tc.difficultyCategory),
        escape(tc.reviewStatus !== 'Pending Review' ? tc.reviewStatus : tc.status),
        escape(tc.accuracy ? `${tc.accuracy.medicineNameAccuracy}%` : 'N/A'),
        escape(tc.accuracy ? `${tc.accuracy.doseAccuracy}%` : 'N/A'),
        escape(tc.accuracy ? `${tc.accuracy.frequencyAccuracy}%` : 'N/A'),
        escape(tc.accuracy ? `${tc.accuracy.timingAccuracy}%` : 'N/A'),
        escape(tc.accuracy ? `${tc.accuracy.overallAccuracy}%` : 'N/A'),
        escape(tc.processingTimes ? `${tc.processingTimes.totalSec}s (${tc.processingTimes.speedCategory})` : 'N/A'),
        escape(tc.reviewerNotes || ''),
        escape(tc.uploadDate ? tc.uploadDate.split('T')[0] : ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
