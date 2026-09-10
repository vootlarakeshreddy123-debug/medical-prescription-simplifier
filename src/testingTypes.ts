export type EvaluationState =
  | 'NOT_EVALUATED'
  | 'NO_MEDICINE_DETECTED'
  | 'NEEDS_VERIFICATION'
  | 'EVALUATED';

export type TestStatus =
  | 'Passed – AI Verified'
  | 'Passed – Benchmark Verified'
  | 'Partially Correct – Benchmark Verified'
  | 'Failed – Benchmark Verified'
  | 'Needs Verification'
  | 'No Medicine Detected'
  | 'Extraction Error'
  | 'AI Extracted Pending Review'
  | 'Pending'
  | 'Processing'
  | 'Passed'
  | 'Partially Correct'
  | 'Failed'
  | 'Ground Truth Required'
  | 'API Error';

export type EvaluationStatus =
  | 'not_evaluated'
  | 'evaluated'
  | 'needs_verification'
  | 'no_medicine_detected';

export type ClinicalResult =
  | 'passed'
  | 'partially_correct'
  | 'failed'
  | null;

export type ExtractionStatus =
  | 'pending'
  | 'processing'
  | 'extracted'
  | 'no_medicine_detected'
  | 'error';

export type DifficultyCategory =
  | 'Clear Printed'
  | 'Clear Handwritten'
  | 'Medium Handwritten'
  | 'Difficult Handwritten'
  | 'Low Quality / Blurry'
  | 'Mixed Prescription';

export type ReviewStatus =
  | 'Pending Review'
  | 'Passed'
  | 'Partially Correct'
  | 'Failed'
  | 'Needs Verification'
  | 'Confirmed Correct'
  | 'Confirmed Incorrect'
  | 'Confirmed No Medicine'
  | 'Marked Unreadable';

export type ReviewDecision =
  | 'Confirmed AI Result'
  | 'Marked AI Result Incorrect'
  | 'Ground Truth Corrected'
  | 'Confirmed No Medicine Present'
  | 'Marked Prescription Unreadable'
  | 'Re-run Extraction';

export type FieldComparisonStatus =
  | 'Correct'
  | 'Incorrect'
  | 'Missing'
  | 'Needs Verification'
  | 'Not Evaluated';

export interface ExpectedMedicine {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions?: string;
}

export interface FieldComparison {
  expected: string;
  actual: string;
  status: FieldComparisonStatus;
  notes?: string;
}

export interface ComparisonDebugInfo {
  groundTruthMedicine: string;
  aiExtractedMedicine: string;
  normalizedGroundTruth: string;
  normalizedAiResult: string;
  matchResult: string;
  passFailReason: string;
}

export interface MedicineComparison {
  expectedId?: string;
  expectedName: string;
  actualName: string;
  medicineName: FieldComparison;
  dose: FieldComparison;
  frequency: FieldComparison;
  timing: FieldComparison;
  duration: FieldComparison;
  instructions: FieldComparison;
  overallMedicineStatus: FieldComparisonStatus;
  debugInfo?: ComparisonDebugInfo;
}

export interface ProcessingTimeBreakdown {
  imageProcessingSec: number;
  ocrSec: number;
  geminiProcessingSec: number;
  validationSec: number;
  totalSec: number;
  speedCategory: 'Excellent' | 'Good' | 'Slow'; // 0–5s = Excellent, 5–10s = Good, >10s = Slow
}

export interface AccuracyBreakdown {
  medicineNameAccuracy: number; // 0 - 100%
  doseAccuracy: number; // 0 - 100%
  frequencyAccuracy: number; // 0 - 100%
  timingAccuracy: number; // 0 - 100%
  overallAccuracy: number; // 0 - 100%
}

export type CommonErrorType =
  | 'Missing medicines'
  | 'Extra medicines'
  | 'Medicine name incorrectly detected'
  | 'Dose incorrectly detected'
  | 'Frequency missing'
  | 'Incorrect frequency'
  | 'Timing missing'
  | 'Incorrect timing'
  | 'Duration incorrect'
  | 'Instructions incorrect'
  | 'Handwriting unreadable'
  | 'Image quality issue'
  | 'Prescription structure issue'
  | 'API failure'
  | 'Timeout'
  | 'Needs manual verification';

export interface VerificationFieldCheck {
  medicineName: string;
  isNameConsistent: boolean;
  isDoseConsistent: boolean;
  isFrequencyConsistent: boolean;
  isTimingConsistent: boolean;
  isDurationConsistent: boolean;
  isInstructionConsistent: boolean;
  notes?: string;
}

export interface VerificationDetails {
  verifiedAt: string;
  method: 'AI_VERIFICATION_PASS' | 'HUMAN_BENCHMARK';
  confidenceScore: number;
  isConsistent: boolean;
  handwritingAmbiguous: boolean;
  hasMajorConflict: boolean;
  verifiedMedicinesCount: number;
  verificationSummary: string;
  fieldChecks?: VerificationFieldCheck[];
}

export interface EvaluationTestCase {
  id: string; // e.g. "TEST-001"
  imageName: string;
  imageUrl?: string; // base64 or url
  uploadDate: string;
  difficultyCategory: DifficultyCategory;
  status: TestStatus;
  evaluationState?: EvaluationState;
  extractionStatus?: ExtractionStatus;
  evaluationStatus?: EvaluationStatus;
  clinicalResult?: ClinicalResult;
  statusReason?: string;
  processingTimes?: ProcessingTimeBreakdown;
  expectedMedicines: ExpectedMedicine[];
  aiExtractedMedicines?: {
    name: string;
    dose: string;
    frequency: string;
    timing: string;
    duration: string;
    instructions: string;
  }[];
  comparisons?: MedicineComparison[];
  accuracy?: AccuracyBreakdown;
  reviewStatus: ReviewStatus;
  reviewerNotes: string;
  detectedErrors: CommonErrorType[];
  errorDetails?: string;
  doctorName?: string;
  clinicName?: string;
  rawExtractionText?: string;
  verificationDetails?: VerificationDetails;
}

export interface FeedbackLearningRecord {
  id: string;
  testId: string;
  imageName: string;
  imageUrl?: string;
  imageDifficulty: DifficultyCategory;
  aiExtractedResult: {
    medicines: {
      name: string;
      dose: string;
      frequency: string;
      timing: string;
      duration: string;
      instructions: string;
    }[];
    doctorName?: string;
    clinicName?: string;
  };
  humanCorrectedResult?: {
    medicines: ExpectedMedicine[];
    reviewerNotes?: string;
  };
  groundTruth: ExpectedMedicine[];
  errorTypes: CommonErrorType[];
  reviewDecision: ReviewDecision;
  reviewStatus: ReviewStatus;
  timestamp: string;
  evaluationState: EvaluationState;
  notes?: string;
}

export interface TestingDashboardMetrics {
  totalTestCases: number;
  processingComplete: number;
  stillProcessing: number;

  // Complete, mutually exclusive partition (Sum of all = totalTestCases)
  passedBenchmarkVerified: number;
  partiallyCorrectBenchmarkVerified: number;
  failedBenchmarkVerified: number;
  passedAiVerified: number;
  needsVerification: number;
  noMedicineDetected: number;
  extractionError: number;

  // OFFICIAL BENCHMARK ACCURACY (strictly from tests with independently verified ground truth)
  benchmarkEvaluatedCases: number;
  officialBenchmarkAccuracyPercentage: number;
  benchmarkPassedCount: number;
  benchmarkPartiallyCorrectCount: number;
  benchmarkFailedCount: number;

  // AI VERIFIED RESULTS (separate from official benchmark accuracy)
  aiVerifiedPassedCount: number;
  automaticallyVerifiedCases: number;
  needsHumanVerificationCount: number;

  // Compatibility fields
  unevaluatedCount?: number;
  queueEligibleCount?: number;
  passedCount?: number;
  partiallyCorrectCount?: number;
  failedCount?: number;
  processedSuccessfully: number;
  evaluatedWithGroundTruth: number;
  testsPassed: number;
  testsPartiallyCorrect: number;
  testsFailed: number;
  testsNeedsVerification: number;
  testsGroundTruthRequired: number;
  testsNoMedicineDetected: number;
  testsExtractionError: number;
  pendingTests: number;
  testsCompleted: number;

  overallAccuracyPercentage: number;
  averageProcessingTimeSec: number;
  fastestProcessingTimeSec: number;
  slowestProcessingTimeSec: number;

  fieldAccuracy: {
    medicineNameAccuracy: number;
    doseAccuracy: number;
    frequencyAccuracy: number;
    timingAccuracy: number;
    overallAccuracy: number;
  };

  categoryAccuracy: Record<
    DifficultyCategory,
    { total: number; completed: number; accuracy: number }
  >;

  commonErrorsCount: Record<CommonErrorType, number>;
}

export interface BatchJobStatus {
  jobId: string;
  isRunning: boolean;
  isPaused: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  totalInBatch: number;
  totalTestCases: number;
  currentNumber: number; // e.g. 42
  completedCount: number;
  remainingCount: number;
  errorCount: number;

  // Real-time categorized counts
  passedAiVerifiedCount: number;
  passedBenchmarkVerifiedCount: number;
  needsVerificationCount: number;
  noMedicineDetectedCount: number;

  currentProcessingIds: string[];
  currentImageName: string;
  errors: { id: string; error: string }[];
}
