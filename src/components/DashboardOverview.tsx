import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus,
  FileText,
  HelpCircle,
  Pill,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Prescription } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DashboardOverviewProps {
  prescriptions: Prescription[];
  onSelectPrescription: (rx: Prescription) => void;
  onNewPrescription: () => void;
  onManualEntry: () => void;
  onOpenCabinet: () => void;
  onOpenSafety: () => void;
  onOpenAbbreviations: () => void;
  onLoadDemo: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  prescriptions,
  onSelectPrescription,
  onNewPrescription,
  onManualEntry,
  onOpenCabinet,
  onOpenSafety,
  onOpenAbbreviations,
  onLoadDemo,
}) => {
  const { t } = useLanguage();

  // Aggregate stats
  const totalPrescriptions = prescriptions.length;
  const activeMedicinesCount = prescriptions.reduce((acc, p) => acc + p.medicines.length, 0);
  const potentialWarningsCount = prescriptions.reduce(
    (acc, p) => acc + p.safetyFindings.length + p.interactions.length + p.duplicateDetections.length,
    0
  );
  const unclearCount = prescriptions.reduce((acc, p) => {
    const hasUnclear =
      p.overallConfidence === 'low' ||
      p.medicines.some((m) => m.confidence.overall === 'low' || !m.userVerified);
    return acc + (hasUnclear ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prescriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('totalPrescriptions', 'Total Prescriptions')}</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalPrescriptions}</p>
            <p className="text-xs text-slate-500 mt-1">Saved in secure storage</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Active Medicines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('activeMedicines', 'Active Medicines')}</p>
            <p className="text-2xl font-extrabold text-teal-700 mt-1">{activeMedicinesCount}</p>
            <p className="text-xs text-slate-500 mt-1">Across all care regimens</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        {/* Safety & Interaction Warnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('safetyCautions', 'Safety Cautions')}</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{potentialWarningsCount}</p>
            <p className="text-xs text-slate-500 mt-1">Interaction & duplicate checks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Unclear Instructions / Needs Verification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('needsVerification', 'Needs Verification')}</p>
            <p className={`text-2xl font-extrabold mt-1 ${unclearCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {unclearCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {unclearCount > 0 ? t('verificationRequiredNotice', 'Review marked fields') : t('allClearNotice', 'All items verified')}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              unclearCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {unclearCount > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Quick Action Bento Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" /> {t('quickActions', 'Quick Healthcare Actions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            id="action-upload-rx"
            onClick={onNewPrescription}
            className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <Upload className="w-6 h-6 mb-3 text-teal-100 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('uploadNewPrescription', 'Upload Photo / PDF')}</p>
              <p className="text-[11px] text-teal-100 mt-0.5">Instant OCR</p>
            </div>
          </button>

          <button
            id="action-manual-rx"
            onClick={onManualEntry}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <FilePlus className="w-6 h-6 mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('manualPrescriptionEntry', 'Enter Manually')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Structured form</p>
            </div>
          </button>

          <button
            id="action-view-cabinet"
            onClick={onOpenCabinet}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <Pill className="w-6 h-6 mb-3 text-teal-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('browseMedicineCabinet', 'Medication Cabinet')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Organizer</p>
            </div>
          </button>

          <button
            id="action-view-safety"
            onClick={onOpenSafety}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <ShieldAlert className="w-6 h-6 mb-3 text-amber-500 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('exploreSafetyGuide', 'Safety Center')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Interactions & alerts</p>
            </div>
          </button>

          <button
            id="action-abbreviations"
            onClick={onOpenAbbreviations}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <BookOpen className="w-6 h-6 mb-3 text-indigo-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('searchMedicalAbbreviations', 'Abbreviation Guide')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">OD, BD, TDS, AC...</p>
            </div>
          </button>

          <button
            id="action-try-demo"
            onClick={onLoadDemo}
            className="p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl shadow-xs transition-all text-left flex flex-col justify-between group"
          >
            <Sparkles className="w-6 h-6 mb-3 text-amber-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-sm">{t('loadSamplePrescription', 'Load Demo Rx')}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Instant test data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Prescriptions List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('recentPrescriptions', 'Your Prescriptions')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any prescription to view its simplified guide, schedule, and safety checks.</p>
          </div>
          <button
            onClick={onNewPrescription}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FilePlus className="w-4 h-4" /> {t('uploadNewPrescription', 'New Prescription')}
          </button>
        </div>

        {prescriptions.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('noPrescriptionsYet', 'No Prescriptions Added Yet')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {t('noPrescriptionsSub', 'Upload a prescription photo, enter medicine details manually, or try our interactive demo dataset to get started.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onNewPrescription}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> {t('simplifyPrescription', 'Upload Prescription')}
              </button>
              <button
                onClick={onLoadDemo}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600" /> {t('tryDemo', 'Try Demo Record')}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prescriptions.map((rx) => {
              const hasAlerts =
                rx.safetyFindings.length > 0 || rx.interactions.length > 0 || rx.duplicateDetections.length > 0;
              const hasLowConfidence =
                rx.overallConfidence === 'low' || rx.medicines.some((m) => m.confidence.overall === 'low');

              return (
                <div
                  key={rx.id}
                  id={`prescription-card-${rx.id}`}
                  onClick={() => onSelectPrescription(rx)}
                  className="py-4 hover:bg-slate-50/80 rounded-xl px-3 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                        {rx.title}
                      </span>
                      {rx.sourceType === 'demo' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                          DEMO DATA — NOT A REAL PRESCRIPTION
                        </span>
                      )}

                      {/* Confidence Score Pill */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                          rx.overallConfidence === 'high'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rx.overallConfidence === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rx.overallConfidence === 'high' ? '🟢' : rx.overallConfidence === 'medium' ? '🟡' : '🔴'}{' '}
                        {rx.confidenceScore}% {t('confidence', 'Confidence')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {rx.date}
                      </span>
                      {rx.doctorName && (
                        <span>• {t('prescriber', 'Doctor')}: <strong className="text-slate-700">{rx.doctorName}</strong></span>
                      )}
                      <span>
                        • <strong>{rx.medicines.length}</strong> {t('myMedicines', 'medicine(s)')}
                      </span>
                    </div>

                    {/* Quick Medicines Preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rx.medicines.slice(0, 4).map((med, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
                        >
                          {med.name} ({med.strength})
                        </span>
                      ))}
                      {rx.medicines.length > 4 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{rx.medicines.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Alerts */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {hasAlerts && (
                      <span
                        className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold flex items-center gap-1"
                        title="Safety findings or potential interactions detected"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {t('safetyCautions', 'Caution Flagged')}
                      </span>
                    )}

                    {hasLowConfidence && (
                      <span
                        className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1"
                        title="Some fields could not be read with high certainty"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-500" /> {t('needsVerification', 'Verify Details')}
                      </span>
                    )}

                    <button
                      id={`view-prescription-${rx.id}`}
                      className="px-3 py-1.5 bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <span>{t('viewDetails', 'View & Simplify')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
