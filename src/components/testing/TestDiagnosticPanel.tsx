import React from 'react';
import {
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Pill,
  Hash,
  Activity,
  Layers,
  FileCheck,
} from 'lucide-react';
import { EvaluationTestCase } from '../../testingTypes';

interface Props {
  testCase: EvaluationTestCase;
}

export const TestDiagnosticPanel: React.FC<Props> = ({ testCase }) => {
  const isExtractionCompleted =
    testCase.status !== 'Pending' &&
    testCase.status !== 'Processing' &&
    testCase.status !== 'API Error' &&
    testCase.status !== 'Extraction Error';

  const numMedsExtracted = testCase.aiExtractedMedicines?.length ?? 0;
  const isRawAiAvailable = testCase.aiExtractedMedicines !== undefined;
  const hasGroundTruth = (testCase.expectedMedicines?.length ?? 0) > 0;
  const numGroundTruthMeds = testCase.expectedMedicines?.length ?? 0;

  // Evaluation status display
  const evalState = testCase.evaluationState || (
    !hasGroundTruth
      ? (numMedsExtracted > 0 ? 'NOT_EVALUATED' : 'NO_MEDICINE_DETECTED')
      : (testCase.status === 'Needs Verification' ? 'NEEDS_VERIFICATION' : 'EVALUATED')
  );

  const getEvaluationStateBadge = () => {
    switch (evalState) {
      case 'NOT_EVALUATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-100 text-violet-800 border border-violet-200">
            <FileQuestion className="w-3.5 h-3.5 text-violet-600" /> NOT_EVALUATED (AI Extracted Pending Review)
          </span>
        );
      case 'NO_MEDICINE_DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> NO_MEDICINE_DETECTED
          </span>
        );
      case 'NEEDS_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> NEEDS_VERIFICATION
          </span>
        );
      case 'EVALUATED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> EVALUATED ({testCase.status})
          </span>
        );
    }
  };

  const getReasonForStatus = () => {
    if (testCase.statusReason) return testCase.statusReason;

    if (evalState === 'NOT_EVALUATED') {
      return `AI extraction completed successfully (${numMedsExtracted} medicine(s) detected), but ground truth benchmark has not yet been entered for this test. Automated comparison cannot be performed until ground truth is provided.`;
    }
    if (evalState === 'NO_MEDICINE_DETECTED') {
      return `Gemini completed prescription vision analysis successfully but explicitly detected zero medicines in this image. Manual verification is required to confirm whether the image is non-medicinal, illegible, or requires manual medicine entry.`;
    }
    if (evalState === 'NEEDS_VERIFICATION') {
      return `Extraction resulted in ambiguous medicine names or partial matching against ground truth that warrants clinician review before marking as final.`;
    }
    if (testCase.status === 'Passed') {
      return `All expected medicines and dosages matched normalized ground truth criteria.`;
    }
    if (testCase.status === 'Partially Correct') {
      return `Core medicines matched ground truth with minor discrepancies in secondary fields (e.g. dosage, frequency, or timing).`;
    }
    if (testCase.status === 'Failed') {
      return `Significant discrepancy found between AI extraction and ground truth medicines.`;
    }
    if (testCase.status === 'API Error') {
      return testCase.errorDetails || 'API error occurred during extraction.';
    }
    return 'Status reflects current pipeline state.';
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 text-xs font-sans shadow-inner">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="font-semibold text-slate-200 text-xs tracking-wider uppercase">
            Test Case Diagnostics & Status Breakdown
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          ID: {testCase.id}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {/* 1. Test ID */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <Hash className="w-3.5 h-3.5 text-cyan-400" /> Test ID
          </div>
          <div className="font-bold text-slate-100 font-mono text-xs">{testCase.id}</div>
        </div>

        {/* 2. Extraction Status */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Extraction Status
          </div>
          <div className="font-semibold text-slate-100">
            {testCase.status === 'Pending' ? (
              <span className="text-amber-400">Pending Execution</span>
            ) : testCase.status === 'Processing' ? (
              <span className="text-cyan-400 animate-pulse">Processing...</span>
            ) : testCase.status === 'API Error' ? (
              <span className="text-rose-400">API Error</span>
            ) : (
              <span className="text-emerald-400">Completed</span>
            )}
          </div>
        </div>

        {/* 3. Extraction Completed: Yes/No */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Extraction Completed
          </div>
          <div className="font-semibold flex items-center gap-1.5">
            {isExtractionCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Yes</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">No</span>
              </>
            )}
          </div>
        </div>

        {/* 4. Number of Medicines Extracted */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <Pill className="w-3.5 h-3.5 text-teal-400" /> Number of Medicines Extracted
          </div>
          <div className="font-bold text-teal-300 text-xs flex items-center gap-2">
            <span>{numMedsExtracted} medicine(s)</span>
            {numMedsExtracted === 0 && isExtractionCompleted && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Explicit 0 detected
              </span>
            )}
          </div>
        </div>

        {/* 5. Raw AI Result Available: Yes/No */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <FileCheck className="w-3.5 h-3.5 text-indigo-400" /> Raw AI Result Available
          </div>
          <div className="font-semibold flex items-center gap-1.5">
            {isRawAiAvailable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300">Yes ({numMedsExtracted} items loaded)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">No (Not Extracted)</span>
              </>
            )}
          </div>
        </div>

        {/* 6. Ground Truth Available: Yes/No */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 flex items-center gap-1.5 font-medium">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Ground Truth Available
          </div>
          <div className="font-semibold flex items-center gap-1.5">
            {hasGroundTruth ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Yes ({numGroundTruthMeds} benchmark med(s))</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">No (AI Extracted Pending Review)</span>
              </>
            )}
          </div>
        </div>

        {/* 7. Evaluation Status */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 font-medium">Evaluation Status</div>
          <div>{getEvaluationStateBadge()}</div>
        </div>

        {/* 8. Review Status */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 font-medium">Review Status</div>
          <div className="font-semibold text-slate-200">
            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600 text-xs">
              {testCase.reviewStatus || 'Pending Review'}
            </span>
          </div>
        </div>

        {/* Image Difficulty */}
        <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
          <div className="text-slate-400 text-[11px] mb-1 font-medium">Difficulty Level</div>
          <div className="font-semibold text-slate-300">
            {testCase.difficultyCategory}
          </div>
        </div>
      </div>

      {/* 9. Reason for Current Status */}
      <div className="bg-slate-800/90 rounded-lg p-3 border border-slate-700/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-300 mb-0.5 text-[11px] uppercase tracking-wider">
            Reason for Current Status:
          </div>
          <p className="text-slate-300 leading-relaxed text-xs">
            {getReasonForStatus()}
          </p>
        </div>
      </div>
    </div>
  );
};
