import React from 'react';
import { AlertCircle, AlertTriangle, Bug } from 'lucide-react';
import { CommonErrorType } from '../../testingTypes';

interface Props {
  commonErrorsCount: Record<CommonErrorType, number>;
  onFilterByError?: (err: CommonErrorType) => void;
}

export const CommonErrorAnalysis: React.FC<Props> = ({
  commonErrorsCount,
  onFilterByError,
}) => {
  const errorEntries = Object.entries(commonErrorsCount) as [CommonErrorType, number][];
  const totalErrors = errorEntries.reduce((acc, [, count]) => acc + count, 0);

  const getErrorSeverity = (errorType: CommonErrorType) => {
    switch (errorType) {
      case 'Medicine name incorrectly detected':
      case 'Dose incorrectly detected':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          bar: 'bg-rose-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      case 'Frequency missing':
      case 'Timing missing':
      case 'Needs manual verification':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          bar: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          bar: 'bg-slate-500',
          icon: <Bug className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Common Error Analysis</h3>
            <p className="text-xs text-slate-500">
              Aggregated failure patterns to identify prompt engineering and OCR improvement priorities.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {totalErrors} total error instances
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {errorEntries.map(([errType, count]) => {
          const styling = getErrorSeverity(errType);
          const percent = totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;

          return (
            <div
              key={errType}
              onClick={() => onFilterByError && onFilterByError(errType)}
              className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {styling.icon}
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1" title={errType}>
                    {errType}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md border ${styling.badge}`}
                >
                  {count}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${styling.bar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{percent}% of issues</span>
                  <span>{count} occurrences</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
