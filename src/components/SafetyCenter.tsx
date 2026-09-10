import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Pill,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { DrugInteraction, Prescription } from '../types';
import { safeFetchJson } from '../utils/api';

interface SafetyCenterProps {
  prescriptions: Prescription[];
  onSelectPrescription: (rx: Prescription) => void;
}

export const SafetyCenter: React.FC<SafetyCenterProps> = ({
  prescriptions,
  onSelectPrescription,
}) => {
  // Custom interactive interaction checker
  const [medList, setMedList] = useState<string[]>(['Amoxicillin', 'Pantoprazole']);
  const [newMedInput, setNewMedInput] = useState('');
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleAddMed = () => {
    if (newMedInput.trim() && !medList.includes(newMedInput.trim())) {
      setMedList([...medList, newMedInput.trim()]);
      setNewMedInput('');
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedList(medList.filter((_, i) => i !== index));
  };

  const handleCheckInteractions = async () => {
    if (medList.length < 2) return;
    setIsChecking(true);
    try {
      const response = await safeFetchJson('/api/interactions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: medList }),
      });
      if (response.ok && response.data) {
        setInteractionResult(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  // Collect all flagged safety findings from prescriptions
  const allFindings = prescriptions.flatMap((p) =>
    p.safetyFindings.map((f) => ({ finding: f, prescription: p }))
  );
  const allInteractions = prescriptions.flatMap((p) =>
    p.interactions.map((i) => ({ interaction: i, prescription: p }))
  );
  const allDuplicates = prescriptions.flatMap((p) =>
    p.duplicateDetections.map((d) => ({ duplicate: d, prescription: p }))
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
          <ShieldAlert className="w-4 h-4" /> Comprehensive Patient Safety Guard
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Safety & Interaction Center</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Monitor potential drug interactions, avoid double-dosing the same active ingredient, and identify symptoms requiring immediate medical evaluation.
        </p>
      </div>

      {/* Interactive Drug Interaction Checker Tool */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" /> Interactive Drug Interaction Checker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Test any combination of medicines, pain relievers, or antibiotics to screen for known interactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[240px] flex items-center gap-2">
            <input
              id="interaction-med-input"
              type="text"
              placeholder="Add medicine name (e.g. Paracetamol, Ibuprofen, Atorvastatin, Metformin)..."
              value={newMedInput}
              onChange={(e) => setNewMedInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMed();
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <button
              id="add-interaction-med-btn"
              onClick={handleAddMed}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            id="run-interaction-check-btn"
            disabled={medList.length < 2 || isChecking}
            onClick={handleCheckInteractions}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isChecking ? 'Checking...' : `Check ${medList.length} Medicines`}</span>
          </button>
        </div>

        {/* Selected Medicines Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {medList.map((m, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold border border-slate-200"
            >
              <Pill className="w-3 h-3 text-teal-600" /> {m}
              <button
                onClick={() => handleRemoveMed(i)}
                className="text-slate-400 hover:text-rose-600 ml-1"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Result Area */}
        {interactionResult && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {interactionResult.interactionsFound === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">No High-Risk Interactions Found</p>
                  <p className="text-emerald-900/80 mt-0.5">{interactionResult.disclaimer}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {interactionResult.interactions.map((int: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">
                        Interaction: {int.medicineA} + {int.medicineB}
                      </strong>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded">
                        Severity: {int.severity}
                      </span>
                    </div>
                    <p>{int.description}</p>
                    <p className="font-bold text-amber-900">Advice: {int.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flagged Alerts across Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duplicate Ingredient Detections */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Overlapping Active Ingredients
            </h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {allDuplicates.length} found
            </span>
          </div>

          {allDuplicates.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No overlapping active ingredients detected across your prescriptions.
            </p>
          ) : (
            allDuplicates.map(({ duplicate, prescription }, idx) => (
              <div key={idx} className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-amber-950">Active Ingredient: {duplicate.activeIngredient}</strong>
                  <span className="text-[10px] font-bold text-amber-800">Caution</span>
                </div>
                <p className="text-amber-900">{duplicate.warning}</p>
                <p className="text-slate-500 text-[11px]">Present in: {duplicate.medicines.join(', ')}</p>
              </div>
            ))
          )}
        </div>

        {/* Prescription Red Flag Cautions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" /> General Clinical Cautions
            </h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {allFindings.length} alerts
            </span>
          </div>

          {allFindings.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No safety cautions flagged for your current records.
            </p>
          ) : (
            allFindings.map(({ finding, prescription }, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <strong className="text-slate-900 block">{finding.title}</strong>
                <p className="text-slate-600 leading-relaxed">{finding.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Critical Red Flag Emergency Warning Protocol */}
      <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 sm:p-8 text-rose-950 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-rose-950">Emergency & Urgent Care Guidance</h3>
        </div>
        <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
          If you experience sudden severe shortness of breath, swelling of the face/lips/throat, severe chest pain, extreme dizziness, or sudden skin blistering after taking any medication, <strong>seek emergency medical assistance immediately</strong>.
        </p>
      </div>
    </div>
  );
};
