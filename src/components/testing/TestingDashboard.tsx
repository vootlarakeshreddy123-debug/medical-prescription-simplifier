import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Upload,
  Play,
  Download,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Zap,
  ShieldAlert,
  ArrowUpDown,
  Eye,
  Trash2,
  Percent,
  Layers,
  Activity,
  Sparkles,
  RefreshCw,
  Database,
  BookmarkCheck,
  Pause,
  Square,
  Loader2,
} from 'lucide-react';
import {
  BatchJobStatus,
  DifficultyCategory,
  EvaluationTestCase,
  ReviewStatus,
  TestingDashboardMetrics,
  TestStatus,
} from '../../testingTypes';
import { DifficultyCategoryBar } from './DifficultyCategoryBar';
import { CommonErrorAnalysis } from './CommonErrorAnalysis';
import { UploadTestModal } from './UploadTestModal';
import { TestDetailsModal } from './TestDetailsModal';
import { FeedbackLearningView } from './FeedbackLearningView';

export const TestingDashboard: React.FC = () => {
  const [mainTab, setMainTab] = useState<'suite' | 'feedback'>('suite');
  const [testCases, setTestCases] = useState<EvaluationTestCase[]>([]);
  const [metrics, setMetrics] = useState<TestingDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Automated Batch Queue Job State
  const [batchJob, setBatchJob] = useState<BatchJobStatus | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [speedFilter, setSpeedFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'accuracy' | 'time' | 'date'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Notification / error banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isUnevaluatedTestCase = (tc: EvaluationTestCase) => {
    return (
      tc.evaluationState === 'NOT_EVALUATED' ||
      tc.evaluationState === 'NEEDS_VERIFICATION' ||
      tc.status === 'Ground Truth Required' ||
      tc.status === 'AI Extracted Pending Review' ||
      tc.status === 'Needs Verification' ||
      tc.status === 'Pending' ||
      tc.status === 'Processing' ||
      tc.status === 'API Error' ||
      tc.status === 'Extraction Error'
    );
  };

  const unevaluatedCases = useMemo(() => {
    return testCases.filter(isUnevaluatedTestCase);
  }, [testCases]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [casesRes, metricsRes] = await Promise.all([
        fetch('/api/testing/cases'),
        fetch('/api/testing/metrics'),
      ]);

      if (casesRes.ok && metricsRes.ok) {
        const casesData = await casesRes.json();
        const metricsData = await metricsRes.json();
        setTestCases(casesData);
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to load testing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBatchStatus = async () => {
    try {
      const res = await fetch('/api/testing/batch/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          setBatchJob(data.status);
        }
      }
    } catch (err) {
      console.error('Failed to poll batch status:', err);
    }
  };

  useEffect(() => {
    loadData();
    checkBatchStatus();
  }, []);

  // Polling loop when batch job is running on server
  useEffect(() => {
    if (!batchJob?.isRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/testing/batch/status');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.status) {
            setBatchJob(data.status);
            // If just completed
            if (!data.status.isRunning && batchJob?.isRunning) {
              showToast(
                `Batch processing complete! ${data.status.completedCount} processed, ${data.status.errorCount} errors.`
              );
              loadData();
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [batchJob?.isRunning]);

  const handleRunAllUnevaluated = async () => {
    try {
      showToast('Starting safe automated batch queue for all unevaluated tests...');
      const res = await fetch('/api/testing/batch/run-unevaluated', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBatchJob(data.status);
        showToast(`Batch queue active: ${data.status.totalInBatch} tests in queue.`);
      } else {
        showToast('Failed to start batch queue: ' + (data.details || 'Server error'));
      }
    } catch (err) {
      showToast('Error starting batch queue.');
    }
  };

  const handlePauseBatch = async () => {
    try {
      const res = await fetch('/api/testing/batch/pause', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        setBatchJob(data.status);
        showToast('Batch processing paused.');
      }
    } catch {
      showToast('Failed to pause batch.');
    }
  };

  const handleResumeBatch = async () => {
    try {
      const res = await fetch('/api/testing/batch/resume', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        setBatchJob(data.status);
        showToast('Batch processing resumed.');
      }
    } catch {
      showToast('Failed to resume batch.');
    }
  };

  const handleStopBatch = async () => {
    if (
      window.confirm(
        'Stop and cancel the remaining queue? Completed items are already saved to disk immediately.'
      )
    ) {
      try {
        const res = await fetch('/api/testing/batch/stop', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.status) {
          setBatchJob(data.status);
          showToast('Batch processing stopped. All completed tests preserved.');
          loadData();
        }
      } catch {
        showToast('Failed to stop batch.');
      }
    }
  };

  const handleRunSingle = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      showToast(`Running test analysis on ${id}...`);
      const res = await fetch(`/api/testing/cases/${id}/run`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Test ${id} completed: ${data.testCase.status}`);
        loadData();
      } else {
        showToast(`Failed to run test ${id}`);
      }
    } catch {
      showToast(`Error running test ${id}`);
    }
  };

  const handleBatchRunPending = async () => {
    const pendingCases = testCases.filter((tc) => tc.status === 'Pending');
    if (pendingCases.length === 0) {
      showToast('No pending tests found to run.');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: pendingCases.length });

    for (let i = 0; i < pendingCases.length; i++) {
      const tc = pendingCases[i];
      setBatchProgress({ current: i + 1, total: pendingCases.length });
      try {
        await fetch(`/api/testing/cases/${tc.id}/run`, { method: 'POST' });
      } catch (err) {
        console.error(`Error batch running ${tc.id}:`, err);
      }
    }

    setIsBatchRunning(false);
    setBatchProgress(null);
    showToast(`Batch execution completed for ${pendingCases.length} test cases!`);
    loadData();
  };

  const handleSeedDemo = async () => {
    if (window.confirm('Reset the test suite to the verified benchmark demo test cases?')) {
      try {
        const res = await fetch('/api/testing/seed-demo', { method: 'POST' });
        if (res.ok) {
          showToast('Demo benchmark test suite restored successfully.');
          loadData();
        }
      } catch {
        showToast('Failed to seed demo suite.');
      }
    }
  };

  const handleDeleteCase = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Delete test case ${id}?`)) {
      try {
        const res = await fetch(`/api/testing/cases/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Test case ${id} removed.`);
          loadData();
        }
      } catch {
        showToast(`Failed to delete ${id}`);
      }
    }
  };

  const handleExportCSV = () => {
    window.location.href = '/api/testing/export-csv';
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    showToast('Recalculating test case evaluations with normalized logic...');
    try {
      const res = await fetch('/api/testing/recalculate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Recalculated ${data.updatedCount} test cases! Metrics updated.`);
        await loadData();
      } else {
        showToast('Failed to recalculate test cases.');
      }
    } catch {
      showToast('Error recalculating test cases.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Filter and Sort
  const filteredCases = useMemo(() => {
    return testCases
      .filter((tc) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = tc.id.toLowerCase().includes(q);
          const matchesName = tc.imageName.toLowerCase().includes(q);
          const matchesNotes = (tc.reviewerNotes || '').toLowerCase().includes(q);
          const matchesMeds = (tc.expectedMedicines || []).some((m) =>
            m.name.toLowerCase().includes(q)
          );
          if (!matchesId && !matchesName && !matchesNotes && !matchesMeds) return false;
        }

        // Status Filter
        if (statusFilter !== 'all') {
          const isGroundTruthReq =
            tc.status === 'Ground Truth Required' ||
            tc.status === 'AI Extracted Pending Review' ||
            (tc.evaluationState === 'NOT_EVALUATED' &&
              tc.status !== 'Pending' &&
              tc.status !== 'Processing' &&
              tc.status !== 'API Error' &&
              tc.status !== 'Extraction Error');

          const isNoMed =
            tc.status === 'No Medicine Detected' || tc.evaluationState === 'NO_MEDICINE_DETECTED';

          if (
            (statusFilter === 'Ground Truth Required' || statusFilter === 'AI Extracted Pending Review') &&
            !isGroundTruthReq
          )
            return false;
          if (statusFilter === 'No Medicine Detected' && !isNoMed) return false;

          if (statusFilter === 'Passed') {
            if (isGroundTruthReq || isNoMed) return false;
            if (tc.status !== 'Passed' && tc.reviewStatus !== 'Passed' && tc.reviewStatus !== 'Confirmed Correct')
              return false;
          }
          if (statusFilter === 'Partially Correct') {
            if (isGroundTruthReq || isNoMed) return false;
            if (tc.status !== 'Partially Correct' && tc.reviewStatus !== 'Partially Correct') return false;
          }
          if (statusFilter === 'Failed') {
            if (isGroundTruthReq || isNoMed) return false;
            if (tc.status !== 'Failed' && tc.reviewStatus !== 'Failed' && tc.reviewStatus !== 'Confirmed Incorrect')
              return false;
          }
          if (statusFilter === 'Needs Verification') {
            if (
              tc.status !== 'Needs Verification' &&
              tc.reviewStatus !== 'Needs Verification' &&
              tc.evaluationState !== 'NEEDS_VERIFICATION'
            )
              return false;
          }
          if (statusFilter === 'Pending' && tc.status !== 'Pending') return false;
          if (statusFilter === 'API Error' && tc.status !== 'API Error') return false;
        }

        // Speed Filter
        if (speedFilter !== 'all') {
          if (!tc.processingTimes) return false;
          if (speedFilter === 'Fast' && tc.processingTimes.totalSec > 5.0) return false;
          if (
            speedFilter === 'Good' &&
            (tc.processingTimes.totalSec <= 5.0 || tc.processingTimes.totalSec > 10.0)
          )
            return false;
          if (speedFilter === 'Slow' && tc.processingTimes.totalSec <= 10.0) return false;
        }

        // Category Filter
        if (categoryFilter !== 'all' && tc.difficultyCategory !== categoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'id') {
          diff = a.id.localeCompare(b.id);
        } else if (sortBy === 'accuracy') {
          diff = (a.accuracy?.overallAccuracy || 0) - (b.accuracy?.overallAccuracy || 0);
        } else if (sortBy === 'time') {
          diff = (a.processingTimes?.totalSec || 0) - (b.processingTimes?.totalSec || 0);
        } else if (sortBy === 'date') {
          diff = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        }
        return sortAsc ? diff : -diff;
      });
  }, [testCases, searchQuery, statusFilter, speedFilter, categoryFilter, sortBy, sortAsc]);

  const getStatusBadge = (tc: EvaluationTestCase) => {
    // Strict evaluation states:
    // A: AI Extracted Pending Review (NOT_EVALUATED)
    if (
      tc.status === 'Ground Truth Required' ||
      tc.status === 'AI Extracted Pending Review' ||
      (tc.evaluationState === 'NOT_EVALUATED' &&
        tc.status !== 'Pending' &&
        tc.status !== 'Processing' &&
        tc.status !== 'API Error' &&
        tc.status !== 'Extraction Error')
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
          <HelpCircle className="w-3 h-3 text-violet-600" /> AI Extracted Pending Review
        </span>
      );
    }

    // B: No Medicine Detected (NO_MEDICINE_DETECTED)
    if (tc.status === 'No Medicine Detected' || tc.evaluationState === 'NO_MEDICINE_DETECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> No Medicine Detected
        </span>
      );
    }

    // C: Human reviewer overrides
    if (tc.reviewStatus === 'Confirmed Correct') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed Correct
        </span>
      );
    }
    if (tc.reviewStatus === 'Confirmed Incorrect') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" /> Confirmed Incorrect
        </span>
      );
    }
    if (tc.reviewStatus === 'Confirmed No Medicine') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Non-Medicinal Confirmed
        </span>
      );
    }
    if (tc.reviewStatus === 'Marked Unreadable') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
          <XCircle className="w-3 h-3 text-slate-600" /> Unreadable
        </span>
      );
    }

    const finalStatus =
      tc.reviewStatus && tc.reviewStatus !== 'Pending Review' ? tc.reviewStatus : tc.status;

    switch (finalStatus) {
      case 'Passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
          </span>
        );
      case 'Partially Correct':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Partially Correct
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Failed
          </span>
        );
      case 'Needs Verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <HelpCircle className="w-3 h-3 text-indigo-600" /> Needs Verification
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <div className="w-2.5 h-2.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" /> Processing
          </span>
        );
      case 'API Error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> API Error
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" /> Pending
          </span>
        );
    }
  };

  const getSpeedBadge = (times?: { totalSec: number; speedCategory: 'Excellent' | 'Good' | 'Slow' }) => {
    if (!times) return <span className="text-slate-400 text-xs">—</span>;

    const speedCategory = times.speedCategory;
    if (speedCategory === 'Excellent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Zap className="w-3 h-3 text-emerald-600" /> {times.totalSec}s (Fast)
        </span>
      );
    }
    if (speedCategory === 'Good') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <Clock className="w-3 h-3 text-teal-600" /> {times.totalSec}s (Good)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" /> {times.totalSec}s (Slow)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Prescription Testing & Accuracy Evaluation Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Developer & quality testing suite for evaluating prescription extraction logic across ~200 test images.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action: Run All Unevaluated Tests */}
          <button
            onClick={handleRunAllUnevaluated}
            disabled={batchJob?.isRunning}
            title="Automatically process all unevaluated test cases with safe queue and immediate disk saving"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:from-violet-800 active:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {batchJob?.isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Queue ({batchJob.completedCount}/{batchJob.totalInBatch})...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN ALL UNEVALUATED TESTS</span>
                {unevaluatedCases.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[11px] font-black bg-white/25 text-white rounded-full">
                    {unevaluatedCases.length}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Test Images
          </button>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            title="Recalculate all test case comparisons with normalized evaluation logic"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate Metrics'}
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={handleSeedDemo}
            title="Reset to benchmark demo test cases"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Batch Progress Banner */}
      {batchJob && (batchJob.isRunning || batchJob.isPaused || (batchJob.startedAt && !batchJob.finishedAt)) && (
        <div className="bg-white border-2 border-violet-400/60 rounded-2xl p-5 shadow-md mb-2 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                {batchJob.isRunning && (
                  <div className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  Processing {batchJob.currentNumber} of {batchJob.totalTestCases || testCases.length || 209}
                </span>
                {batchJob.isPaused && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Queue Paused
                  </span>
                )}
                {batchJob.isRunning && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                    Live Safe Queue Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-2">
                <span>Concurrency: 2 safe workers</span>
                <span>•</span>
                <span className="truncate max-w-md">
                  Active specimen: <strong>{batchJob.currentImageName || 'Processing...'}</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">Autosaved to disk immediately per test</span>
              </p>
            </div>

            {/* Queue Control Buttons */}
            <div className="flex items-center gap-2">
              {batchJob.isRunning && (
                <button
                  type="button"
                  onClick={handlePauseBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Queue
                </button>
              )}
              {batchJob.isPaused && (
                <button
                  type="button"
                  onClick={handleResumeBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume Queue
                </button>
              )}
              <button
                type="button"
                onClick={handleStopBatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" /> Stop Queue
              </button>
            </div>
          </div>

          {/* Metric Stat Boxes: Completed, Remaining, Errors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Completed
                </div>
                <div className="text-2xl font-black text-emerald-900">{batchJob.completedCount}</div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600/80" />
            </div>

            <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Remaining
                </div>
                <div className="text-2xl font-black text-indigo-900">{batchJob.remainingCount}</div>
              </div>
              <Clock className="w-6 h-6 text-indigo-600/80" />
            </div>

            <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Errors</div>
                <div className="text-2xl font-black text-rose-900">{batchJob.errorCount}</div>
              </div>
              <AlertTriangle className="w-6 h-6 text-rose-600/80" />
            </div>
          </div>

          {/* Live Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Batch Queue Progress</span>
              <span>
                {Math.round(
                  ((batchJob.completedCount + batchJob.errorCount) / (batchJob.totalInBatch || 1)) * 100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      2,
                      Math.round(
                        ((batchJob.completedCount + batchJob.errorCount) /
                          (batchJob.totalInBatch || 1)) *
                          100
                      )
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setMainTab('suite')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            mainTab === 'suite'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Testing Suite & Benchmarks
        </button>

        <button
          type="button"
          onClick={() => setMainTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            mainTab === 'feedback'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          Feedback-Learning Dataset
        </button>
      </div>

      {mainTab === 'feedback' ? (
        <FeedbackLearningView />
      ) : (
        <>
          {/* Mandatory Privacy & Medical Safety Notice */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-3xl flex items-start gap-3.5 text-xs text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Privacy, Medical Safety & Model Disclaimers:</p>
              <p className="text-amber-900">
                Use only authorized, public, synthetic, or properly de-identified prescription images for testing. Do not upload private patient information without appropriate authorization.
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Uploading test images does NOT automatically train Gemini or claim that the AI model has been trained. The application never claims &ldquo;100% medically accurate&rdquo; or &ldquo;AI verified by a doctor&rdquo; without actual human clinical verification. Unclear medicine names are strictly marked as <strong>Needs Verification</strong>.
              </p>
            </div>
          </div>

          {/* Primary Dashboard Overview: High-Level Metric Cards */}
          {metrics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Testing Suite Overview & Key Performance Indicators
                </h2>
                <span className="text-[11px] text-slate-500">
                  Evaluated strictly against verified ground truth comparisons
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Total Test Cases */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Total Cases</span>
                  <p className="text-2xl font-black text-slate-900">{metrics.totalTestCases}</p>
                  <p className="text-[10px] text-slate-400">Target ~200 images</p>
                </div>

                {/* 2. Processed vs Evaluated */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Evaluated w/ Benchmark</span>
                  <p className="text-2xl font-black text-teal-700">{metrics.testsEvaluated ?? (metrics.testsPassed + metrics.testsPartiallyCorrect + metrics.testsFailed)}</p>
                  <p className="text-[10px] text-teal-600 font-medium">
                    {metrics.testsCompleted} processed
                  </p>
                </div>

                {/* 3. Tests Passed */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Tests Passed</span>
                  <p className="text-2xl font-black text-emerald-600">{metrics.testsPassed}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">All fields accurate</p>
                </div>

                {/* 4. Tests Partially Correct */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Partially Correct</span>
                  <p className="text-2xl font-black text-amber-600">{metrics.testsPartiallyCorrect}</p>
                  <p className="text-[10px] text-amber-700 font-medium">Minor discrepancy</p>
                </div>

                {/* 5. Tests Failed */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Tests Failed</span>
                  <p className="text-2xl font-black text-rose-600">{metrics.testsFailed}</p>
                  <p className="text-[10px] text-rose-700 font-medium">Extraction error</p>
                </div>

                {/* 6. Overall Accuracy */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Overall Accuracy</span>
                  <p className="text-2xl font-black text-teal-900">
                    {metrics.overallAccuracyPercentage}%
                  </p>
                  <p className="text-[10px] text-teal-600 font-medium">On evaluated cases</p>
                </div>

                {/* 7. AI Extracted Pending Review */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-violet-700">AI Extracted Pending Review</span>
                  <p className="text-2xl font-black text-violet-800">
                    {metrics.testsGroundTruthRequired ?? 0}
                  </p>
                  <p className="text-[10px] text-violet-600 font-medium">Pending benchmark ground truth</p>
                </div>

                {/* 8. Needs Verification */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-700">Needs Verification</span>
                  <p className="text-2xl font-black text-indigo-800">
                    {metrics.testsNeedsVerification ?? 0}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-medium">Clinician review req.</p>
                </div>

                {/* 9. No Medicine Detected */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-amber-700">No Meds Detected</span>
                  <p className="text-2xl font-black text-amber-800">
                    {metrics.testsNoMedicineDetected ?? 0}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">Zero meds extracted</p>
                </div>

                {/* 10. Avg Processing Time */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500">Avg Time</span>
                  <p className="text-2xl font-black text-slate-900">
                    {metrics.averageProcessingTimeSec}s
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Fastest {metrics.fastestProcessingTimeSec}s</p>
                </div>
              </div>

          {/* Sub-Accuracies Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">Field-by-Field Extraction Accuracy</h3>
              <span className="text-[11px] text-slate-500">
                Independent accuracy across core prescription attributes
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Medicine Name</span>
                <span className="text-lg font-black text-slate-900">
                  {metrics.fieldAccuracy.medicineNameAccuracy}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Dose / Strength</span>
                <span className="text-lg font-black text-slate-900">
                  {metrics.fieldAccuracy.doseAccuracy}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Frequency</span>
                <span className="text-lg font-black text-slate-900">
                  {metrics.fieldAccuracy.frequencyAccuracy}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Timing (Food/Day)</span>
                <span className="text-lg font-black text-slate-900">
                  {metrics.fieldAccuracy.timingAccuracy}%
                </span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                <span className="text-[10px] font-semibold text-teal-700 block">Overall Score</span>
                <span className="text-lg font-black text-teal-900">
                  {metrics.fieldAccuracy.overallAccuracy}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Category Breakdown */}
      {metrics && (
        <DifficultyCategoryBar
          categoryAccuracy={metrics.categoryAccuracy}
          selectedCategory={categoryFilter}
          onSelectCategory={(cat) => setCategoryFilter(cat)}
        />
      )}

      {/* Common Error Analysis Breakdown */}
      {metrics && (
        <CommonErrorAnalysis
          commonErrorsCount={metrics.commonErrorsCount}
          onFilterByError={(err) => setSearchQuery(err)}
        />
      )}

      {/* Search, Filter & Test Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Prescription Test Cases ({filteredCases.length} of {testCases.length})
            </h3>
            <p className="text-xs text-slate-500">
              Click any row to inspect side-by-side comparison and edit ground truth data.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, image name, medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="all">Status: All</option>
            <option value="Passed">Passed / Confirmed</option>
            <option value="Partially Correct">Partially Correct</option>
            <option value="Failed">Failed / Confirmed Incorrect</option>
            <option value="Needs Verification">Needs Verification</option>
            <option value="AI Extracted Pending Review">AI Extracted Pending Review</option>
            <option value="Ground Truth Required">Ground Truth Required</option>
            <option value="No Medicine Detected">No Medicine Detected</option>
            <option value="Pending">Pending</option>
            <option value="API Error">API Error</option>
          </select>

          {/* Speed Category Filter */}
          <select
            value={speedFilter}
            onChange={(e) => setSpeedFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="all">Speed: All</option>
            <option value="Fast">Fast (0–5s)</option>
            <option value="Good">Good (5–10s)</option>
            <option value="Slow">Slow (&gt;10s)</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="all">Category: All</option>
            <option value="Clear Printed">Clear Printed</option>
            <option value="Clear Handwritten">Clear Handwritten</option>
            <option value="Medium Handwritten">Medium Handwritten</option>
            <option value="Difficult Handwritten">Difficult Handwritten</option>
            <option value="Low Quality / Blurry">Low Quality / Blurry</option>
            <option value="Mixed Prescription">Mixed Prescription</option>
          </select>

          {/* Sort Control */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
            >
              <option value="id">Test ID</option>
              <option value="accuracy">Accuracy</option>
              <option value="time">Speed / Latency</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={() => setSortAsc((s) => !s)}
              className="p-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Image Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Medicine Acc.</th>
                <th className="py-3 px-4">Dose Acc.</th>
                <th className="py-3 px-4">Overall Acc.</th>
                <th className="py-3 px-4">Processing Time</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No test cases match the current filter or search query.
                  </td>
                </tr>
              ) : (
                filteredCases.map((tc) => (
                  <tr
                    key={tc.id}
                    onClick={() => setSelectedTestCaseId(tc.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* Test ID */}
                    <td className="py-3 px-4 font-bold text-teal-700">{tc.id}</td>

                    {/* Image Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      {tc.imageUrl ? (
                        <img
                          src={tc.imageUrl}
                          alt={tc.imageName}
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                      <span className="truncate max-w-[150px]">{tc.imageName}</span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {tc.difficultyCategory}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(tc)}</td>

                    {/* Medicine Accuracy */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {tc.accuracy && tc.expectedMedicines && tc.expectedMedicines.length > 0
                        ? `${tc.accuracy.medicineNameAccuracy}%`
                        : '—'}
                    </td>

                    {/* Dose Accuracy */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {tc.accuracy && tc.expectedMedicines && tc.expectedMedicines.length > 0
                        ? `${tc.accuracy.doseAccuracy}%`
                        : '—'}
                    </td>

                    {/* Overall Accuracy */}
                    <td className="py-3 px-4 font-black text-teal-800">
                      {tc.accuracy && tc.expectedMedicines && tc.expectedMedicines.length > 0
                        ? `${tc.accuracy.overallAccuracy}%`
                        : '—'}
                    </td>

                    {/* Processing Time */}
                    <td className="py-3 px-4">{getSpeedBadge(tc.processingTimes)}</td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500">
                      {tc.uploadDate ? tc.uploadDate.split('T')[0] : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTestCaseId(tc.id)}
                          title="View Details & Actual vs Expected"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleRunSingle(tc.id, e)}
                          title="Run Test"
                          className="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCase(tc.id, e)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Modals */}
      <UploadTestModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          showToast('New test case(s) uploaded successfully.');
          loadData();
        }}
      />

      <TestDetailsModal
        testCaseId={selectedTestCaseId}
        isOpen={selectedTestCaseId !== null}
        onClose={() => setSelectedTestCaseId(null)}
        onUpdate={() => {
          loadData();
        }}
      />
    </div>
  );
};
