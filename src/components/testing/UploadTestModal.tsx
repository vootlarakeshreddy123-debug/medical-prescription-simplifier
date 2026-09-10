import React, { useState } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  FileImage,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DifficultyCategory, ExpectedMedicine } from '../../testingTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadTestModal: React.FC<Props> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [difficultyCategory, setDifficultyCategory] = useState<DifficultyCategory>('Clear Printed');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; base64: string; size: string }[]>([]);
  const [expectedMedicines, setExpectedMedicines] = useState<ExpectedMedicine[]>([
    {
      id: 'exp_1',
      name: '',
      dose: '',
      frequency: '',
      timing: '',
      duration: '',
      instructions: '',
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    (Array.from(files) as File[]).forEach((file: File) => {
      // Validate file type: JPG, JPEG, PNG, WebP
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Only JPG, JPEG, PNG, and WebP images are supported.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            base64,
            size: (file.size / 1024).toFixed(1) + ' KB',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddMedicine = () => {
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

  const handleRemoveMedicine = (id: string) => {
    setExpectedMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMedicine = (id: string, field: keyof ExpectedMedicine, value: string) => {
    setExpectedMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one prescription image for testing.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Clean valid expected medicines
      const validExpected = expectedMedicines.filter((m) => m.name.trim().length > 0);

      const items = selectedFiles.map((file, idx) => ({
        imageName: file.name,
        imageBase64: file.base64,
        difficultyCategory,
        // If single upload, associate entered expected medicines
        expectedMedicines: idx === 0 && validExpected.length > 0 ? validExpected : [],
      }));

      const res = await fetch('/api/testing/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload test images');
      }

      onUploadSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Upload Prescription Test Images</h2>
              <p className="text-xs text-slate-500">
                Add test cases to evaluate accuracy and extraction reliability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Privacy & Safety Warning Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Privacy & Medical Testing Notice:</p>
              <p>
                Use only authorized, public, synthetic, or properly de-identified prescription images for testing. Do not upload private patient information without appropriate authorization.
              </p>
              <p className="text-[11px] text-amber-700 italic">
                Note: Uploading test images does NOT train Gemini or alter the underlying AI model. It measures accuracy for application evaluation.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Difficulty Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Image Difficulty Category
            </label>
            <select
              value={difficultyCategory}
              onChange={(e) => setDifficultyCategory(e.target.value as DifficultyCategory)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="Clear Printed">Clear Printed (Electronic / Typed Print)</option>
              <option value="Clear Handwritten">Clear Handwritten (Neat Doctor Cursive)</option>
              <option value="Medium Handwritten">Medium Handwritten (Average Clinical Script)</option>
              <option value="Difficult Handwritten">Difficult Handwritten (Rushed / Faint Ink)</option>
              <option value="Low Quality / Blurry">Low Quality / Blurry (Shadows, Defocus, Mobile Angle)</option>
              <option value="Mixed Prescription">Mixed Prescription (Combination formulations)</option>
            </select>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Prescription Images (JPG, JPEG, PNG, WebP) — Select One or Multiple
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-teal-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Click or drag and drop prescription images here
                </p>
                <p className="text-[11px] text-slate-500">
                  Support individual or batch testing images up to 200 files
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-slate-600">
                  Selected Images ({selectedFiles.length}):
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileImage className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional Ground Truth: Expected Prescription Information */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Expected Prescription Ground Truth (Optional)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter known correct answers now or later in the Test Details view.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {expectedMedicines.map((med, idx) => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Medicine #{idx + 1}</span>
                    {expectedMedicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin"
                        value={med.name}
                        onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Dose / Strength
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg"
                        value={med.dose}
                        onChange={(e) => handleUpdateMedicine(med.id, 'dose', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Frequency
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Twice daily (1-0-1)"
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Timing
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. After food"
                        value={med.timing}
                        onChange={(e) => handleUpdateMedicine(med.id, 'timing', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedicine(med.id, 'duration', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. With full glass of water"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(med.id, 'instructions', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading Test Images...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Save {selectedFiles.length} Test Case(s)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
