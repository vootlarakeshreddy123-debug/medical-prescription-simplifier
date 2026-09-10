import React, { useEffect, useState } from 'react';
import {
  Database,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { CommonErrorType, FeedbackLearningRecord, ReviewDecision } from '../../testingTypes';

interface FeedbackStats {
  totalReviewed: number;
  errorDistribution: Record<CommonErrorType, number>;
  decisionBreakdown: Record<ReviewDecision, number>;
}

export const FeedbackLearningView: React.FC = () => {
  const [records, setRecords] = useState<FeedbackLearningRecord[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedErrorFilter, setSelectedErrorFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const fetchDataset = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/testing/feedback-dataset');
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load feedback dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      const res = await fetch(`/api/testing/feedback-dataset/export?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_feedback_dataset.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (selectedErrorFilter === 'all') return true;
    return r.errorTypes?.includes(selectedErrorFilter as CommonErrorType);
  });

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-2xl border border-teal-800/60 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-300">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Feedback-Learning & Evaluation Dataset
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                {records.length} Reviewed Records
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Every prescription reviewed by clinicians and test engineers is structured into this
              benchmark dataset. It captures original images, AI extractions, human-verified ground truths,
              error taxonomies, and review decisions to systematically improve future vision prompts,
              preprocessing pipelines, and model evaluation accuracy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="export-feedback-json-btn"
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" /> Export JSON
            </button>
            <button
              id="export-feedback-csv-btn"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={fetchDataset}
              title="Refresh dataset"
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Strict Architecture Clarification */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-teal-300">Methodology Notice: </span>
            Gemini models do not automatically self-train on these records. Instead, this dataset is utilized
            by engineering teams to pinpoint failure modes, calibrate OCR preprocessing filters, refine prompt
            specifications, and evaluate accuracy improvements across future model iterations.
          </div>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>Total Reviewed Specimen</span>
              <Database className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalReviewed}</div>
            <div className="text-xs text-slate-500 mt-1">Prescriptions with verified outcomes</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>AI Confirmed Accuracy</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {stats.decisionBreakdown['Confirmed AI Result'] || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Accepted as accurate benchmark</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>Human Corrected</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {(stats.decisionBreakdown['Ground Truth Corrected'] || 0) +
                (stats.decisionBreakdown['Marked AI Result Incorrect'] || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Corrected ground truths logged</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>Non-Medicinal / Unreadable</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {(stats.decisionBreakdown['Confirmed No Medicine Present'] || 0) +
                (stats.decisionBreakdown['Marked Prescription Unreadable'] || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Specimens flagged for filtering</div>
          </div>
        </div>
      )}

      {/* Error Taxonomy Distribution */}
      {stats && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Error Taxonomy Distribution (Clinical Quality Metric)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Filtered to improve prompts & validation rules
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {Object.entries(stats.errorDistribution).map(([errType, rawCount]) => {
              const count = Number(rawCount) || 0;
              const isSelected = selectedErrorFilter === errType;
              return (
                <button
                  key={errType}
                  onClick={() => setSelectedErrorFilter(isSelected ? 'all' : errType)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                      : count > 0
                      ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                      : 'bg-slate-50/30 border-slate-100 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="text-[11px] font-medium truncate mb-1" title={errType}>
                    {errType}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold text-sm ${
                        count > 0 ? (isSelected ? 'text-teal-700' : 'text-slate-900') : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-teal-600 font-semibold">Active</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dataset Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Reviewed Feedback Records ({filteredRecords.length})
            </h3>
            {selectedErrorFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Filtered: {selectedErrorFilter}
                <button
                  onClick={() => setSelectedErrorFilter('all')}
                  className="hover:text-teal-950 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Click any error category above to filter records</span>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {records.length === 0 ? (
              <div className="space-y-2">
                <Database className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">No feedback records created yet.</p>
                <p className="text-xs text-slate-500">
                  Open any test case from the Test Cases tab and click reviewer actions (e.g.
                  "Confirm AI Result", "Add/Edit Ground Truth", or "Confirm No Medicine") to log
                  curated records.
                </p>
              </div>
            ) : (
              <div>No records found matching the filter "{selectedErrorFilter}".</div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-28">Test ID</th>
                  <th className="py-2.5 px-4 w-36">Difficulty</th>
                  <th className="py-2.5 px-4 w-44">Review Decision</th>
                  <th className="py-2.5 px-4">Extracted vs Ground Truth</th>
                  <th className="py-2.5 px-4">Error Classifications</th>
                  <th className="py-2.5 px-4 w-32 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((rec) => {
                  const numAi = rec.aiExtractedResult?.medicines?.length || 0;
                  const numGt = rec.groundTruth?.length || 0;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {rec.testId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                          {rec.imageDifficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            rec.reviewDecision === 'Confirmed AI Result'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : rec.reviewDecision === 'Marked AI Result Incorrect'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rec.reviewDecision === 'Confirmed No Medicine Present'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : rec.reviewDecision === 'Marked Prescription Unreadable'
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rec.reviewDecision}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">AI Extracted ({numAi}):</span>
                            <span className="text-slate-900 text-xs">
                              {rec.aiExtractedResult?.medicines?.map((m) => m.name).join(', ') || '(None)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-700 font-medium">Ground Truth ({numGt}):</span>
                            <span className="text-emerald-900 font-semibold text-xs">
                              {rec.groundTruth?.map((m) => m.name).join(', ') || '(None / Non-medicinal)'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {rec.errorTypes && rec.errorTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rec.errorTypes.map((e, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px]"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">No errors</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                        {rec.timestamp
                          ? new Date(rec.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
