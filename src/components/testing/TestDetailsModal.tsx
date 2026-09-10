import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Zap,
  Tag,
  Edit3,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileImage,
  AlertCircle,
} from 'lucide-react';
import {
  EvaluationTestCase,
  ExpectedMedicine,
  ReviewStatus,
  DifficultyCategory,
  ReviewDecision,
} from '../../testingTypes';
import { ActualVsExpectedComparison } from './ActualVsExpectedComparison';
import { TestDiagnosticPanel } from './TestDiagnosticPanel';

interface Props {
  testCaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const TestDetailsModal: React.FC<Props> = ({
  testCaseId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [testCase, setTestCase] = useState<EvaluationTestCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'editExpected' | 'image'>('comparison');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('Pending Review');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [difficultyCategory, setDifficultyCategory] = useState<DifficultyCategory>('Clear Printed');
  const [expectedMedicines, setExpectedMedicines] = useState<ExpectedMedicine[]>([]);

  useEffect(() => {
    if (testCaseId && isOpen) {
      loadTestCase(testCaseId);
    }
  }, [testCaseId, isOpen]);

  const loadTestCase = async (id: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/testing/cases/${id}`);
      if (!res.ok) throw new Error('Failed to load test case');
      const data: EvaluationTestCase = await res.json();
      setTestCase(data);
      setReviewStatus(data.reviewStatus || 'Pending Review');
      setReviewerNotes(data.reviewerNotes || '');
      setDifficultyCategory(data.difficultyCategory || 'Clear Printed');
      setExpectedMedicines(
        data.expectedMedicines && data.expectedMedicines.length > 0
          ? data.expectedMedicines
          : [
              {
                id: 'exp_init_1',
                name: '',
                dose: '',
                frequency: '',
                timing: '',
                duration: '',
                instructions: '',
              },
            ]
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch test case');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !testCaseId) return null;

  const handleRunTest = async () => {
    if (!testCase) return;
    setIsRunningTest(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/testing/cases/${testCase.id}/run`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to run test analysis');
      }
      setTestCase(data.testCase);
      setReviewStatus(data.testCase.reviewStatus);
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error running test analysis');
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleSaveReview = async () => {
    if (!testCase) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/testing/cases/${testCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus,
          reviewerNotes,
          difficultyCategory,
          expectedMedicines: expectedMedicines.filter((m) => m.name.trim().length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save updates');
      }
      setTestCase(data.testCase);
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving updates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickReviewDecision = async (
    decision: ReviewDecision,
    statusOverride?: ReviewStatus,
    groundTruthOverride?: ExpectedMedicine[]
  ) => {
    if (!testCase) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const newReviewStatus: ReviewStatus =
        statusOverride ||
        (decision === 'Confirmed AI Result'
          ? 'Passed'
          : decision === 'Marked AI Result Incorrect'
          ? 'Failed'
          : decision === 'Confirmed No Medicine Present'
          ? 'Confirmed No Medicine'
          : decision === 'Marked Prescription Unreadable'
          ? 'Marked Unreadable'
          : 'Passed');

      const newExpectedMeds =
        groundTruthOverride !== undefined
          ? groundTruthOverride
          : decision === 'Confirmed AI Result' && testCase.aiExtractedMedicines
          ? testCase.aiExtractedMedicines.map((m, idx) => ({
              id: `gt_from_ai_${Date.now()}_${idx}`,
              name: m.name,
              dose: m.dose || '',
              frequency: m.frequency || '',
              timing: m.timing || '',
              duration: m.duration || '',
              instructions: m.instructions || '',
            }))
          : decision === 'Confirmed No Medicine Present'
          ? []
          : expectedMedicines.filter((m) => m.name.trim().length > 0);

      const res = await fetch(`/api/testing/cases/${testCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: newReviewStatus,
          reviewDecision: decision,
          status: newReviewStatus === 'Passed' ? 'Passed' : newReviewStatus === 'Failed' ? 'Failed' : undefined,
          reviewerNotes: reviewerNotes || `Reviewer action: ${decision}`,
          difficultyCategory,
          expectedMedicines: newExpectedMeds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review action');
      }

      setTestCase(data.testCase);
      setReviewStatus(data.testCase.reviewStatus);
      if (newExpectedMeds.length > 0) {
        setExpectedMedicines(newExpectedMeds);
      }
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing review action');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpectedMedicine = () => {
    setExpectedMedicines((prev) => [
      ...prev,
      {
        id: `exp_${Date.now()}_${prev.length + 1}`,
        name: '',
        dose: '',
        frequency: '',
        timing: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleRemoveExpectedMedicine = (id: string) => {
    setExpectedMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateExpectedMedicine = (
    id: string,
    field: keyof ExpectedMedicine,
    value: string
  ) => {
    setExpectedMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const getSpeedBadge = (speedCategory?: 'Excellent' | 'Good' | 'Slow') => {
    switch (speedCategory) {
      case 'Excellent':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-600" /> Excellent (0–5s)
          </span>
        );
      case 'Good':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-teal-600" /> Good (5–10s)
          </span>
        );
      case 'Slow':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Slow (&gt;10s)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {testCase?.id || 'TEST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">{testCase?.imageName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                  {testCase?.difficultyCategory}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Uploaded: {testCase?.uploadDate ? new Date(testCase.uploadDate).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTest}
              disabled={isRunningTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs disabled:opacity-50 transition-colors"
            >
              {isRunningTest ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Test Analysis
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">Loading test case details...</p>
            </div>
          ) : (
            testCase && (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* Overall Accuracy */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[11px] text-slate-500 font-semibold">Overall Accuracy</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {testCase.accuracy ? `${testCase.accuracy.overallAccuracy}%` : 'N/A'}
                    </p>
                  </div>

                  {/* Medicine Accuracy */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[11px] text-slate-500 font-semibold">Medicine Accuracy</p>
                    <p className="text-lg font-black text-teal-700 mt-0.5">
                      {testCase.accuracy ? `${testCase.accuracy.medicineNameAccuracy}%` : 'N/A'}
                    </p>
                  </div>

                  {/* Dose Accuracy */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[11px] text-slate-500 font-semibold">Dose Accuracy</p>
                    <p className="text-lg font-black text-blue-700 mt-0.5">
                      {testCase.accuracy ? `${testCase.accuracy.doseAccuracy}%` : 'N/A'}
                    </p>
                  </div>

                  {/* Frequency Accuracy */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[11px] text-slate-500 font-semibold">Frequency Accuracy</p>
                    <p className="text-lg font-black text-amber-700 mt-0.5">
                      {testCase.accuracy ? `${testCase.accuracy.frequencyAccuracy}%` : 'N/A'}
                    </p>
                  </div>

                  {/* Total Processing Time */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[11px] text-slate-500 font-semibold">Processing Time</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {testCase.processingTimes ? `${testCase.processingTimes.totalSec}s` : 'N/A'}
                    </p>
                  </div>

                  {/* Speed Category */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center">
                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Speed Rating</p>
                    {testCase.processingTimes ? (
                      getSpeedBadge(testCase.processingTimes.speedCategory)
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </div>
                </div>

                {/* Processing Time Breakdown Details */}
                {testCase.processingTimes && (
                  <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-teal-900">Processing Time Breakdown:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-500">Image Prep:</span>{' '}
                        <span className="font-bold">{testCase.processingTimes.imageProcessingSec}s</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Gemini Extraction:</span>{' '}
                        <span className="font-bold text-teal-700">{testCase.processingTimes.geminiProcessingSec}s</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Safety Validation:</span>{' '}
                        <span className="font-bold">{testCase.processingTimes.validationSec}s</span>
                      </div>
                      <div className="pl-3 border-l border-teal-300 font-extrabold text-slate-900">
                        Total: {testCase.processingTimes.totalSec}s
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Diagnostics Panel */}
                <TestDiagnosticPanel testCase={testCase} />

                {/* State Guidance Banners */}
                {(!testCase.expectedMedicines || testCase.expectedMedicines.length === 0) &&
                  testCase.aiExtractedMedicines &&
                  testCase.aiExtractedMedicines.length > 0 && (
                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-violet-900">
                            State: AI Extracted Pending Review (NOT_EVALUATED)
                          </p>
                          <p className="text-violet-700 mt-0.5">
                            AI extracted {testCase.aiExtractedMedicines.length} medicine(s) successfully, but no ground truth benchmark exists yet. This test is excluded from accuracy metrics until evaluated.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickReviewDecision('Confirmed AI Result', 'Passed')}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          Confirm AI as Ground Truth
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('editExpected')}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors shadow-xs"
                        >
                          Enter Ground Truth
                        </button>
                      </div>
                    </div>
                  )}

                {testCase.status === 'No Medicine Detected' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">
                          State: No Medicine Detected (NO_MEDICINE_DETECTED)
                        </p>
                        <p className="text-amber-700 mt-0.5">
                          Extraction pipeline returned 0 medicines. Please verify if the image genuinely lacks prescription medicines or is unreadable.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickReviewDecision('Confirmed No Medicine Present', 'Confirmed No Medicine', [])
                        }
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        Confirm No Medicine
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickReviewDecision('Marked Prescription Unreadable', 'Marked Unreadable')
                        }
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        Mark Unreadable
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === 'comparison'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Actual vs Expected Comparison
                  </button>
                  <button
                    onClick={() => setActiveTab('image')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'image'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileImage className="w-3.5 h-3.5" /> Original Prescription Image
                  </button>
                  <button
                    onClick={() => setActiveTab('editExpected')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'editExpected'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Expected Ground Truth
                  </button>
                </div>

                {/* Tab: Comparison View */}
                {activeTab === 'comparison' && (
                  <div className="space-y-4">
                    {testCase.comparisons && testCase.comparisons.length > 0 ? (
                      <ActualVsExpectedComparison comparisons={testCase.comparisons} />
                    ) : (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-slate-800 text-sm">
                          No Evaluation Comparison Yet
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Click <strong>Run Test Analysis</strong> to extract information from this prescription image and automatically compare it with the expected medicines.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Original Image Viewer with Zoom */}
                {activeTab === 'image' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl">
                      <span className="text-xs font-bold text-slate-700">Prescription Image Preview</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                          className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-200"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold px-2">{Math.round(zoomLevel * 100)}%</span>
                        <button
                          onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                          className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-200"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-200"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-auto max-h-[500px] border border-slate-200 rounded-2xl bg-slate-900/5 p-4 flex items-center justify-center">
                      {testCase.imageUrl ? (
                        <img
                          src={testCase.imageUrl}
                          alt="Prescription specimen"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                          className="max-w-full rounded-xl shadow-md transition-transform"
                        />
                      ) : (
                        <div className="text-xs text-slate-400">No image data available</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Edit Expected Data Ground Truth */}
                {activeTab === 'editExpected' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Enter the true prescription medicines below. Saving will automatically recalculate accuracy scores.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddExpectedMedicine}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Expected Medicine
                      </button>
                    </div>

                    <div className="space-y-3">
                      {expectedMedicines.map((med, idx) => (
                        <div
                          key={med.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-700">
                            <span>Expected Medicine #{idx + 1}</span>
                            {expectedMedicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExpectedMedicine(med.id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Medicine Name
                              </label>
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'name', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Dose / Strength
                              </label>
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'dose', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Frequency
                              </label>
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'frequency', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Timing
                              </label>
                              <input
                                type="text"
                                value={med.timing}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'timing', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'duration', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                                Special Instructions
                              </label>
                              <input
                                type="text"
                                value={med.instructions}
                                onChange={(e) =>
                                  handleUpdateExpectedMedicine(med.id, 'instructions', e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Manual Human Review & Notes */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Reviewer Actions & Ground Truth Benchmarking
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Standardized clinical reviewer decision protocol
                    </span>
                  </div>

                  {/* 6 Explicit Human Reviewer Action Buttons */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Quick Reviewer Actions:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {/* Action A: Edit Ground Truth */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('editExpected')}
                        className="p-2 rounded-xl text-left bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 transition-colors font-medium flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold">A. Edit Ground Truth</div>
                          <div className="text-[10px] text-violet-700">Enter / edit expected meds</div>
                        </div>
                        <Edit3 className="w-4 h-4 text-violet-600" />
                      </button>

                      {/* Action B: Confirm AI Result */}
                      <button
                        type="button"
                        onClick={() => handleQuickReviewDecision('Confirmed AI Result', 'Passed')}
                        disabled={isSaving || !testCase.aiExtractedMedicines || testCase.aiExtractedMedicines.length === 0}
                        className="p-2 rounded-xl text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors font-medium flex items-center justify-between disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold">B. Confirm AI Result</div>
                          <div className="text-[10px] text-emerald-700">Accept AI as ground truth (Passed)</div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </button>

                      {/* Action C: Mark AI Result Incorrect */}
                      <button
                        type="button"
                        onClick={() => handleQuickReviewDecision('Marked AI Result Incorrect', 'Failed')}
                        disabled={isSaving}
                        className="p-2 rounded-xl text-left bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 transition-colors font-medium flex items-center justify-between disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold">C. Mark AI Incorrect</div>
                          <div className="text-[10px] text-rose-700">Flag extraction error (Failed)</div>
                        </div>
                        <XCircle className="w-4 h-4 text-rose-600" />
                      </button>

                      {/* Action D: Confirm No Medicine Present */}
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickReviewDecision('Confirmed No Medicine Present', 'Confirmed No Medicine', [])
                        }
                        disabled={isSaving}
                        className="p-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors font-medium flex items-center justify-between disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold">D. Confirm No Medicine</div>
                          <div className="text-[10px] text-amber-700">Non-medicinal document (Passed)</div>
                        </div>
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </button>

                      {/* Action E: Mark Prescription Unreadable */}
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickReviewDecision('Marked Prescription Unreadable', 'Marked Unreadable')
                        }
                        disabled={isSaving}
                        className="p-2 rounded-xl text-left bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors font-medium flex items-center justify-between disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold">E. Mark Unreadable</div>
                          <div className="text-[10px] text-slate-600">Illegible handwriting/bad image</div>
                        </div>
                        <AlertCircle className="w-4 h-4 text-slate-600" />
                      </button>

                      {/* Action F: Re-run AI Extraction */}
                      <button
                        type="button"
                        onClick={handleRunTest}
                        disabled={isRunningTest}
                        className="p-2 rounded-xl text-left bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors font-medium flex items-center justify-between disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold">F. Re-run Extraction</div>
                          <div className="text-[10px] text-teal-700">Execute pipeline afresh</div>
                        </div>
                        <Play className="w-4 h-4 text-teal-600 fill-current" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Review Status Verdict
                      </label>
                      <select
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Pending Review">Pending Review</option>
                        <option value="Passed">✓ Passed (Meets Accuracy Standard)</option>
                        <option value="Confirmed Correct">✓ Confirmed Correct (Verified by Reviewer)</option>
                        <option value="Partially Correct">⚠ Partially Correct (Minor Discrepancy)</option>
                        <option value="Failed">✗ Failed (Significant Error)</option>
                        <option value="Confirmed Incorrect">✗ Confirmed Incorrect (Reviewer Verified Failure)</option>
                        <option value="Confirmed No Medicine">○ Confirmed No Medicine (Non-medicinal document)</option>
                        <option value="Marked Unreadable">✕ Marked Unreadable (Quality/Handwriting issue)</option>
                        <option value="Needs Verification">? Needs Verification (Unclear / Ambiguous)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Image Difficulty Re-Categorization
                      </label>
                      <select
                        value={difficultyCategory}
                        onChange={(e) => setDifficultyCategory(e.target.value as DifficultyCategory)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Clear Printed">Clear Printed</option>
                        <option value="Clear Handwritten">Clear Handwritten</option>
                        <option value="Medium Handwritten">Medium Handwritten</option>
                        <option value="Difficult Handwritten">Difficult Handwritten</option>
                        <option value="Low Quality / Blurry">Low Quality / Blurry</option>
                        <option value="Mixed Prescription">Mixed Prescription</option>
                      </select>
                    </div>
                  </div>

                  {/* Detected Error Tags */}
                  {testCase.detectedErrors && testCase.detectedErrors.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Detected Error Classifications:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {testCase.detectedErrors.map((err, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            <Tag className="w-3 h-3 text-rose-500" /> {err}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviewer Notes Textarea */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reviewer Clinical Notes & Observations
                    </label>
                    <textarea
                      rows={3}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Enter specific notes on handwriting legibility, missed dosages, or edge cases..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveReview}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Review & Recalculate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};
