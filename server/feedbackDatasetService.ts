import fs from 'fs';
import path from 'path';
import {
  CommonErrorType,
  EvaluationTestCase,
  FeedbackLearningRecord,
  ReviewDecision,
} from '../src/testingTypes';

const DATA_DIR = path.join(process.cwd(), '.data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback_learning_dataset.json');

export class FeedbackDatasetService {
  private static records: FeedbackLearningRecord[] = [];
  private static isInitialized = false;

  private static ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public static initialize(): void {
    if (this.isInitialized) return;
    this.ensureDataDir();

    if (fs.existsSync(FEEDBACK_FILE)) {
      try {
        const raw = fs.readFileSync(FEEDBACK_FILE, 'utf8');
        this.records = JSON.parse(raw);
        this.isInitialized = true;
        return;
      } catch (err) {
        console.warn('Could not parse feedback_learning_dataset.json, resetting to empty array:', err);
      }
    }

    this.records = [];
    this.saveToFile();
    this.isInitialized = true;
  }

  private static saveToFile(): void {
    this.ensureDataDir();
    try {
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(this.records, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write feedback_learning_dataset.json:', err);
    }
  }

  /**
   * Adds or updates a feedback record for a test case upon human review
   */
  public static addFeedbackRecord(
    input: Omit<FeedbackLearningRecord, 'id' | 'timestamp'> & { timestamp?: string }
  ): FeedbackLearningRecord {
    this.initialize();

    const recordId = `FBL_${input.testId}_${Date.now()}`;
    const newRecord: FeedbackLearningRecord = {
      id: recordId,
      timestamp: input.timestamp || new Date().toISOString(),
      testId: input.testId,
      imageName: input.imageName,
      imageUrl: input.imageUrl,
      imageDifficulty: input.imageDifficulty,
      aiExtractedResult: input.aiExtractedResult,
      humanCorrectedResult: input.humanCorrectedResult,
      groundTruth: input.groundTruth || [],
      errorTypes: input.errorTypes || [],
      reviewDecision: input.reviewDecision,
      reviewStatus: input.reviewStatus,
      evaluationState: input.evaluationState,
      notes: input.notes,
    };

    // Remove any older record for the same testId to keep latest state, or push
    const existingIdx = this.records.findIndex((r) => r.testId === input.testId);
    if (existingIdx >= 0) {
      this.records[existingIdx] = newRecord;
    } else {
      this.records.unshift(newRecord);
    }

    this.saveToFile();
    return newRecord;
  }

  /**
   * Returns all feedback learning records
   */
  public static getAllRecords(): FeedbackLearningRecord[] {
    this.initialize();
    return this.records;
  }

  /**
   * Seeds feedback records from cases that have already been reviewed by human
   */
  public static seedFromReviewedCases(cases: EvaluationTestCase[]): void {
    this.initialize();
    if (this.records.length > 0) return;

    for (const tc of cases) {
      if (
        tc.reviewStatus &&
        tc.reviewStatus !== 'Pending Review' &&
        tc.expectedMedicines &&
        tc.expectedMedicines.length > 0
      ) {
        let decision: ReviewDecision = 'Ground Truth Corrected';
        if (tc.reviewStatus === 'Passed') decision = 'Confirmed AI Result';
        else if (tc.reviewStatus === 'Failed') decision = 'Marked AI Result Incorrect';

        this.addFeedbackRecord({
          testId: tc.id,
          imageName: tc.imageName,
          imageUrl: tc.imageUrl,
          imageDifficulty: tc.difficultyCategory,
          aiExtractedResult: {
            medicines: tc.aiExtractedMedicines || [],
            doctorName: tc.doctorName,
            clinicName: tc.clinicName,
          },
          humanCorrectedResult: {
            medicines: tc.expectedMedicines,
            reviewerNotes: tc.reviewerNotes,
          },
          groundTruth: tc.expectedMedicines,
          errorTypes: tc.detectedErrors || [],
          reviewDecision: decision,
          reviewStatus: tc.reviewStatus,
          evaluationState: 'EVALUATED',
          notes: tc.reviewerNotes,
        });
      }
    }
  }

  /**
   * Returns aggregated error statistics & review distributions
   */
  public static getStats() {
    this.initialize();
    const totalReviewed = this.records.length;

    const errorDistribution: Record<CommonErrorType, number> = {
      'Missing medicines': 0,
      'Extra medicines': 0,
      'Medicine name incorrectly detected': 0,
      'Dose incorrectly detected': 0,
      'Frequency missing': 0,
      'Incorrect frequency': 0,
      'Timing missing': 0,
      'Incorrect timing': 0,
      'Duration incorrect': 0,
      'Instructions incorrect': 0,
      'Handwriting unreadable': 0,
      'Image quality issue': 0,
      'Prescription structure issue': 0,
      'API failure': 0,
      'Timeout': 0,
      'Needs manual verification': 0,
    };

    const decisionBreakdown: Record<ReviewDecision, number> = {
      'Confirmed AI Result': 0,
      'Marked AI Result Incorrect': 0,
      'Ground Truth Corrected': 0,
      'Confirmed No Medicine Present': 0,
      'Marked Prescription Unreadable': 0,
      'Re-run Extraction': 0,
    };

    for (const rec of this.records) {
      if (decisionBreakdown[rec.reviewDecision] !== undefined) {
        decisionBreakdown[rec.reviewDecision]++;
      }
      for (const err of rec.errorTypes) {
        if (errorDistribution[err] !== undefined) {
          errorDistribution[err]++;
        }
      }
    }

    return {
      totalReviewed,
      errorDistribution,
      decisionBreakdown,
    };
  }

  /**
   * Exports dataset as JSON string
   */
  public static exportJSON(): string {
    this.initialize();
    return JSON.stringify(
      {
        datasetPurpose:
          'Prescription Simplifier AI Feedback & Model Evaluation Benchmark Dataset. Used to identify handwriting, OCR, and dosage extraction discrepancies, optimize vision prompts, and compare future model checkpoints. Note: Gemini models do not automatically self-train on these records; this dataset is used by human engineering and quality reviewers.',
        exportedAt: new Date().toISOString(),
        totalRecords: this.records.length,
        records: this.records,
      },
      null,
      2
    );
  }

  /**
   * Exports dataset as CSV string
   */
  public static exportCSV(): string {
    this.initialize();
    const headers = [
      'Record ID',
      'Test ID',
      'Image Name',
      'Difficulty',
      'Evaluation State',
      'Review Status',
      'Review Decision',
      'Extracted Meds Count',
      'Ground Truth Meds Count',
      'Detected Errors',
      'Reviewer Notes',
      'Timestamp',
    ];

    const rows = this.records.map((r) => {
      const escape = (s: string | number | undefined | null) =>
        `"${String(s ?? '').replace(/"/g, '""')}"`;

      return [
        escape(r.id),
        escape(r.testId),
        escape(r.imageName),
        escape(r.imageDifficulty),
        escape(r.evaluationState),
        escape(r.reviewStatus),
        escape(r.reviewDecision),
        escape(r.aiExtractedResult?.medicines?.length || 0),
        escape(r.groundTruth?.length || 0),
        escape((r.errorTypes || []).join('; ')),
        escape(r.notes || r.humanCorrectedResult?.reviewerNotes || ''),
        escape(r.timestamp),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
