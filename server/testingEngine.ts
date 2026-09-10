import {
  AccuracyBreakdown,
  CommonErrorType,
  ComparisonDebugInfo,
  DifficultyCategory,
  EvaluationState,
  EvaluationTestCase,
  ExpectedMedicine,
  FieldComparison,
  FieldComparisonStatus,
  MedicineComparison,
  ReviewStatus,
  TestingDashboardMetrics,
  TestStatus,
} from '../src/testingTypes';

export interface PrescriptionEvaluationResult {
  comparisons: MedicineComparison[];
  accuracy?: AccuracyBreakdown;
  detectedErrors: CommonErrorType[];
  suggestedStatus: TestStatus;
  suggestedReviewStatus: ReviewStatus;
  evaluationState: EvaluationState;
  statusReason: string;
}

/**
 * Checks if a field is intentionally blank, missing, unstated, or generic placeholder
 */
export function isBlankOrUnspecified(val: string | undefined | null): boolean {
  if (val === undefined || val === null) return true;
  const s = String(val).trim().toLowerCase();
  return (
    s === '' ||
    s === '-' ||
    s === '—' ||
    s === '–' ||
    s === 'n/a' ||
    s === 'na' ||
    s === 'none' ||
    s === 'nil' ||
    s === 'null' ||
    s === 'undefined' ||
    s === 'unknown' ||
    s === 'unspecified' ||
    s === 'not specified' ||
    s === 'not mentioned' ||
    s === 'not applicable' ||
    s === '(none)' ||
    s === '(missing)' ||
    s === 'as prescribed' ||
    s === 'take as instructed' ||
    s === 'follow package guidance' ||
    s === 'unclear'
  );
}

export class TestingEngine {
  /**
   * Normalizes medicine name for comparison:
   * - Lowercase (case-insensitive)
   * - Strips pharmaceutical prefixes/suffixes (Tab, Cap, Syp, Inj, etc.)
   * - Strips harmless punctuation (hyphens, slashes, brackets, periods)
   * - Collapses multiple spaces
   */
  public static normalizeMedicineName(val: string | undefined | null): string {
    if (!val) return '';
    let s = String(val).toLowerCase();
    // Strip common dosage form prefixes/suffixes
    s = s.replace(
      /\b(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|syp|syrup|inj|injection|injections|drop|drops|eye drops?|ear drops?|ointment|gel|cream|suspension|solution|soln|rotacap|inhaler)\b/gi,
      ' '
    );
    // Replace punctuation with spaces
    s = s.replace(/[\(\)\[\]\{\}\.,\-_/\\:;'"`~*+&|#@!%^?]/g, ' ');
    // Collapse multiple spaces
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  /**
   * Normalizes dose/strength:
   * - Collapses spaces between numbers and units (e.g. "40 mg" -> "40mg")
   * - Normalizes units (milligrams -> mg, micrograms -> mcg, ug -> mcg, etc.)
   * - Case-insensitive
   */
  public static normalizeDose(val: string | undefined | null): string {
    if (isBlankOrUnspecified(val)) return '';
    let s = String(val).toLowerCase().trim();
    // Collapse spaces between number and unit (e.g. 40 mg -> 40mg, 0.5 ml -> 0.5ml)
    s = s.replace(/(\d+(?:\.\d+)?)\s+([a-zA-Z%]+)/g, '$1$2');
    // Normalize units
    s = s.replace(/\bmilligrams?\b/g, 'mg');
    s = s.replace(/\bmicrograms?\b/g, 'mcg');
    s = s.replace(/\bug\b/g, 'mcg');
    s = s.replace(/\bgrams?\b/g, 'g');
    s = s.replace(/\bmilliliters?\b/g, 'ml');
    s = s.replace(/\btablets?\b/g, 'tab');
    s = s.replace(/\bcapsules?\b/g, 'cap');
    // Clean harmless punctuation
    s = s.replace(/[\(\)\[\]\{\},;]/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  /**
   * Compares medicine names case-insensitively with normalization:
   * BETACAP TR == Betacap TR
   * Tab. Augmentin == Augmentin (Amoxicillin & Clavulanate)
   */
  public static compareMedicineName(expected: string, actual: string): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth medicine name not specified',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected,
        actual: actual || '(Missing)',
        status: 'Missing',
        notes: 'AI missed this medicine in extraction',
      };
    }

    const expNorm = this.normalizeMedicineName(expected);
    const actNorm = this.normalizeMedicineName(actual);

    // Exact normalized match (handles BETACAP TR == Betacap TR, extra spaces, punctuation)
    if (expNorm === actNorm) {
      return { expected, actual, status: 'Correct', notes: 'Exact match (normalized)' };
    }

    // Strip numbers/strengths if embedded in the name (e.g. "Betacap TR 40" vs "Betacap TR")
    const expNoNum = expNorm.replace(/\b\d+(?:mg|mcg|ml|g|tab)?\b/g, '').replace(/\s+/g, ' ').trim();
    const actNoNum = actNorm.replace(/\b\d+(?:mg|mcg|ml|g|tab)?\b/g, '').replace(/\s+/g, ' ').trim();
    if (expNoNum && actNoNum && expNoNum === actNoNum) {
      return { expected, actual, status: 'Correct', notes: 'Match ignoring embedded dose numbers' };
    }

    // Token subset / alias matching (e.g. brand name with generic in brackets)
    const expWords = expNorm.split(' ').filter((w) => w.length >= 2);
    const actWords = actNorm.split(' ').filter((w) => w.length >= 2);

    // If one is fully contained in the other
    if (
      (actNorm.length >= 3 && expNorm.includes(actNorm)) ||
      (expNorm.length >= 3 && actNorm.includes(expNorm))
    ) {
      return { expected, actual, status: 'Correct', notes: 'Substring / brand alias match' };
    }

    // Check if key brand words match
    const commonWords = expWords.filter((w) => actWords.includes(w));
    if (commonWords.length > 0) {
      // If primary first word matches (e.g. "Augmentin" in "Augmentin 625" vs "Augmentin")
      if (expWords[0] === actWords[0] || commonWords.length >= Math.min(expWords.length, actWords.length)) {
        return { expected, actual, status: 'Correct', notes: 'Core brand name matched' };
      }
      return { expected, actual, status: 'Needs Verification', notes: 'Partial name overlap detected' };
    }

    if (actNorm.includes('unclear') || actNorm.includes('verify')) {
      return { expected, actual, status: 'Needs Verification', notes: 'Flagged as unclear by model' };
    }

    return { expected, actual, status: 'Incorrect', notes: `Expected ${expected}, got ${actual}` };
  }

  /**
   * Calculates similarity score (0 to 100) between two medicine names for matching
   */
  public static getMedicineNameScore(expected: string, actual: string): number {
    if (isBlankOrUnspecified(expected) || isBlankOrUnspecified(actual)) return 0;
    const expNorm = this.normalizeMedicineName(expected);
    const actNorm = this.normalizeMedicineName(actual);

    if (expNorm === actNorm) return 100;

    const expNoNum = expNorm.replace(/\b\d+(?:mg|mcg|ml|g|tab)?\b/g, '').replace(/\s+/g, ' ').trim();
    const actNoNum = actNorm.replace(/\b\d+(?:mg|mcg|ml|g|tab)?\b/g, '').replace(/\s+/g, ' ').trim();
    if (expNoNum && actNoNum && expNoNum === actNoNum) return 98;

    if (expNorm.includes(actNorm) || actNorm.includes(expNorm)) return 90;

    const expWords = expNorm.split(' ').filter((w) => w.length >= 2);
    const actWords = actNorm.split(' ').filter((w) => w.length >= 2);
    const common = expWords.filter((w) => actWords.includes(w));

    if (expWords.length > 0 && actWords.length > 0 && expWords[0] === actWords[0]) {
      return 85;
    }

    if (common.length > 0) {
      const ratio = (common.length * 2) / (expWords.length + actWords.length);
      return Math.round(ratio * 80);
    }

    return 0;
  }

  /**
   * Normalizes and compares dose/strength:
   * 40mg == 40 mg
   * If ground truth is blank/unspecified/— -> 'Not Evaluated'
   */
  public static compareDose(expected: string | undefined, actual: string | undefined): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth dose is unspecified / blank',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected: expected!,
        actual: actual || '(Missing)',
        status: 'Missing',
        notes: 'Dose not found in AI extraction',
      };
    }

    const expNorm = this.normalizeDose(expected);
    const actNorm = this.normalizeDose(actual);

    // Exact normalized dose match (40mg == 40 mg)
    if (expNorm === actNorm) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Dose normalized match' };
    }

    // Number matching (e.g. 100/325 mg == 100/325mg or 40 in 40mg)
    const expNums = expNorm.match(/\d+(?:\.\d+)?/g) || [];
    const actNums = actNorm.match(/\d+(?:\.\d+)?/g) || [];
    if (expNums.length > 0 && actNums.length > 0 && expNums.join('/') === actNums.join('/')) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Numeric strength match' };
    }

    if (expNorm && actNorm && (actNorm.includes(expNorm) || expNorm.includes(actNorm))) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Dose string containment match' };
    }

    // If numbers clearly conflict (e.g. 40mg vs 20mg)
    if (expNums.length > 0 && actNums.length > 0 && expNums[0] !== actNums[0]) {
      return {
        expected: expected!,
        actual: actual!,
        status: 'Incorrect',
        notes: `Dose mismatch: expected ${expected}, got ${actual}`,
      };
    }

    return {
      expected: expected!,
      actual: actual!,
      status: 'Needs Verification',
      notes: `Dose requires verification (${expected} vs ${actual})`,
    };
  }

  /**
   * Normalizes and compares dosing frequency:
   * Maps 1-0-1, BD, BID, Twice daily consistently.
   * If ground truth is blank/unspecified/— -> 'Not Evaluated'
   */
  public static compareFrequency(expected: string | undefined, actual: string | undefined): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth frequency not specified',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected: expected!,
        actual: actual || '(Missing)',
        status: 'Missing',
        notes: 'Frequency missing in AI output',
      };
    }

    const mapFreq = (f: string) => {
      const s = f.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (s.includes('101') || s.includes('bd') || s.includes('twice') || s.includes('bid') || s.includes('2times'))
        return 'twice_daily';
      if (s.includes('111') || s.includes('tds') || s.includes('thrice') || s.includes('tid') || s.includes('three') || s.includes('3times'))
        return 'thrice_daily';
      if (s.includes('100') || s.includes('010') || s.includes('od') || s.includes('once') || s.includes('daily') || s.includes('qd') || s.includes('1time'))
        return 'once_daily';
      if (s.includes('001') || s.includes('hs') || s.includes('qhs') || s.includes('bed') || s.includes('night'))
        return 'bedtime';
      if (s.includes('sos') || s.includes('prn') || s.includes('needed') || s.includes('require'))
        return 'as_needed';
      if (s.includes('1111') || s.includes('qid') || s.includes('four') || s.includes('4times'))
        return 'four_times_daily';
      return s;
    };

    const expM = mapFreq(expected!);
    const actM = mapFreq(actual!);

    if (expM === actM || actM.includes(expM) || expM.includes(actM)) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Frequency matched' };
    }

    return {
      expected: expected!,
      actual: actual!,
      status: 'Incorrect',
      notes: `Expected ${expected}, got ${actual}`,
    };
  }

  /**
   * Compares timing (food relations, time of day):
   * Maps after food, PC, post meals consistently.
   * If ground truth is blank/unspecified/— -> 'Not Evaluated'
   */
  public static compareTiming(expected: string | undefined, actual: string | undefined): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth timing not specified',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected: expected!,
        actual: actual || '(Missing)',
        status: 'Missing',
        notes: 'Timing missing in AI output',
      };
    }

    const mapTiming = (t: string) => {
      const s = t.toLowerCase();
      if (
        s.includes('after') ||
        s.includes('pc') ||
        s.includes('post') ||
        s.includes('with food') ||
        s.includes('with meals')
      )
        return 'after_food';
      if (
        s.includes('before') ||
        s.includes('ac') ||
        s.includes('empty') ||
        s.includes('prior')
      )
        return 'before_food';
      if (s.includes('morning') || s.includes('breakfast') || s.includes('am')) return 'morning';
      if (s.includes('afternoon') || s.includes('lunch') || s.includes('noon')) return 'afternoon';
      if (s.includes('night') || s.includes('bedtime') || s.includes('evening') || s.includes('dinner') || s.includes('hs'))
        return 'night';
      return s.replace(/[^a-z0-9]/g, '');
    };

    const expT = mapTiming(expected!);
    const actT = mapTiming(actual!);

    if (expT === actT || actT.includes(expT) || expT.includes(actT)) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Timing matched' };
    }

    return {
      expected: expected!,
      actual: actual!,
      status: 'Incorrect',
      notes: `Expected ${expected}, got ${actual}`,
    };
  }

  /**
   * Compares duration:
   * If ground truth is blank/unspecified/— -> 'Not Evaluated'
   */
  public static compareDuration(expected: string | undefined, actual: string | undefined): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth duration not specified',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected: expected!,
        actual: actual || '(Missing)',
        status: 'Missing',
        notes: 'Duration missing in AI output',
      };
    }

    const expNum = (expected || '').match(/\d+/g)?.join('') || '';
    const actNum = (actual || '').match(/\d+/g)?.join('') || '';

    if (expNum && actNum && expNum === actNum) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Duration count matched' };
    }

    const expNorm = (expected || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const actNorm = (actual || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (expNorm === actNorm || actNorm.includes(expNorm) || expNorm.includes(actNorm)) {
      return { expected: expected!, actual: actual!, status: 'Correct', notes: 'Duration matched' };
    }

    return {
      expected: expected!,
      actual: actual!,
      status: 'Needs Verification',
      notes: `Expected ${expected}, got ${actual}`,
    };
  }

  /**
   * Compares instructions:
   * If ground truth is blank/unspecified -> 'Not Evaluated'
   */
  public static compareInstructions(expected: string | undefined, actual: string | undefined): FieldComparison {
    if (isBlankOrUnspecified(expected)) {
      return {
        expected: expected || '—',
        actual: actual || '—',
        status: 'Not Evaluated',
        notes: 'Ground truth instructions not specified',
      };
    }

    if (isBlankOrUnspecified(actual)) {
      return {
        expected: expected!,
        actual: '—',
        status: 'Not Evaluated',
        notes: 'Optional instructions omitted',
      };
    }

    return {
      expected: expected!,
      actual: actual!,
      status: 'Correct',
      notes: 'Instructions recorded',
    };
  }

  /**
   * Performs full actual vs expected comparison for a test case with independent medicine matching,
   * case-insensitivity, dose normalization, error detection, and comparison debug section generation.
   */
  public static evaluatePrescription(
    expectedMedicines: ExpectedMedicine[],
    aiMedicines: {
      name: string;
      dose: string;
      frequency: string;
      timing: string;
      duration: string;
      instructions: string;
    }[]
  ): PrescriptionEvaluationResult {
    const comparisons: MedicineComparison[] = [];
    const detectedErrors: Set<CommonErrorType> = new Set();

    // -------------------------------------------------------------
    // CASE A: No Ground Truth has been entered yet for this prescription
    // -------------------------------------------------------------
    if (!expectedMedicines || expectedMedicines.length === 0) {
      if (aiMedicines && aiMedicines.length > 0) {
        // State: NOT_EVALUATED
        // Display: Ground Truth Required. Do not calculate this test in accuracy metrics.
        aiMedicines.forEach((ai, idx) => {
          const normAi = this.normalizeMedicineName(ai.name);
          const normDose = this.normalizeDose(ai.dose);
          comparisons.push({
            expectedName: '—',
            actualName: ai.name,
            medicineName: {
              expected: '— (Ground Truth Required)',
              actual: ai.name,
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            dose: {
              expected: '—',
              actual: ai.dose || '—',
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            frequency: {
              expected: '—',
              actual: ai.frequency || '—',
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            timing: {
              expected: '—',
              actual: ai.timing || '—',
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            duration: {
              expected: '—',
              actual: ai.duration || '—',
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            instructions: {
              expected: '—',
              actual: ai.instructions || '—',
              status: 'Not Evaluated',
              notes: 'Ground truth benchmark has not yet been entered',
            },
            overallMedicineStatus: 'Not Evaluated',
            debugInfo: {
              groundTruthMedicine: '(Ground Truth Not Entered)',
              aiExtractedMedicine: `${ai.name} ${ai.dose || ''}`.trim(),
              normalizedGroundTruth: '—',
              normalizedAiResult: `${normAi} ${normDose}`.trim(),
              matchResult: 'Awaiting Ground Truth',
              passFailReason: `AI extracted medicine (${idx + 1}/${aiMedicines.length}); enter ground truth benchmark to run automated evaluation.`,
            },
          });
        });

        return {
          comparisons,
          accuracy: undefined, // Do not calculate in accuracy metrics
          detectedErrors: [],
          suggestedStatus: 'AI Extracted Pending Review',
          suggestedReviewStatus: 'Pending Review',
          evaluationState: 'NOT_EVALUATED',
          statusReason: 'AI Extracted Pending Review: Ground truth benchmark has not yet been entered.',
        };
      }

      // No expected medicines and explicitly 0 AI medicines -> NO_MEDICINE_DETECTED
      return {
        comparisons: [],
        accuracy: undefined, // Do not calculate in accuracy metrics
        detectedErrors: ['Needs manual verification'],
        suggestedStatus: 'No Medicine Detected',
        suggestedReviewStatus: 'Pending Review',
        evaluationState: 'NO_MEDICINE_DETECTED',
        statusReason:
          'No medicine could be reliably extracted from this prescription. Manual verification is required.',
      };
    }

    // -------------------------------------------------------------
    // CASE B: Ground Truth medicines exist -> Run Independent Bipartite Matching
    // -------------------------------------------------------------

    // Build bipartite scoring matrix between each expected medicine and AI medicine
    // Score considers normalized name similarity + dose agreement
    interface CandidatePair {
      expIdx: number;
      aiIdx: number;
      score: number;
      nameComp: FieldComparison;
      doseComp: FieldComparison;
    }

    const candidatePairs: CandidatePair[] = [];

    expectedMedicines.forEach((exp, expIdx) => {
      aiMedicines.forEach((ai, aiIdx) => {
        const nameScore = TestingEngine.getMedicineNameScore(exp.name, ai.name);
        const nameComp = TestingEngine.compareMedicineName(exp.name, ai.name);
        const doseComp = TestingEngine.compareDose(exp.dose, ai.dose);

        let pairScore = nameScore;
        if (doseComp.status === 'Correct') pairScore += 20;
        else if (doseComp.status === 'Not Evaluated') pairScore += 10;
        else if (doseComp.status === 'Incorrect') pairScore -= 10;

        candidatePairs.push({
          expIdx,
          aiIdx,
          score: pairScore,
          nameComp,
          doseComp,
        });
      });
    });

    // Sort candidate pairs descending by score
    candidatePairs.sort((a, b) => b.score - a.score);

    const matchedExpIndices = new Set<number>();
    const matchedAiIndices = new Set<number>();
    const expToAiMatch = new Map<number, number>();

    for (const pair of candidatePairs) {
      if (matchedExpIndices.has(pair.expIdx) || matchedAiIndices.has(pair.aiIdx)) {
        continue;
      }
      // Require minimal name correlation (score >= 40) to declare a match
      if (pair.score >= 40 || pair.nameComp.status === 'Correct' || pair.nameComp.status === 'Needs Verification') {
        matchedExpIndices.add(pair.expIdx);
        matchedAiIndices.add(pair.aiIdx);
        expToAiMatch.set(pair.expIdx, pair.aiIdx);
      }
    }

    // Process all Expected Medicines
    expectedMedicines.forEach((exp, expIdx) => {
      const aiIdx = expToAiMatch.get(expIdx);
      const expNorm = TestingEngine.normalizeMedicineName(exp.name);
      const expDoseNorm = TestingEngine.normalizeDose(exp.dose);

      if (aiIdx !== undefined) {
        // MATCHED PAIR
        const matchedAi = aiMedicines[aiIdx];
        const actNorm = TestingEngine.normalizeMedicineName(matchedAi.name);
        const actDoseNorm = TestingEngine.normalizeDose(matchedAi.dose);

        const nameComp = TestingEngine.compareMedicineName(exp.name, matchedAi.name);
        const doseComp = TestingEngine.compareDose(exp.dose, matchedAi.dose);
        const freqComp = TestingEngine.compareFrequency(exp.frequency, matchedAi.frequency);
        const timingComp = TestingEngine.compareTiming(exp.timing, matchedAi.timing);
        const durComp = TestingEngine.compareDuration(exp.duration, matchedAi.duration);
        const instComp = TestingEngine.compareInstructions(exp.instructions, matchedAi.instructions);

        // Detect specific errors
        if (nameComp.status === 'Incorrect') detectedErrors.add('Medicine name incorrectly detected');
        if (doseComp.status === 'Incorrect') detectedErrors.add('Dose incorrectly detected');
        if (freqComp.status === 'Missing') detectedErrors.add('Frequency missing');
        if (freqComp.status === 'Incorrect') detectedErrors.add('Incorrect frequency');
        if (timingComp.status === 'Missing') detectedErrors.add('Timing missing');
        if (timingComp.status === 'Incorrect') detectedErrors.add('Incorrect timing');

        // Overall status for this medicine
        let overallMedStatus: FieldComparisonStatus = 'Correct';
        if (nameComp.status === 'Incorrect') {
          overallMedStatus = 'Incorrect';
        } else if (doseComp.status === 'Incorrect') {
          overallMedStatus = 'Incorrect';
        } else if (nameComp.status === 'Needs Verification' || doseComp.status === 'Needs Verification') {
          overallMedStatus = 'Needs Verification';
        } else if (freqComp.status === 'Incorrect' || timingComp.status === 'Incorrect') {
          // Do not fail the whole medicine if optional secondary fields differ
          overallMedStatus = 'Correct';
        }

        // Determine Match Result Label for Debug
        let matchResult = 'Exact Match';
        if (exp.name.trim().toLowerCase() === matchedAi.name.trim().toLowerCase()) {
          matchResult = 'Exact Match';
        } else if (expNorm === actNorm) {
          matchResult = 'Case-Insensitive Match (BETACAP TR = Betacap TR)';
        } else if (nameComp.status === 'Correct') {
          matchResult = 'Normalized Brand / Alias Match';
        } else if (nameComp.status === 'Needs Verification') {
          matchResult = 'Partial Name Match';
        } else {
          matchResult = 'Discrepancy in Name';
        }

        // Generate Human-Readable Reason for Pass/Fail Debug
        let passFailReason = '';
        if (nameComp.status === 'Correct' && (doseComp.status === 'Correct' || doseComp.status === 'Not Evaluated')) {
          passFailReason = `Pass: Medicine name matched normalized ground truth ('${expNorm}' == '${actNorm}')`;
          if (doseComp.status === 'Correct') {
            passFailReason += ` and dose matched ('${expDoseNorm}' == '${actDoseNorm}').`;
          } else {
            passFailReason += `; ground truth dose was unspecified (marked Not Evaluated).`;
          }
        } else if (nameComp.status === 'Incorrect') {
          passFailReason = `Fail: Medicine name mismatch (expected '${exp.name}', AI extracted '${matchedAi.name}').`;
        } else if (doseComp.status === 'Incorrect') {
          passFailReason = `Fail: Dose mismatch (expected '${exp.dose}', AI extracted '${matchedAi.dose}').`;
        } else {
          passFailReason = `Review: Partial match requiring manual verification.`;
        }

        const debugInfo: ComparisonDebugInfo = {
          groundTruthMedicine: `${exp.name} ${exp.dose || ''}`.trim(),
          aiExtractedMedicine: `${matchedAi.name} ${matchedAi.dose || ''}`.trim(),
          normalizedGroundTruth: `${expNorm} | ${expDoseNorm || 'unspecified'}`,
          normalizedAiResult: `${actNorm} | ${actDoseNorm || 'unspecified'}`,
          matchResult,
          passFailReason,
        };

        comparisons.push({
          expectedId: exp.id,
          expectedName: exp.name,
          actualName: matchedAi.name,
          medicineName: nameComp,
          dose: doseComp,
          frequency: freqComp,
          timing: timingComp,
          duration: durComp,
          instructions: instComp,
          overallMedicineStatus: overallMedStatus,
          debugInfo,
        });
      } else {
        // UNMATCHED EXPECTED MEDICINE -> MISSING MEDICINE
        detectedErrors.add('Missing medicines');

        const debugInfo: ComparisonDebugInfo = {
          groundTruthMedicine: `${exp.name} ${exp.dose || ''}`.trim(),
          aiExtractedMedicine: '(None - Missed by AI)',
          normalizedGroundTruth: `${expNorm} | ${expDoseNorm || 'unspecified'}`,
          normalizedAiResult: '(None)',
          matchResult: 'Missing Medicine',
          passFailReason: `Fail: Expected medicine '${exp.name}' was not detected in the AI extraction output.`,
        };

        comparisons.push({
          expectedId: exp.id,
          expectedName: exp.name,
          actualName: '(Missing)',
          medicineName: {
            expected: exp.name,
            actual: '(Missing)',
            status: 'Missing',
            notes: 'Medicine missed by AI',
          },
          dose: {
            expected: exp.dose || '—',
            actual: '(Missing)',
            status: isBlankOrUnspecified(exp.dose) ? 'Not Evaluated' : 'Missing',
          },
          frequency: {
            expected: exp.frequency || '—',
            actual: '(Missing)',
            status: isBlankOrUnspecified(exp.frequency) ? 'Not Evaluated' : 'Missing',
          },
          timing: {
            expected: exp.timing || '—',
            actual: '(Missing)',
            status: isBlankOrUnspecified(exp.timing) ? 'Not Evaluated' : 'Missing',
          },
          duration: {
            expected: exp.duration || '—',
            actual: '(Missing)',
            status: isBlankOrUnspecified(exp.duration) ? 'Not Evaluated' : 'Missing',
          },
          instructions: {
            expected: exp.instructions || '—',
            actual: '(Missing)',
            status: isBlankOrUnspecified(exp.instructions) ? 'Not Evaluated' : 'Missing',
          },
          overallMedicineStatus: 'Missing',
          debugInfo,
        });
      }
    });

    // Process any EXTRA AI Medicines (unmatched AI medicines)
    aiMedicines.forEach((ai, aiIdx) => {
      if (!matchedAiIndices.has(aiIdx)) {
        detectedErrors.add('Extra medicines');
        const actNorm = TestingEngine.normalizeMedicineName(ai.name);
        const actDoseNorm = TestingEngine.normalizeDose(ai.dose);

        const debugInfo: ComparisonDebugInfo = {
          groundTruthMedicine: '(None - Extra Medicine)',
          aiExtractedMedicine: `${ai.name} ${ai.dose || ''}`.trim(),
          normalizedGroundTruth: '(None)',
          normalizedAiResult: `${actNorm} | ${actDoseNorm || 'unspecified'}`,
          matchResult: 'Extra Medicine Detected',
          passFailReason: `Notice: AI extracted additional medicine '${ai.name}' not found in the ground truth benchmark list.`,
        };

        comparisons.push({
          expectedName: '(None - Extra Medicine)',
          actualName: ai.name,
          medicineName: {
            expected: '(None)',
            actual: ai.name,
            status: 'Not Evaluated',
            notes: 'Extra medicine detected by AI',
          },
          dose: {
            expected: '—',
            actual: ai.dose || '—',
            status: 'Not Evaluated',
          },
          frequency: {
            expected: '—',
            actual: ai.frequency || '—',
            status: 'Not Evaluated',
          },
          timing: {
            expected: '—',
            actual: ai.timing || '—',
            status: 'Not Evaluated',
          },
          duration: {
            expected: '—',
            actual: ai.duration || '—',
            status: 'Not Evaluated',
          },
          instructions: {
            expected: '—',
            actual: ai.instructions || '—',
            status: 'Not Evaluated',
          },
          overallMedicineStatus: 'Needs Verification',
          debugInfo,
        });
      }
    });

    // -------------------------------------------------------------
    // ACCURACY CALCULATION
    // - Evaluates only ground truth medicines
    // - Fields marked 'Not Evaluated' do NOT reduce accuracy
    // -------------------------------------------------------------
    const groundTruthComparisons = comparisons.filter(
      (c) => c.expectedName !== '(None - Extra Medicine)'
    );
    const totalExpectedCount = expectedMedicines.length;

    // Medicine Name Accuracy
    const correctNamesCount = groundTruthComparisons.filter(
      (c) => c.medicineName.status === 'Correct'
    ).length;
    const medicineNameAccuracy = Math.round((correctNamesCount / totalExpectedCount) * 100);

    // Dose Accuracy: only evaluate where expected dose was specified
    const evaluableDoses = expectedMedicines.filter((m) => !isBlankOrUnspecified(m.dose));
    const correctDosesCount = groundTruthComparisons.filter(
      (c) => !isBlankOrUnspecified(c.dose.expected) && c.dose.status === 'Correct'
    ).length;
    const doseAccuracy =
      evaluableDoses.length > 0
        ? Math.round((correctDosesCount / evaluableDoses.length) * 100)
        : 100;

    // Frequency Accuracy: only evaluate where expected frequency was specified
    const evaluableFreqs = expectedMedicines.filter((m) => !isBlankOrUnspecified(m.frequency));
    const correctFreqsCount = groundTruthComparisons.filter(
      (c) => !isBlankOrUnspecified(c.frequency.expected) && c.frequency.status === 'Correct'
    ).length;
    const frequencyAccuracy =
      evaluableFreqs.length > 0
        ? Math.round((correctFreqsCount / evaluableFreqs.length) * 100)
        : 100;

    // Timing Accuracy: only evaluate where expected timing was specified
    const evaluableTimings = expectedMedicines.filter((m) => !isBlankOrUnspecified(m.timing));
    const correctTimingsCount = groundTruthComparisons.filter(
      (c) => !isBlankOrUnspecified(c.timing.expected) && c.timing.status === 'Correct'
    ).length;
    const timingAccuracy =
      evaluableTimings.length > 0
        ? Math.round((correctTimingsCount / evaluableTimings.length) * 100)
        : 100;

    // Overall Accuracy: dynamically re-weighted based on evaluable ground truth fields (Step 10)
    let totalWeight = 0;
    let weightedSum = 0;

    // Medicine Name: 40% (always evaluable when ground truth exists)
    const nameWeight = 0.40;
    totalWeight += nameWeight;
    weightedSum += medicineNameAccuracy * nameWeight;

    // Dose: 25% (if evaluable)
    if (evaluableDoses.length > 0) {
      const doseWeight = 0.25;
      totalWeight += doseWeight;
      weightedSum += doseAccuracy * doseWeight;
    }

    // Frequency: 20% (if evaluable)
    if (evaluableFreqs.length > 0) {
      const freqWeight = 0.20;
      totalWeight += freqWeight;
      weightedSum += frequencyAccuracy * freqWeight;
    }

    // Timing: 15% (if evaluable)
    if (evaluableTimings.length > 0) {
      const timingWeight = 0.15;
      totalWeight += timingWeight;
      weightedSum += timingAccuracy * timingWeight;
    }

    let overallAccuracy =
      totalWeight > 0 ? Math.round(weightedSum / totalWeight) : medicineNameAccuracy;

    // -------------------------------------------------------------
    // STATUS DETERMINATION (Step 11)
    // -------------------------------------------------------------
    const fieldMismatches = groundTruthComparisons.filter(
      (c) =>
        c.medicineName.status === 'Incorrect' ||
        c.medicineName.status === 'Missing' ||
        c.dose.status === 'Incorrect' ||
        c.dose.status === 'Missing' ||
        c.frequency.status === 'Incorrect' ||
        c.timing.status === 'Incorrect'
    ).length;

    const hasMissingMeds = detectedErrors.has('Missing medicines');
    const hasNameError = detectedErrors.has('Medicine name incorrectly detected');
    const isUnreadable = detectedErrors.has('Handwriting unreadable');

    let suggestedStatus: TestStatus = 'Passed';
    let suggestedReviewStatus: ReviewStatus = 'Passed';
    let evaluationState: EvaluationState = 'EVALUATED';
    let statusReason = '';

    if (isUnreadable) {
      suggestedStatus = 'Needs Verification';
      suggestedReviewStatus = 'Needs Verification';
      evaluationState = 'NEEDS_VERIFICATION';
      statusReason = 'Needs Verification: Handwriting unreadable or ambiguous in prescription image.';
    } else if (fieldMismatches === 0 && medicineNameAccuracy === 100) {
      // All evaluated fields matched perfectly
      overallAccuracy = 100;
      suggestedStatus = 'Passed';
      suggestedReviewStatus = 'Passed';
      evaluationState = 'EVALUATED';
      statusReason = 'Passed: All evaluated prescription fields matched ground truth benchmark criteria (100% accuracy).';
    } else if (
      overallAccuracy >= 80 &&
      medicineNameAccuracy === 100 &&
      !hasMissingMeds &&
      !hasNameError &&
      (evaluableDoses.length === 0 || doseAccuracy >= 80)
    ) {
      suggestedStatus = 'Passed';
      suggestedReviewStatus = 'Passed';
      evaluationState = 'EVALUATED';
      statusReason = `Passed: Core medicines and dosages matched normalized ground truth (${overallAccuracy}% overall accuracy).`;
    } else if (overallAccuracy >= 50 && medicineNameAccuracy >= 50 && !hasMissingMeds) {
      suggestedStatus = 'Partially Correct';
      suggestedReviewStatus = 'Partially Correct';
      evaluationState = 'EVALUATED';
      statusReason = `Partially Correct: Core medicines recognized with minor dosage, frequency, or timing discrepancies (${overallAccuracy}% overall accuracy).`;
    } else {
      suggestedStatus = 'Failed';
      suggestedReviewStatus = 'Failed';
      evaluationState = 'EVALUATED';
      statusReason = `Failed: Significant discrepancy in medicine detection or field comparison (${overallAccuracy}% overall accuracy).`;
    }

    return {
      comparisons,
      accuracy: {
        medicineNameAccuracy,
        doseAccuracy,
        frequencyAccuracy,
        timingAccuracy,
        overallAccuracy,
      },
      detectedErrors: Array.from(detectedErrors),
      suggestedStatus,
      suggestedReviewStatus,
      evaluationState,
      statusReason,
    };
  }

  /**
   * STEP 12: Status/Score Consistency Validator
   * Enforces mathematical and logical invariants before test cases are saved or displayed.
   */
  public static validateConsistency(testCase: EvaluationTestCase): void {
    const hasGroundTruth =
      Array.isArray(testCase.expectedMedicines) &&
      testCase.expectedMedicines.length > 0 &&
      !testCase.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'));

    if (!hasGroundTruth) {
      // Independent ground truth benchmark DOES NOT exist.
      // Strictly null out/remove numerical accuracy percentages (Step 5 & Assertion 6)
      testCase.accuracy = undefined;

      // Ensure status is valid non-benchmark terminal status
      if (
        testCase.status === 'Passed' ||
        testCase.status === 'Passed – Benchmark Verified' ||
        testCase.status === 'Partially Correct' ||
        testCase.status === 'Partially Correct – Benchmark Verified' ||
        testCase.status === 'Failed' ||
        testCase.status === 'Failed – Benchmark Verified' ||
        testCase.status === 'AI Extracted Pending Review' ||
        testCase.status === 'Ground Truth Required'
      ) {
        if (!testCase.aiExtractedMedicines || testCase.aiExtractedMedicines.length === 0) {
          testCase.status = 'No Medicine Detected';
          testCase.evaluationState = 'NO_MEDICINE_DETECTED';
          testCase.reviewStatus = 'Confirmed No Medicine';
        } else {
          testCase.status = 'Needs Verification';
          testCase.evaluationState = 'NEEDS_VERIFICATION';
          testCase.reviewStatus = 'Pending Review';
        }
      }
      return;
    }

    // Benchmark ground truth DOES exist
    if (!testCase.accuracy) return;

    const comps = testCase.comparisons || [];
    const gtComps = comps.filter((c) => c.expectedName !== '(None - Extra Medicine)');

    const mismatches = gtComps.filter(
      (c) =>
        c.medicineName.status === 'Incorrect' ||
        c.medicineName.status === 'Missing' ||
        c.dose.status === 'Incorrect' ||
        c.dose.status === 'Missing' ||
        c.frequency.status === 'Incorrect' ||
        c.timing.status === 'Incorrect'
    );

    const hasMismatches = mismatches.length > 0;
    const allFieldsCorrect =
      !hasMismatches &&
      gtComps.length > 0 &&
      gtComps.every((c) => c.medicineName.status === 'Correct');

    // ASSERTION 3: No case with 100% overall accuracy may contain a mismatch.
    if (testCase.accuracy.overallAccuracy === 100 && hasMismatches) {
      testCase.accuracy.overallAccuracy = Math.min(
        95,
        Math.max(0, 100 - mismatches.length * 20)
      );
    }

    // ASSERTION 4 & 5: No Failed or Partially Correct case may have all evaluated fields correct.
    if (allFieldsCorrect) {
      if (
        testCase.status === 'Failed' ||
        testCase.status === 'Failed – Benchmark Verified' ||
        testCase.status === 'Partially Correct' ||
        testCase.status === 'Partially Correct – Benchmark Verified'
      ) {
        testCase.status = 'Passed';
        testCase.reviewStatus = 'Passed';
        testCase.evaluationState = 'EVALUATED';
        testCase.accuracy.overallAccuracy = 100;
        testCase.accuracy.medicineNameAccuracy = 100;
        testCase.statusReason =
          'Passed: All evaluated prescription fields matched ground truth benchmark criteria (100% accuracy).';
      }
    }

    // Passed status requires >= 75% accuracy
    if (
      (testCase.status === 'Passed' || testCase.status === 'Passed – Benchmark Verified') &&
      testCase.accuracy.overallAccuracy < 75
    ) {
      testCase.status =
        testCase.accuracy.overallAccuracy >= 50 ? 'Partially Correct' : 'Failed';
      testCase.reviewStatus = testCase.status;
    }
  }

  /**
   * Aggregates dashboard metrics across all test cases
   */
  public static calculateDashboardMetrics(testCases: EvaluationTestCase[]): TestingDashboardMetrics {
    const totalTestCases = testCases.length;

    let passedBenchmarkVerified = 0;
    let partiallyCorrectBenchmarkVerified = 0;
    let failedBenchmarkVerified = 0;
    let passedAiVerified = 0;
    let needsVerification = 0;
    let noMedicineDetected = 0;
    let extractionError = 0;
    let stillProcessing = 0;

    for (const tc of testCases) {
      if (tc.status === 'Pending' || tc.status === 'Processing') {
        stillProcessing++;
        continue;
      }
      if (tc.status === 'API Error' || tc.status === 'Extraction Error') {
        extractionError++;
        continue;
      }
      if (tc.status === 'No Medicine Detected') {
        noMedicineDetected++;
        continue;
      }

      const hasGroundTruth =
        Array.isArray(tc.expectedMedicines) &&
        tc.expectedMedicines.length > 0 &&
        !tc.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_'));

      if (hasGroundTruth) {
        if (
          tc.status === 'Passed' ||
          tc.status === 'Passed – Benchmark Verified' ||
          tc.reviewStatus === 'Confirmed Correct'
        ) {
          passedBenchmarkVerified++;
        } else if (
          tc.status === 'Partially Correct' ||
          tc.status === 'Partially Correct – Benchmark Verified'
        ) {
          partiallyCorrectBenchmarkVerified++;
        } else if (
          tc.status === 'Failed' ||
          tc.status === 'Failed – Benchmark Verified' ||
          tc.reviewStatus === 'Confirmed Incorrect'
        ) {
          failedBenchmarkVerified++;
        } else {
          needsVerification++;
        }
      } else {
        // Without independent ground truth, cases cannot be passed/failed benchmark
        if (tc.status === 'Passed – AI Verified') {
          passedAiVerified++;
        } else {
          needsVerification++;
        }
      }
    }

    const processingComplete = totalTestCases - stillProcessing;

    // Official Benchmark cases: strictly valid independent ground truth
    const benchmarkCases = testCases.filter((tc) =>
      Array.isArray(tc.expectedMedicines) &&
      tc.expectedMedicines.length > 0 &&
      !tc.expectedMedicines.some((m) => m.id && m.id.startsWith('gt_bench_')) &&
      tc.accuracy !== undefined &&
      tc.status !== 'Pending' &&
      tc.status !== 'Processing' &&
      tc.status !== 'Extraction Error' &&
      tc.status !== 'API Error'
    );

    const sumBenchAcc = benchmarkCases.reduce((acc, tc) => acc + (tc.accuracy?.overallAccuracy || 0), 0);
    const officialBenchmarkAccuracyPercentage =
      benchmarkCases.length > 0 ? Math.round(sumBenchAcc / benchmarkCases.length) : 0;

    const benchmarkPassedCount = passedBenchmarkVerified;
    const benchmarkPartiallyCorrectCount = partiallyCorrectBenchmarkVerified;
    const benchmarkFailedCount = failedBenchmarkVerified;
    const benchmarkEvaluatedCases = benchmarkCases.length;

    // AI Verified results: automated verification pass
    const aiVerifiedPassedCount = passedAiVerified;
    const automaticallyVerifiedCases = Math.max(0, totalTestCases - benchmarkEvaluatedCases - stillProcessing - extractionError);
    const needsHumanVerificationCount = needsVerification;

    // Processing times
    const processedCases = testCases.filter((tc) => tc.processingTimes && tc.processingTimes.totalSec > 0);
    const totalProcessingTime = processedCases.reduce(
      (acc, tc) => acc + (tc.processingTimes?.totalSec || 0),
      0
    );
    const averageProcessingTimeSec =
      processedCases.length > 0
        ? Number((totalProcessingTime / processedCases.length).toFixed(1))
        : 0;

    const allTimes = processedCases.map((tc) => tc.processingTimes?.totalSec || 0);
    const fastestProcessingTimeSec = allTimes.length > 0 ? Number(Math.min(...allTimes).toFixed(1)) : 0;
    const slowestProcessingTimeSec = allTimes.length > 0 ? Number(Math.max(...allTimes).toFixed(1)) : 0;

    // Field-level benchmarks across benchmark evaluated cases
    const sumMedAcc = benchmarkCases.reduce((acc, tc) => acc + (tc.accuracy?.medicineNameAccuracy || 0), 0);
    const sumDoseAcc = benchmarkCases.reduce((acc, tc) => acc + (tc.accuracy?.doseAccuracy || 0), 0);
    const sumFreqAcc = benchmarkCases.reduce((acc, tc) => acc + (tc.accuracy?.frequencyAccuracy || 0), 0);
    const sumTimingAcc = benchmarkCases.reduce((acc, tc) => acc + (tc.accuracy?.timingAccuracy || 0), 0);

    const fieldAccuracy = {
      medicineNameAccuracy: benchmarkCases.length > 0 ? Math.round(sumMedAcc / benchmarkCases.length) : 0,
      doseAccuracy: benchmarkCases.length > 0 ? Math.round(sumDoseAcc / benchmarkCases.length) : 0,
      frequencyAccuracy: benchmarkCases.length > 0 ? Math.round(sumFreqAcc / benchmarkCases.length) : 0,
      timingAccuracy: benchmarkCases.length > 0 ? Math.round(sumTimingAcc / benchmarkCases.length) : 0,
      overallAccuracy: officialBenchmarkAccuracyPercentage,
    };

    // Category accuracy breakdown across evaluated cases (Assertion 8)
    const categories: DifficultyCategory[] = [
      'Clear Printed',
      'Clear Handwritten',
      'Medium Handwritten',
      'Difficult Handwritten',
      'Low Quality / Blurry',
      'Mixed Prescription',
    ];

    const categoryAccuracy: Record<DifficultyCategory, { total: number; completed: number; accuracy: number }> =
      {} as any;

    categories.forEach((cat) => {
      const catCases = testCases.filter((tc) => tc.difficultyCategory === cat);
      const catEvaluated = catCases.filter((tc) => benchmarkCases.includes(tc));
      const catAccSum = catEvaluated.reduce((acc, tc) => acc + (tc.accuracy?.overallAccuracy || 0), 0);
      categoryAccuracy[cat] = {
        total: catCases.length,
        completed: catEvaluated.length,
        accuracy: catEvaluated.length > 0 ? Math.round(catAccSum / catEvaluated.length) : 0,
      };
    });

    // Error aggregation generated directly from comparison records (Assertion 9)
    const commonErrorsList: CommonErrorType[] = [
      'Missing medicines',
      'Extra medicines',
      'Medicine name incorrectly detected',
      'Dose incorrectly detected',
      'Frequency missing',
      'Incorrect frequency',
      'Timing missing',
      'Incorrect timing',
      'Duration incorrect',
      'Instructions incorrect',
      'Handwriting unreadable',
      'Image quality issue',
      'Prescription structure issue',
      'API failure',
      'Timeout',
      'Needs manual verification',
    ];

    const commonErrorsCount: Record<CommonErrorType, number> = {} as any;
    commonErrorsList.forEach((err) => {
      commonErrorsCount[err] = 0;
    });

    // Count from actual comparisons in evaluated cases
    for (const tc of benchmarkCases) {
      if (Array.isArray(tc.comparisons)) {
        for (const c of tc.comparisons) {
          if (c.expectedName === '(None - Extra Medicine)') {
            commonErrorsCount['Extra medicines']++;
          } else {
            if (c.medicineName.status === 'Missing') commonErrorsCount['Missing medicines']++;
            else if (c.medicineName.status === 'Incorrect') commonErrorsCount['Medicine name incorrectly detected']++;

            if (c.dose.status === 'Incorrect') commonErrorsCount['Dose incorrectly detected']++;
            if (c.frequency.status === 'Missing') commonErrorsCount['Frequency missing']++;
            if (c.frequency.status === 'Incorrect') commonErrorsCount['Incorrect frequency']++;
            if (c.timing.status === 'Missing') commonErrorsCount['Timing missing']++;
            if (c.timing.status === 'Incorrect') commonErrorsCount['Incorrect timing']++;
          }
        }
      }
    }

    // Add category/status errors across all cases
    commonErrorsCount['Needs manual verification'] = needsVerification;
    commonErrorsCount['Image quality issue'] = testCases.filter((tc) => tc.difficultyCategory === 'Low Quality / Blurry').length;
    commonErrorsCount['API failure'] = extractionError;

    return {
      totalTestCases,
      processingComplete,
      stillProcessing,

      // Complete partitioned counts (Sum = totalTestCases)
      passedBenchmarkVerified,
      partiallyCorrectBenchmarkVerified,
      failedBenchmarkVerified,
      passedAiVerified,
      needsVerification,
      noMedicineDetected,
      extractionError,

      // Official Benchmark Accuracy
      benchmarkEvaluatedCases,
      officialBenchmarkAccuracyPercentage,
      benchmarkPassedCount,
      benchmarkPartiallyCorrectCount,
      benchmarkFailedCount,

      // AI Verified Results
      aiVerifiedPassedCount,
      automaticallyVerifiedCases,
      needsHumanVerificationCount,

      // Compatibility fields
      processedSuccessfully: processingComplete,
      evaluatedWithGroundTruth: benchmarkEvaluatedCases,
      testsPassed: passedBenchmarkVerified + passedAiVerified,
      testsPartiallyCorrect: partiallyCorrectBenchmarkVerified,
      testsFailed: failedBenchmarkVerified,
      testsNeedsVerification: needsVerification,
      testsGroundTruthRequired: stillProcessing,
      testsNoMedicineDetected: noMedicineDetected,
      testsExtractionError: extractionError,
      pendingTests: stillProcessing,
      testsCompleted: processingComplete,
      overallAccuracyPercentage: officialBenchmarkAccuracyPercentage,
      averageProcessingTimeSec,
      fastestProcessingTimeSec,
      slowestProcessingTimeSec,
      fieldAccuracy,
      categoryAccuracy,
      commonErrorsCount,
    };
  }
}
