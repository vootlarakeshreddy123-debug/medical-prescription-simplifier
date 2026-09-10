import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Edit2,
  Eye,
  FileCheck,
  HelpCircle,
  Pill,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ConfidenceLevel, Medicine, MedicineScheduleItem, Prescription } from '../types';
import { safeFetchJson } from '../utils/api';

interface PrescriptionConfidenceVerificationProps {
  prescription: Prescription;
  onConfirmVerification: (updatedPrescription: Prescription) => void;
  onBack: () => void;
}

export const PrescriptionConfidenceVerification: React.FC<
  PrescriptionConfidenceVerificationProps
> = ({ prescription, onConfirmVerification, onBack }) => {
  const [medicines, setMedicines] = useState<Medicine[]>(prescription.medicines);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getConfidenceBadge = (conf: ConfidenceLevel, fieldLabel: string) => {
    if (conf === 'high') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={`High confidence for ${fieldLabel}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> High
        </span>
      );
    }
    if (conf === 'medium') {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
          title={`Medium confidence for ${fieldLabel} - Please verify`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Verify
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
        title={`Low confidence for ${fieldLabel} - Hand-written or unclear`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Unclear / Edit
      </span>
    );
  };

  const handleFieldChange = (medId: string, field: keyof Medicine, value: any) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const updated = { ...m, [field]: value };
          // If edited by user, mark verified and bump confidence
          updated.userVerified = true;
          updated.confidence = { ...updated.confidence, overall: 'high' };
          return updated;
        }
        return m;
      })
    );
  };

  const handleToggleVerified = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, userVerified: !m.userVerified } : m))
    );
  };

  const handleSaveAndProceed = async () => {
    setIsSaving(true);
    try {
      const allVerifiedMeds = medicines.map((m) => ({ ...m, userVerified: true }));

      const morningList: MedicineScheduleItem[] = [];
      const afternoonList: MedicineScheduleItem[] = [];
      const eveningList: MedicineScheduleItem[] = [];
      const bedtimeList: MedicineScheduleItem[] = [];
      const asNeededList: MedicineScheduleItem[] = [];
      const unclearList: MedicineScheduleItem[] = [];

      for (const med of allVerifiedMeds) {
        const item: MedicineScheduleItem = {
          medicineId: med.id,
          medicineName: med.name,
          strength: med.strength,
          dose: med.dosage,
          route: med.route,
          instructions: med.instructions,
          withFoodNotes:
            med.withFood === 'before_food'
              ? 'Take before food (empty stomach)'
              : med.withFood === 'with_food' || med.withFood === 'after_food'
              ? 'Take with or after food'
              : 'Follow package guidance',
          duration: med.duration,
          timingCategory: 'morning',
        };

        const timing = Array.isArray(med.timingOfDay) ? med.timingOfDay : [];
        if (timing.includes('morning')) morningList.push({ ...item, timingCategory: 'morning' });
        if (timing.includes('afternoon')) afternoonList.push({ ...item, timingCategory: 'afternoon' });
        if (timing.includes('evening')) eveningList.push({ ...item, timingCategory: 'evening' });
        if (timing.includes('bedtime')) bedtimeList.push({ ...item, timingCategory: 'bedtime' });
        if (timing.includes('as_needed')) asNeededList.push({ ...item, timingCategory: 'as_needed' });
        if (
          timing.includes('unclear') ||
          (!timing.includes('morning') &&
            !timing.includes('afternoon') &&
            !timing.includes('evening') &&
            !timing.includes('bedtime') &&
            !timing.includes('as_needed'))
        ) {
          unclearList.push({ ...item, timingCategory: 'unclear' });
        }
      }

      const updatedRx: Prescription = {
        ...prescription,
        medicines: allVerifiedMeds,
        simplifiedSchedule: {
          morning: morningList,
          afternoon: afternoonList,
          evening: eveningList,
          bedtime: bedtimeList,
          asNeeded: asNeededList,
          unclear: unclearList,
        },
        status: 'verified',
        overallConfidence: 'high',
        updatedAt: new Date().toISOString(),
      };

      const response = await safeFetchJson<Prescription>(`/api/prescriptions/${prescription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRx),
      });

      if (response.ok && response.data) {
        onConfirmVerification(response.data);
      } else {
        onConfirmVerification(updatedRx);
      }
    } catch (e) {
      console.error(e);
      onConfirmVerification({ ...prescription, medicines });
    } finally {
      setIsSaving(false);
    }
  };

  const allVerified = medicines.every((m) => m.userVerified);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Verification Safety Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-amber-950 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-amber-950">
                Detected Information — Step 2: Patient Verification
              </h2>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                Overall AI Confidence: {prescription.confidenceScore}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/90 font-medium leading-relaxed">
              <strong>Please verify that these details match your original prescription sheet or bottle.</strong>
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              If the AI/OCR was uncertain about a medicine name, dosage, or frequency, it is highlighted below with a yellow or red badge. You can edit any field directly before proceeding to the simplified guide.
            </p>
          </div>
        </div>
      </div>

      {/* Extracted Original Context (if image exists) */}
      {prescription.imageUrl && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={prescription.imageUrl}
              alt="Prescription source"
              className="w-16 h-16 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Original Prescription Document</p>
              <p className="text-[11px] text-slate-500">
                Uploaded {new Date(prescription.createdAt).toLocaleDateString()} • Comparing against extracted OCR data
              </p>
            </div>
          </div>
          <a
            href={prescription.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
          >
            View Full Size Photo
          </a>
        </div>
      )}

      {/* Medicine Verification Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" /> Extracted Medicines ({medicines.length})
          </h3>
          <span className="text-xs text-slate-500">
            {medicines.filter((m) => m.userVerified).length} of {medicines.length} verified
          </span>
        </div>

        {medicines.map((med, index) => {
          const isEditing = editingMedId === med.id;
          const isLowOverall = med.confidence.overall === 'low';

          return (
            <div
              key={med.id}
              id={`verification-card-${med.id}`}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                med.userVerified
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : isLowOverall
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-bold text-base text-slate-900">{med.name}</h4>
                  {getConfidenceBadge(med.confidence.name, 'Medicine Name')}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMedId(isEditing ? null : med.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Close Edit' : 'Edit Fields'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVerified(med.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      med.userVerified
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {med.userVerified ? 'Verified by You' : 'Mark as Correct'}
                  </button>
                </div>
              </div>

              {/* Editable Fields Mode */}
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleFieldChange(med.id, 'name', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Strength</label>
                    <input
                      type="text"
                      value={med.strength}
                      onChange={(e) => handleFieldChange(med.id, 'strength', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Dose & Quantity</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleFieldChange(med.id, 'dosage', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleFieldChange(med.id, 'frequency', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Duration</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleFieldChange(med.id, 'duration', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Route & Food Timing</label>
                    <select
                      value={med.withFood || 'unspecified'}
                      onChange={(e: any) => handleFieldChange(med.id, 'withFood', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="before_food">Before food (empty stomach)</option>
                      <option value="with_food">With meals</option>
                      <option value="after_food">After meals</option>
                      <option value="unspecified">As directed</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Read-Only Grid with Field Badges */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold mb-1">
                      <span>Strength</span>
                      {getConfidenceBadge(med.confidence.strength, 'Strength')}
                    </div>
                    <p className="font-bold text-slate-800">{med.strength}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold mb-1">
                      <span>Dose</span>
                      {getConfidenceBadge(med.confidence.dosage, 'Dose')}
                    </div>
                    <p className="font-bold text-slate-800">{med.dosage}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold mb-1">
                      <span>Frequency</span>
                      {getConfidenceBadge(med.confidence.frequency, 'Frequency')}
                    </div>
                    <p className="font-bold text-slate-800">{med.frequency}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold mb-1">
                      <span>Duration</span>
                      {getConfidenceBadge(med.confidence.duration, 'Duration')}
                    </div>
                    <p className="font-bold text-slate-800">{med.duration}</p>
                  </div>
                </div>
              )}

              {/* Plain language note */}
              {med.instructions && (
                <p className="mt-2.5 text-xs text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-100">
                  <strong className="text-slate-700">Instructions:</strong> {med.instructions}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation CTA Footer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
        >
          ← Back to Inputs
        </button>

        <button
          id="confirm-verification-btn"
          type="button"
          disabled={isSaving}
          onClick={handleSaveAndProceed}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          <span>Confirm Details & Open Simplified Guide</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
