import fs from 'fs';
import path from 'path';
import { BatchJobStatus, EvaluationTestCase } from '../src/testingTypes';
import { TestingService } from './testingService';

const DATA_DIR = path.join(process.cwd(), '.data');
const BATCH_STATUS_FILE = path.join(DATA_DIR, 'batch_job_status.json');

export class BatchQueueService {
  private static isRunning = false;
  private static isPaused = false;
  private static queue: EvaluationTestCase[] = [];
  private static inFlightCount = 0;
  private static readonly CONCURRENCY = 2; // Safe queue concurrency to prevent rate limits

  private static currentStatus: BatchJobStatus = {
    jobId: '',
    isRunning: false,
    isPaused: false,
    startedAt: null,
    finishedAt: null,
    totalInBatch: 0,
    totalTestCases: 0,
    currentNumber: 0,
    completedCount: 0,
    remainingCount: 0,
    errorCount: 0,
    passedAiVerifiedCount: 0,
    passedBenchmarkVerifiedCount: 0,
    needsVerificationCount: 0,
    noMedicineDetectedCount: 0,
    currentProcessingIds: [],
    currentImageName: '',
    errors: [],
  };

  /**
   * Identifies whether a test case qualifies as unevaluated/needing automated processing
   */
  public static isUnevaluatedTestCase(tc: EvaluationTestCase): boolean {
    // 1. Terminal evaluated cases must NEVER be classified as unevaluated or re-queued
    if (
      tc.evaluationStatus === 'evaluated' ||
      tc.evaluationStatus === 'needs_verification' ||
      tc.evaluationStatus === 'no_medicine_detected'
    ) {
      if (
        tc.status !== 'Pending' &&
        tc.status !== 'Processing' &&
        tc.status !== 'API Error' &&
        tc.status !== 'Extraction Error'
      ) {
        return false;
      }
    }

    // 2. Confirmed No Medicine specimen
    if (
      tc.status === 'No Medicine Detected' ||
      tc.evaluationState === 'NO_MEDICINE_DETECTED' ||
      tc.evaluationStatus === 'no_medicine_detected'
    ) {
      return false;
    }

    // 3. Clinical results or verified statuses
    if (
      tc.clinicalResult === 'passed' ||
      tc.clinicalResult === 'partially_correct' ||
      tc.clinicalResult === 'failed' ||
      tc.status === 'Passed' ||
      tc.status === 'Passed – Benchmark Verified' ||
      tc.status === 'Passed – AI Verified' ||
      tc.status === 'Partially Correct' ||
      tc.status === 'Partially Correct – Benchmark Verified' ||
      tc.status === 'Failed' ||
      tc.status === 'Failed – Benchmark Verified'
    ) {
      return false;
    }

    // 4. "Needs Verification" is an evaluation outcome, NOT unevaluated!
    // If it has verificationDetails, comparisons, or human review, it has completed evaluation
    if (
      tc.status === 'Needs Verification' ||
      tc.evaluationState === 'NEEDS_VERIFICATION' ||
      tc.evaluationStatus === 'needs_verification'
    ) {
      if (tc.verificationDetails || tc.accuracy || (tc.comparisons && tc.comparisons.length > 0)) {
        return false;
      }
    }

    // 5. Explicit error or pending statuses that genuinely need processing/retry
    if (tc.status === 'Pending' || tc.status === 'Processing') {
      return true;
    }
    if (tc.status === 'API Error' || tc.status === 'Extraction Error') {
      return true;
    }

    // 6. Completely missing extraction and not a no-medicine case
    if (!tc.aiExtractedMedicines || tc.aiExtractedMedicines.length === 0) {
      return true;
    }

    // 7. If existing records contain valid evaluation or comparison data, do NOT reprocess
    if (tc.accuracy !== undefined || tc.verificationDetails !== undefined) {
      return false;
    }

    // 8. If marked explicitly as not evaluated
    if (tc.evaluationStatus === 'not_evaluated' || tc.evaluationState === 'NOT_EVALUATED') {
      return true;
    }

    // 9. Legacy unreviewed cases without any evaluation data
    if (tc.status === 'AI Extracted Pending Review' || tc.status === 'Ground Truth Required') {
      return true;
    }

    return false;
  }

  private static saveStatusToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(BATCH_STATUS_FILE, JSON.stringify(this.currentStatus, null, 2));
    } catch (err) {
      console.error('Failed to save batch status:', err);
    }
  }

  /**
   * Retrieves current batch status, dynamically counting remaining unevaluated tests if idle
   */
  public static async getStatus(): Promise<BatchJobStatus> {
    const allCases = await TestingService.getTestCases();
    const unevaluatedCount = allCases.filter((tc) => this.isUnevaluatedTestCase(tc)).length;

    const passedAiVerifiedCount = allCases.filter((tc) => tc.status === 'Passed – AI Verified').length;
    const passedBenchmarkVerifiedCount = allCases.filter((tc) => tc.status === 'Passed – Benchmark Verified' || (tc.status === 'Passed' && tc.expectedMedicines && tc.expectedMedicines.length > 0)).length;
    const needsVerificationCount = allCases.filter((tc) => tc.status === 'Needs Verification').length;
    const noMedicineDetectedCount = allCases.filter((tc) => tc.status === 'No Medicine Detected').length;

    if (!this.isRunning) {
      // Return idle status updated with current counts
      return {
        ...this.currentStatus,
        isRunning: false,
        isPaused: this.isPaused,
        totalTestCases: allCases.length,
        remainingCount: unevaluatedCount,
        passedAiVerifiedCount,
        passedBenchmarkVerifiedCount,
        needsVerificationCount,
        noMedicineDetectedCount,
      };
    }

    return {
      ...this.currentStatus,
      totalTestCases: allCases.length,
      passedAiVerifiedCount,
      passedBenchmarkVerifiedCount,
      needsVerificationCount,
      noMedicineDetectedCount,
    };
  }

  /**
   * Starts or resumes batch execution of all unevaluated tests
   */
  public static async startOrResumeBatch(): Promise<BatchJobStatus> {
    const allCases = await TestingService.getTestCases();
    const targets = allCases.filter((tc) => this.isUnevaluatedTestCase(tc));

    if (this.isRunning) {
      if (this.isPaused) {
        this.isPaused = false;
        this.currentStatus.isPaused = false;
        this.saveStatusToDisk();
        this.processQueue();
      }
      return this.getStatus();
    }

    if (targets.length === 0) {
      return {
        jobId: `job_${Date.now()}`,
        isRunning: false,
        isPaused: false,
        startedAt: null,
        finishedAt: new Date().toISOString(),
        totalInBatch: 0,
        totalTestCases: allCases.length,
        currentNumber: 0,
        completedCount: 0,
        remainingCount: 0,
        errorCount: 0,
        passedAiVerifiedCount: allCases.filter((tc) => tc.status === 'Passed – AI Verified').length,
        passedBenchmarkVerifiedCount: allCases.filter((tc) => tc.status === 'Passed – Benchmark Verified' || (tc.status === 'Passed' && tc.expectedMedicines && tc.expectedMedicines.length > 0)).length,
        needsVerificationCount: allCases.filter((tc) => tc.status === 'Needs Verification').length,
        noMedicineDetectedCount: allCases.filter((tc) => tc.status === 'No Medicine Detected').length,
        currentProcessingIds: [],
        currentImageName: '',
        errors: [],
      };
    }

    // Initialize fresh or resumed batch job
    this.queue = [...targets];
    this.isRunning = true;
    this.isPaused = false;

    this.currentStatus = {
      jobId: `job_${Date.now()}`,
      isRunning: true,
      isPaused: false,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      totalInBatch: targets.length,
      totalTestCases: allCases.length,
      currentNumber: 0,
      completedCount: 0,
      remainingCount: targets.length,
      errorCount: 0,
      passedAiVerifiedCount: allCases.filter((tc) => tc.status === 'Passed – AI Verified').length,
      passedBenchmarkVerifiedCount: allCases.filter((tc) => tc.status === 'Passed – Benchmark Verified' || (tc.status === 'Passed' && tc.expectedMedicines && tc.expectedMedicines.length > 0)).length,
      needsVerificationCount: allCases.filter((tc) => tc.status === 'Needs Verification').length,
      noMedicineDetectedCount: allCases.filter((tc) => tc.status === 'No Medicine Detected').length,
      currentProcessingIds: [],
      currentImageName: targets[0]?.imageName || '',
      errors: [],
    };

    this.saveStatusToDisk();

    // Launch worker pool with safe limited concurrency
    for (let i = 0; i < this.CONCURRENCY; i++) {
      this.processQueue();
    }

    return this.getStatus();
  }

  /**
   * Internal queue processor executing with safe concurrency
   */
  private static async processQueue(): Promise<void> {
    if (!this.isRunning || this.isPaused) return;
    if (this.queue.length === 0) {
      if (this.inFlightCount === 0) {
        this.isRunning = false;
        this.currentStatus.isRunning = false;
        this.currentStatus.finishedAt = new Date().toISOString();
        this.currentStatus.currentProcessingIds = [];
        this.currentStatus.currentImageName = '';
        this.saveStatusToDisk();
      }
      return;
    }

    const tc = this.queue.shift();
    if (!tc) return;

    this.inFlightCount++;
    this.currentStatus.currentProcessingIds = [
      ...this.currentStatus.currentProcessingIds,
      tc.id,
    ];
    this.currentStatus.currentImageName = tc.imageName;
    this.saveStatusToDisk();

    try {
      const updated = await TestingService.runTest(tc.id);
      this.currentStatus.completedCount++;
      if (updated.status === 'Passed – AI Verified') {
        this.currentStatus.passedAiVerifiedCount++;
      } else if (updated.status === 'Passed – Benchmark Verified') {
        this.currentStatus.passedBenchmarkVerifiedCount++;
      } else if (updated.status === 'Needs Verification') {
        this.currentStatus.needsVerificationCount++;
      } else if (updated.status === 'No Medicine Detected') {
        this.currentStatus.noMedicineDetectedCount++;
      }
    } catch (err: any) {
      console.error(`Batch processing error on ${tc.id}:`, err);
      this.currentStatus.errorCount++;
      this.currentStatus.errors.push({
        id: tc.id,
        error: err?.message || 'Processing error',
      });
    } finally {
      this.inFlightCount--;
      this.currentStatus.currentProcessingIds = this.currentStatus.currentProcessingIds.filter(
        (id) => id !== tc.id
      );
      this.currentStatus.currentNumber =
        this.currentStatus.completedCount + this.currentStatus.errorCount;
      this.currentStatus.remainingCount = Math.max(
        0,
        this.currentStatus.totalInBatch - this.currentStatus.currentNumber
      );
      this.saveStatusToDisk();

      // Continue queue
      if (this.isRunning && !this.isPaused) {
        this.processQueue();
      }
    }
  }

  /**
   * Pauses the batch queue execution gracefully
   */
  public static pauseBatch(): BatchJobStatus {
    this.isPaused = true;
    this.currentStatus.isPaused = true;
    this.saveStatusToDisk();
    return this.currentStatus;
  }

  /**
   * Resumes a paused batch queue
   */
  public static resumeBatch(): BatchJobStatus {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.currentStatus.isPaused = false;
      this.saveStatusToDisk();
      for (let i = 0; i < this.CONCURRENCY; i++) {
        this.processQueue();
      }
    }
    return this.currentStatus;
  }

  /**
   * Stops and clears the current batch execution
   */
  public static stopBatch(): BatchJobStatus {
    this.isRunning = false;
    this.isPaused = false;
    this.queue = [];
    this.currentStatus.isRunning = false;
    this.currentStatus.isPaused = false;
    this.currentStatus.finishedAt = new Date().toISOString();
    this.currentStatus.currentProcessingIds = [];
    this.currentStatus.currentImageName = '';
    this.saveStatusToDisk();
    return this.currentStatus;
  }
}
