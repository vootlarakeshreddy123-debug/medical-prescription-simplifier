import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Key,
  Lock,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { safeFetchJson } from '../utils/api';

interface PrivacyCenterProps {
  onDataPurged: () => void;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ onDataPurged }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await safeFetchJson('/api/privacy/export');
      if (response.ok && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical_prescriptions_export_${Date.now()}.json`;
        a.click();
      }
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeData = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all your prescription records? This action cannot be undone.')) {
      return;
    }

    setIsPurging(true);
    try {
      const response = await safeFetchJson('/api/privacy/purge', { method: 'DELETE' });
      if (response.ok) {
        setPurgeSuccess(true);
        onDataPurged();
        setTimeout(() => setPurgeSuccess(false), 4000);
      }
    } catch (e) {
      console.error('Purge error:', e);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
          <Lock className="w-3.5 h-3.5" /> Data Security & Patient Sovereignty
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Privacy & Data Protection</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          You have complete ownership and control over all extracted medical data, uploaded images, and medication schedules.
        </p>
      </div>

      {/* Privacy Commitments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Zero Public AI Training</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your prescription uploads are parsed transiently and securely on the backend. Personal health data is never sold or used for public AI training.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Server-Side Secret Isolation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI credentials and medical reasoning algorithms are locked behind strict server endpoints. No secrets are ever exposed to the client browser.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Instant Export & Erasure</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Download your full health record in open standard JSON format or perform a one-click permanent erasure at any time.
          </p>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Your Data Controls</h2>

        <div className="divide-y divide-slate-100">
          {/* Export */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className="text-sm text-slate-900 block">Export All Data (JSON)</strong>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a complete copy of all your prescriptions, schedules, and safety records.
              </p>
            </div>
            <button
              id="export-data-btn"
              disabled={isExporting}
              onClick={handleExportData}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Purge / Delete */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className="text-sm text-rose-900 block">Permanently Purge All Data</strong>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently delete all stored prescriptions and medication history from the database.
              </p>
            </div>
            <button
              id="purge-data-btn"
              disabled={isPurging}
              onClick={handlePurgeData}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? 'Purging...' : 'Purge All Records'}</span>
            </button>
          </div>
        </div>

        {purgeSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            All personal prescription records have been permanently purged.
          </div>
        )}
      </div>
    </div>
  );
};
