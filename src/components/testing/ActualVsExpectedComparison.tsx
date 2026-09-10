import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  MinusCircle,
  Pill,
  Clock,
  Calendar,
  Info,
  Terminal,
  FileCheck,
} from 'lucide-react';
import { FieldComparisonStatus, MedicineComparison } from '../../testingTypes';

interface Props {
  comparisons: MedicineComparison[];
}

export const ActualVsExpectedComparison: React.FC<Props> = ({ comparisons }) => {
  const getStatusBadge = (status: FieldComparisonStatus) => {
    switch (status) {
      case 'Correct':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Correct
          </span>
        );
      case 'Incorrect':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Incorrect
          </span>
        );
      case 'Missing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Missing
          </span>
        );
      case 'Not Evaluated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <MinusCircle className="w-3 h-3 text-slate-400" /> Not Evaluated
          </span>
        );
      case 'Needs Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <HelpCircle className="w-3 h-3 text-indigo-600" /> Needs Verification
          </span>
        );
    }
  };

  const getRowBg = (status: FieldComparisonStatus) => {
    switch (status) {
      case 'Correct':
        return 'bg-emerald-50/40 hover:bg-emerald-50/70';
      case 'Incorrect':
        return 'bg-rose-50/40 hover:bg-rose-50/70';
      case 'Missing':
        return 'bg-amber-50/40 hover:bg-amber-50/70';
      case 'Not Evaluated':
        return 'bg-slate-50/30 hover:bg-slate-50/60';
      case 'Needs Verification':
      default:
        return 'bg-indigo-50/40 hover:bg-indigo-50/70';
    }
  };

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-sm">
        No field comparison data available. Enter expected prescription information and run analysis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comparisons.map((med, idx) => {
        const debug = med.debugInfo;
        const isPassed = med.overallMedicineStatus === 'Correct';
        const isMissing = med.overallMedicineStatus === 'Missing';
        const isExtra = med.expectedName === '(None - Extra Medicine)';
        const isNotEval = med.overallMedicineStatus === 'Not Evaluated';

        return (
          <div
            key={med.expectedId || `med-${idx}`}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Medicine Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    {med.expectedName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detected as: <span className="font-medium text-slate-700">{med.actualName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Medicine Status:</span>
                {getStatusBadge(med.overallMedicineStatus)}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-1/4">Prescription Field</th>
                    <th className="py-2.5 px-4 w-1/3 text-emerald-950 font-bold bg-emerald-50/60">
                      LEFT SIDE: Expected Result (Ground Truth)
                    </th>
                    <th className="py-2.5 px-4 w-1/3 text-indigo-950 font-bold bg-indigo-50/60">
                      RIGHT SIDE: AI Extracted Result
                    </th>
                    <th className="py-2.5 px-4 w-1/6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Medicine Name */}
                  <tr className={getRowBg(med.medicineName.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-600" /> Medicine Name
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold bg-emerald-50/20">
                      {med.medicineName.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.medicineName.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.medicineName.status)}
                    </td>
                  </tr>

                  {/* Dose */}
                  <tr className={getRowBg(med.dose.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" /> Dose / Strength
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-emerald-50/20">
                      {med.dose.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.dose.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.dose.status)}
                    </td>
                  </tr>

                  {/* Frequency */}
                  <tr className={getRowBg(med.frequency.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Frequency
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-emerald-50/20">
                      {med.frequency.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.frequency.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.frequency.status)}
                    </td>
                  </tr>

                  {/* Timing */}
                  <tr className={getRowBg(med.timing.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" /> Timing
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-emerald-50/20">
                      {med.timing.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.timing.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.timing.status)}
                    </td>
                  </tr>

                  {/* Duration */}
                  <tr className={getRowBg(med.duration.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Duration
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-emerald-50/20">
                      {med.duration.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.duration.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.duration.status)}
                    </td>
                  </tr>

                  {/* Instructions */}
                  <tr className={getRowBg(med.instructions.status)}>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-600" /> Instructions
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-emerald-50/20">
                      {med.instructions.expected || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 bg-indigo-50/20">
                      {med.instructions.actual || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {getStatusBadge(med.instructions.status)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Comparison Debug Section */}
            <div className="bg-slate-900 text-slate-200 p-4 border-t border-slate-800 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                    Comparison Debug & Normalization Details
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Match Result:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isPassed
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        : isMissing
                        ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                        : isExtra
                        ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                        : isNotEval
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-rose-900/80 text-rose-300 border border-rose-700'
                    }`}
                  >
                    {debug?.matchResult || (isPassed ? 'Exact Match' : 'Evaluated')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Ground Truth Medicine */}
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ground Truth Medicine:</span>
                  </div>
                  <div className="text-emerald-300 font-semibold pl-5">
                    {debug?.groundTruthMedicine || med.expectedName || '—'}
                  </div>
                </div>

                {/* AI Extracted Medicine */}
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Extracted Medicine:</span>
                  </div>
                  <div className="text-indigo-300 font-semibold pl-5">
                    {debug?.aiExtractedMedicine || med.actualName || '—'}
                  </div>
                </div>

                {/* Normalized Ground Truth */}
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70 font-mono text-[11px]">
                  <div className="text-slate-400 font-medium mb-1 font-sans">
                    <span>Normalized Ground Truth:</span>
                  </div>
                  <div className="text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800 break-all">
                    {debug?.normalizedGroundTruth || '—'}
                  </div>
                </div>

                {/* Normalized AI Result */}
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/70 font-mono text-[11px]">
                  <div className="text-slate-400 font-medium mb-1 font-sans">
                    <span>Normalized AI Result:</span>
                  </div>
                  <div className="text-slate-300 bg-slate-950/60 px-2 py-1 rounded border border-slate-800 break-all">
                    {debug?.normalizedAiResult || '—'}
                  </div>
                </div>
              </div>

              {/* Reason for Pass/Fail */}
              <div className="bg-slate-800/90 rounded-lg p-2.5 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 whitespace-nowrap">
                    Reason for Pass/Fail:
                  </span>
                  <span
                    className={`font-medium ${
                      isPassed
                        ? 'text-emerald-400'
                        : isMissing
                        ? 'text-amber-400'
                        : isExtra
                        ? 'text-blue-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {debug?.passFailReason ||
                      (isPassed
                        ? 'Medicine name and dosage matched normalized ground truth criteria.'
                        : 'Discrepancy detected in field comparison.')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
