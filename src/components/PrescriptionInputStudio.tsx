import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileCheck,
  FileCode,
  FileSearch,
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  Pill,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { Medicine, Prescription, SupportedLanguage } from '../types';
import { safeFetchJson } from '../utils/api';
import { SUPPORTED_LANGUAGES } from './Navbar';

interface PrescriptionInputStudioProps {
  onPrescriptionCreated: (rx: any) => void;
  onCancel: () => void;
}

const SAMPLE_PRESCRIPTIONS = [
  {
    title: 'Sample 1: Post-Surgery Care (Antibiotic + PPI + Pain)',
    text: `Rx:
1. Tab Pantocid (Pantoprazole) 40mg - 1 tab OD (AC) before breakfast x 7 days
2. Tab Augmentin 625mg (Amoxicillin + Clavulanate) - 1 tab BD (PC) after meals x 5 days
3. Tab Dolo 650mg (Paracetamol) - 1 tab SOS / PRN for pain or fever (max 3/day)`,
    desc: 'Demonstrates antibiotic course timing, acid reducer before meals, and as-needed fever relief.',
  },
  {
    title: 'Sample 2: Chronic Wellness (Diabetes + Blood Pressure + Statin)',
    text: `Rx:
1. Tab Glycomet (Metformin) 500mg - 1 tab BD with breakfast and dinner x 30 days
2. Tab Amlong (Amlodipine) 5mg - 1 tab OD morning x 30 days
3. Tab Atorva (Atorvastatin) 20mg - 1 tab HS (at bedtime) x 30 days
Note: Monitor fasting blood sugar weekly. Avoid grapefruit with statins.`,
    desc: 'Demonstrates morning vs bedtime scheduling, food guidelines, and ongoing chronic care precautions.',
  },
  {
    title: 'Sample 3: Acute Respiratory Infection (Azithromycin + Antihistamine)',
    text: `Rx:
1. Tab Azithral (Azithromycin) 500mg - 1 tab OD x 3 days
2. Tab Levocetirizine 5mg - 1 tab HS (at night) x 5 days
3. Syp Ascoril D (Cough syrup) - 10ml TDS x 5 days
Note: Levocetirizine may cause mild drowsiness. Take plenty of warm fluids.`,
    desc: 'Demonstrates 3-day short antibiotic regimen, evening antihistamine, and cough syrup frequency.',
  },
];

export const PrescriptionInputStudio: React.FC<PrescriptionInputStudioProps> = ({
  onPrescriptionCreated,
  onCancel,
}) => {
  const [inputMode, setInputMode] = useState<'image' | 'pdf' | 'manual' | 'text'>('image');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image / PDF state
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');

  // Text state
  const [pastedText, setPastedText] = useState('');

  // Manual form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDoctor, setManualDoctor] = useState('');
  const [manualClinic, setManualClinic] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualMedicines, setManualMedicines] = useState<
    {
      name: string;
      strength: string;
      dosage: string;
      frequency: string;
      route: string;
      duration: string;
      instructions: string;
      withFood: 'before_food' | 'with_food' | 'after_food' | 'empty_stomach' | 'unspecified';
      timingOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime' | 'as_needed' | 'unclear')[];
    }[]
  >([
    {
      name: '',
      strength: '',
      dosage: '1 tablet',
      frequency: 'Twice daily (BD)',
      route: 'Oral',
      duration: '5 days',
      instructions: 'Take after meals with water.',
      withFood: 'after_food',
      timingOfDay: ['morning', 'evening'],
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMimeType(file.type);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFilePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessUpload = async () => {
    if (isSubmittingRef.current || isProcessing) return;
    if (!filePreview && !pastedText && inputMode !== 'manual') {
      setErrorMessage('Please choose a file or enter prescription text first.');
      return;
    }

    isSubmittingRef.current = true;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (inputMode === 'manual') {
        const validMeds = manualMedicines.filter((m) => m.name.trim().length > 0);
        if (validMeds.length === 0) {
          setErrorMessage('Please enter at least one medicine name.');
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        setProcessingStep('Structuring prescription records...');
        const response = await safeFetchJson('/api/prescriptions/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: manualTitle || 'Manual Prescription Entry',
            doctorName: manualDoctor || undefined,
            clinicName: manualClinic || undefined,
            date: manualDate,
            medicines: validMeds,
          }),
        });

        if (!response.ok || !response.data) {
          throw new Error(response.error || 'Failed to save manual prescription');
        }

        onPrescriptionCreated(response.data);
        return;
      }

      // Image / PDF / Text Upload Mode
      setProcessingStep('Preprocessing image contrast & optical clarity...');
      let base64Data = '';
      if (filePreview) {
        const parts = filePreview.split(',');
        base64Data = parts[1] || parts[0];
      }

      const payload: any = {
        language: selectedLanguage,
        sourceType: inputMode,
      };

      if (inputMode === 'text') {
        payload.text = pastedText;
      } else if (filePreview) {
        payload.imageBase64 = base64Data;
        payload.mimeType = fileMimeType;
      }

      const stepTimer1 = setTimeout(() => {
        setProcessingStep('Extracting text via Google Cloud Vision API (Document & Handwriting OCR)...');
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setProcessingStep('Structuring medicines, strengths, dosages, and frequencies with Gemini AI...');
      }, 2000);

      const stepTimer3 = setTimeout(() => {
        setProcessingStep('Executing safety verification, interaction checks & duplicate detection...');
      }, 3500);

      const response = await safeFetchJson('/api/prescriptions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      console.log('Prescription API status:', response.status);
      console.log('Prescription API response:', response.raw || response.data || response.error);

      // Check HTTP status and success contract
      if (!response.ok || !response.data) {
        const errorMsg =
          response.error ||
          (response.raw && response.raw.error && response.raw.error.message) ||
          'Failed to analyze prescription.';
        throw new Error(errorMsg);
      }

      const raw = response.data;
      const prescriptionData: Prescription =
        raw?.data && Array.isArray(raw.data.medicines)
          ? raw.data
          : raw?.prescription && Array.isArray(raw.prescription.medicines)
          ? raw.prescription
          : raw?.medicines && Array.isArray(raw.medicines)
          ? raw
          : raw?.data
          ? raw.data
          : raw;

      console.log('Frontend parsed response:', {
        success: response.ok,
        medicineCount: prescriptionData?.medicines?.length || 0,
        hasSchedule: !!prescriptionData?.simplifiedSchedule,
        prescriptionId: prescriptionData?.id,
      });

      if (!prescriptionData?.medicines || prescriptionData.medicines.length === 0) {
        throw new Error('No medicine information could be reliably extracted from this prescription.');
      }

      onPrescriptionCreated(prescriptionData);
    } catch (err: any) {
      console.error('Prescription submission handler caught error:', err);
      const displayMsg =
        err?.message ||
        'Could not process prescription. Please verify the image is clear or use manual entry.';
      setErrorMessage(displayMsg);
    } finally {
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleAddMedicineRow = () => {
    setManualMedicines([
      ...manualMedicines,
      {
        name: '',
        strength: '',
        dosage: '1 tablet',
        frequency: 'Once daily (OD)',
        route: 'Oral',
        duration: '5 days',
        instructions: 'Take as directed with water.',
        withFood: 'after_food',
        timingOfDay: ['morning'],
      },
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setManualMedicines(manualMedicines.filter((_, i) => i !== index));
  };

  const handleApplySample = (sample: typeof SAMPLE_PRESCRIPTIONS[0]) => {
    setInputMode('text');
    setPastedText(sample.text);
    setManualTitle(sample.title.split(':')[1]?.trim() || sample.title);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Medical OCR & Simplifier
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Simplify Your Prescription</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose your preferred input method to extract, verify, and explain medical instructions safely.
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Explanation Language:</label>
          <select
            id="input-language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
        <button
          id="tab-input-image"
          onClick={() => setInputMode('image')}
          className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all ${
            inputMode === 'image'
              ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className={`w-5 h-5 ${inputMode === 'image' ? 'text-teal-600' : 'text-slate-400'}`} />
          <div>
            <span className="font-bold text-xs sm:text-sm block">1. Image Upload</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">JPG, PNG, WebP photo</span>
          </div>
        </button>

        <button
          id="tab-input-pdf"
          onClick={() => setInputMode('pdf')}
          className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all ${
            inputMode === 'pdf'
              ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileUp className={`w-5 h-5 ${inputMode === 'pdf' ? 'text-teal-600' : 'text-slate-400'}`} />
          <div>
            <span className="font-bold text-xs sm:text-sm block">2. PDF Document</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">E-Prescription document</span>
          </div>
        </button>

        <button
          id="tab-input-manual"
          onClick={() => setInputMode('manual')}
          className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all ${
            inputMode === 'manual'
              ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Pill className={`w-5 h-5 ${inputMode === 'manual' ? 'text-teal-600' : 'text-slate-400'}`} />
          <div>
            <span className="font-bold text-xs sm:text-sm block">3. Manual Entry</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">Type medicine details</span>
          </div>
        </button>

        <button
          id="tab-input-text"
          onClick={() => setInputMode('text')}
          className={`p-3.5 rounded-xl border text-left flex flex-col items-center sm:items-start gap-2 transition-all ${
            inputMode === 'text'
              ? 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className={`w-5 h-5 ${inputMode === 'text' ? 'text-teal-600' : 'text-slate-400'}`} />
          <div>
            <span className="font-bold text-xs sm:text-sm block">4. Paste Text</span>
            <span className="text-[11px] text-slate-500 hidden sm:block">Direct clinical notes</span>
          </div>
        </button>
      </div>

      {/* Pre-loaded Sample Prescriptions Loader */}
      <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quick-Test Preloaded Prescription Examples:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PRESCRIPTIONS.map((sample, i) => (
            <button
              key={i}
              id={`sample-rx-btn-${i}`}
              onClick={() => handleApplySample(sample)}
              className="text-left p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all text-xs group"
            >
              <span className="font-bold text-slate-900 group-hover:text-teal-800 block truncate">
                {sample.title}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{sample.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area Depending on Mode */}
      <div className="space-y-6">
        {/* A & B: Image or PDF Upload */}
        {(inputMode === 'image' || inputMode === 'pdf') && (
          <div>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative">
              <input
                id="prescription-file-input"
                type="file"
                accept={inputMode === 'pdf' ? '.pdf,application/pdf' : 'image/jpeg,image/png,image/webp'}
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {filePreview ? (
                <div className="space-y-3">
                  {fileMimeType.startsWith('image/') ? (
                    <img
                      src={filePreview}
                      alt="Prescription preview"
                      className="max-h-64 mx-auto rounded-lg shadow-xs border border-slate-200 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                  <p className="font-bold text-sm text-slate-800">{fileName}</p>
                  <p className="text-xs text-teal-600 font-semibold">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
                    {inputMode === 'image' ? <Camera className="w-7 h-7" /> : <FileUp className="w-7 h-7" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">
                      Drag & Drop prescription {inputMode === 'image' ? 'photo' : 'PDF'} here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      or click to browse from your device ({inputMode === 'image' ? 'JPG, PNG, WebP' : 'PDF'})
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    <Shield className="w-3 h-3 text-teal-600" /> Processed securely server-side
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* C: Manual Structured Entry Form */}
        {inputMode === 'manual' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prescription / Care Plan Title</label>
                <input
                  id="manual-title-input"
                  type="text"
                  placeholder="e.g. Post-Clinic Recovery Regimen"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prescribing Doctor (Optional)</label>
                <input
                  id="manual-doctor-input"
                  type="text"
                  placeholder="Dr. Name, MD"
                  value={manualDoctor}
                  onChange={(e) => setManualDoctor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prescription Date</label>
                <input
                  id="manual-date-input"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Medicine Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" /> Prescribed Medicines ({manualMedicines.length})
                </h3>
                <button
                  id="add-medicine-row-btn"
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              {manualMedicines.map((med, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-teal-900 bg-teal-50 px-2 py-0.5 rounded">
                      Medicine #{index + 1}
                    </span>
                    {manualMedicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Medicine Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin or Augmentin"
                        value={med.name}
                        onChange={(e) => {
                          const copy = [...manualMedicines];
                          copy[index].name = e.target.value;
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Strength</label>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg / 625 mg"
                        value={med.strength}
                        onChange={(e) => {
                          const copy = [...manualMedicines];
                          copy[index].strength = e.target.value;
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => {
                          const copy = [...manualMedicines];
                          const val = e.target.value;
                          copy[index].frequency = val;
                          if (val.includes('BD')) copy[index].timingOfDay = ['morning', 'evening'];
                          else if (val.includes('TDS')) copy[index].timingOfDay = ['morning', 'afternoon', 'evening'];
                          else if (val.includes('OD')) copy[index].timingOfDay = ['morning'];
                          else if (val.includes('SOS')) copy[index].timingOfDay = ['as_needed'];
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      >
                        <option value="Once daily (OD)">Once daily (OD) - Morning</option>
                        <option value="Twice daily (BD)">Twice daily (BD) - Morning & Night</option>
                        <option value="Three times daily (TDS)">Three times daily (TDS) - Morning, Noon, Night</option>
                        <option value="Four times daily (QID)">Four times daily (QID)</option>
                        <option value="At bedtime (HS)">At bedtime (HS)</option>
                        <option value="As needed (PRN / SOS)">As needed for symptoms (SOS)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Food Instructions</label>
                      <select
                        value={med.withFood}
                        onChange={(e: any) => {
                          const copy = [...manualMedicines];
                          copy[index].withFood = e.target.value;
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      >
                        <option value="after_food">Take after meals (PC)</option>
                        <option value="before_food">Take before meals / empty stomach (AC)</option>
                        <option value="with_food">Take with meal / food</option>
                        <option value="unspecified">As directed</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days, 1 month"
                        value={med.duration}
                        onChange={(e) => {
                          const copy = [...manualMedicines];
                          copy[index].duration = e.target.value;
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Route</label>
                      <select
                        value={med.route}
                        onChange={(e) => {
                          const copy = [...manualMedicines];
                          copy[index].route = e.target.value;
                          setManualMedicines(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      >
                        <option value="Oral">Oral (Swallow with water)</option>
                        <option value="Topical">Topical (Apply on skin)</option>
                        <option value="Inhalation">Inhalation (Inhaler)</option>
                        <option value="Drops">Eye/Ear/Nose Drops</option>
                        <option value="Sublingual">Sublingual (Under tongue)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* D: Text Paste Mode */}
        {inputMode === 'text' && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Paste Prescription or Clinical Text
            </label>
            <textarea
              id="prescription-text-paste"
              rows={6}
              placeholder="Paste doctor notes, e-prescription message, or medicine list here... (e.g. Tab Dolo 650 1 tab TDS, Tab Augmentin 625 1 tab BD x 5 days)"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                {errorMessage.includes('quota') ? 'Gemini API Limit' : 'Prescription Processing Notice'}
              </p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          {inputMode !== 'manual' && (
            <button
              type="button"
              onClick={() => {
                setInputMode('manual');
                setErrorMessage(null);
              }}
              className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Use Manual Entry Instead
            </button>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            id="start-simplification-btn"
            type="button"
            disabled={isProcessing}
            onClick={handleProcessUpload}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{processingStep || 'Processing Prescription...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract & Simplify Prescription</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
