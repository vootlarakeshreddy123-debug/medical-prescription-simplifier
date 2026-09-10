import React, { useEffect, useState, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns,
  Copy,
  Download,
  FileCheck,
  FileDown,
  HelpCircle,
  Info,
  Languages,
  Layers,
  MessageSquare,
  Moon,
  Pill,
  Printer,
  RotateCcw,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  User,
} from 'lucide-react';
import {
  ChatMessage,
  DrugInteraction,
  DuplicateDetection,
  Medicine,
  MedicineScheduleItem,
  Prescription,
  SafetyFinding,
  SupportedLanguage,
} from '../types';
import { safeFetchJson } from '../utils/api';
import { SUPPORTED_LANGUAGES } from './Navbar';
import { useLanguage } from '../context/LanguageContext';

interface PrescriptionDeepDiveProps {
  prescription: Prescription;
  onBack: () => void;
  onUpdatePrescription: (rx: Prescription) => void;
  simpleMode: boolean;
}

export const PrescriptionDeepDive: React.FC<PrescriptionDeepDiveProps> = ({
  prescription,
  onBack,
  onUpdatePrescription,
  simpleMode,
}) => {
  const { language: globalLanguage, setLanguage: setGlobalLanguage, t, getCachedPrescription, setCachedPrescription } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    | 'schedule'
    | 'medicines'
    | 'side_effects'
    | 'interactions'
    | 'safety'
    | 'questions'
    | 'chat'
    | 'compare'
    | 'report'
  >('schedule');

  // Translation state
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(
    globalLanguage || prescription.language || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Client-side translation cache for zero-latency language switching
  const translationCache = useRef<Record<string, Prescription>>({
    [prescription.language || 'en']: prescription,
  });

  // Compare medicines state
  const [compareMedA, setCompareMedA] = useState<string>(prescription.medicines[0]?.id || '');
  const [compareMedB, setCompareMedB] = useState<string>(prescription.medicines[1]?.id || prescription.medicines[0]?.id || '');

  // Support safe extraction of medicines and schedule regardless of data wrapping
  const rawPrescription: any = prescription || {};
  const currentData = rawPrescription.data || rawPrescription.prescription || rawPrescription;
  const medicinesList: Medicine[] = Array.isArray(currentData?.medicines)
    ? currentData.medicines
    : Array.isArray(rawPrescription?.medicines)
    ? rawPrescription.medicines
    : [];

  const schedule = useMemo(() => {
    const rawSched = currentData?.simplifiedSchedule || rawPrescription?.simplifiedSchedule;
    const hasExistingItems =
      (rawSched?.morning?.length || 0) +
      (rawSched?.afternoon?.length || 0) +
      (rawSched?.evening?.length || 0) +
      (rawSched?.bedtime?.length || 0) +
      (rawSched?.asNeeded?.length || 0) +
      (rawSched?.unclear?.length || 0) > 0;

    if (hasExistingItems && rawSched) {
      return {
        morning: rawSched.morning || [],
        afternoon: rawSched.afternoon || [],
        evening: rawSched.evening || [],
        bedtime: rawSched.bedtime || [],
        asNeeded: rawSched.asNeeded || [],
        unclear: rawSched.unclear || [],
      };
    }

    // Reconstruct accurately if schedule was empty or not populated
    const morningList: MedicineScheduleItem[] = [];
    const afternoonList: MedicineScheduleItem[] = [];
    const eveningList: MedicineScheduleItem[] = [];
    const bedtimeList: MedicineScheduleItem[] = [];
    const asNeededList: MedicineScheduleItem[] = [];
    const unclearList: MedicineScheduleItem[] = [];

    for (const med of medicinesList) {
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

    return {
      morning: morningList,
      afternoon: afternoonList,
      evening: eveningList,
      bedtime: bedtimeList,
      asNeeded: asNeededList,
      unclear: unclearList,
    };
  }, [currentData, rawPrescription, medicinesList]);

  useEffect(() => {
    console.log('Schedule medicines:', {
      morning: schedule.morning.length,
      afternoon: schedule.afternoon.length,
      evening: schedule.evening.length,
      bedtime: schedule.bedtime.length,
      asNeeded: schedule.asNeeded.length,
      unclear: schedule.unclear.length,
      totalMedicines: medicinesList.length,
    });
  }, [schedule, medicinesList.length]);

  // Load chat messages on mount
  useEffect(() => {
    safeFetchJson<ChatMessage[]>(`/api/prescriptions/${prescription.id}/chat`)
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setChatMessages(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, [prescription.id]);

  // Handle translation
  const handleTranslate = async (lang: SupportedLanguage) => {
    if (isTranslating || lang === targetLanguage) return;
    setTargetLanguage(lang);
    setGlobalLanguage(lang);

    // Instant switch if cached in memory or shared context cache
    const cachedLocal = translationCache.current[lang];
    const cachedContext = getCachedPrescription(prescription.id, lang);
    const cached = cachedLocal || cachedContext;

    if (cached) {
      translationCache.current[lang] = cached;
      setCachedPrescription(prescription.id, lang, cached);
      onUpdatePrescription(cached);
      return;
    }

    if (lang === prescription.language) return;

    setIsTranslating(true);
    try {
      const response = await safeFetchJson<{ prescription: Prescription; scheduleNotes: any }>(
        `/api/prescriptions/${prescription.id}/translate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetLanguage: lang }),
        }
      );

      if (response.ok && response.data?.prescription) {
        translationCache.current[lang] = response.data.prescription;
        setCachedPrescription(prescription.id, lang, response.data.prescription);
        onUpdatePrescription(response.data.prescription);
      }
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  // Sync with global navbar language changes
  useEffect(() => {
    if (globalLanguage && globalLanguage !== targetLanguage) {
      handleTranslate(globalLanguage);
    }
  }, [globalLanguage]);

  // Handle Send Chat
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || userInput;
    if (!text.trim() || isChatLoading) return;

    setUserInput('');
    setIsChatLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      prescriptionId: prescription.id,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await safeFetchJson<ChatMessage>(
        `/api/prescriptions/${prescription.id}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, language: targetLanguage }),
        }
      );

      if (response.ok && response.data) {
        setChatMessages((prev) => [...prev, response.data!]);
      } else {
        const errorMsg = response.error || 'Failed to process message';
        setChatMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            prescriptionId: prescription.id,
            sender: 'assistant',
            text: errorMsg.includes('quota')
              ? 'Gemini API quota has been reached. Please try again later or check your Gemini API quota.'
              : `Notice: ${errorMsg}. Please try asking your question again in a moment.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (e: any) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          prescriptionId: prescription.id,
          sender: 'assistant',
          text: 'Unable to reach the assistant right now. Please try again shortly.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate & Download Patient Friendly PDF Report
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header styling
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Prescription Simplifier — Patient Guide', 14, 16);

    // Metadata
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let y = 36;
    doc.text(`Prescription Title: ${prescription.title}`, 14, y);
    y += 6;
    doc.text(`Date: ${prescription.date}  |  Doctor: ${prescription.doctorName || 'Not specified'}`, 14, y);
    y += 6;
    doc.text(`Patient Safety Status: Verified with ${prescription.confidenceScore}% Confidence`, 14, y);
    y += 10;

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, pageWidth - 28, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Plain Language Overview:', 18, y + 2);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(prescription.simplifiedSummary, pageWidth - 36);
    doc.text(splitSummary, 18, y + 8);
    y += 28;

    // Prescribed Medicines Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Prescribed Medications & Schedules:', 14, y);
    y += 8;

    prescription.medicines.forEach((med, i) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${med.name} (${med.strength})`, 16, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`   • Frequency: ${med.frequency}  |  Duration: ${med.duration}  |  Route: ${med.route}`, 16, y);
      y += 5;
      doc.text(`   • Instructions: ${med.instructions}`, 16, y);
      y += 7;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Recommended Questions for Doctor / Pharmacist:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    prescription.questionsForDoctor.forEach((q) => {
      doc.text(`• ${q}`, 16, y);
      y += 5;
    });

    // Disclaimer footer
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Disclaimer: Educational reference only. Always confirm medication dosage with your doctor or pharmacist.',
      14,
      y
    );

    doc.save(`Prescription_Guide_${prescription.date}.pdf`);
  };

  const handleCopyQuestions = () => {
    const text = prescription.questionsForDoctor.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            id="back-to-dashboard-btn"
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{prescription.title}</h1>
              {prescription.sourceType === 'demo' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Date: <strong>{prescription.date}</strong></span>
              {prescription.doctorName && <span>• Prescriber: <strong>{prescription.doctorName}</strong></span>}
              <span>• Overall Confidence: <strong>{prescription.confidenceScore}%</strong></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Languages className="w-4 h-4 text-teal-600" />
            <select
              id="deepdive-language-select"
              value={targetLanguage}
              onChange={(e) => handleTranslate(e.target.value as SupportedLanguage)}
              disabled={isTranslating}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <button
            id="print-report-btn"
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>

          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar no-print">
        {[
          { id: 'schedule', label: '1. Daily Timeline', icon: Clock },
          { id: 'medicines', label: '2. Medicine Cards', icon: Pill },
          { id: 'side_effects', label: '3. Side-Effects', icon: AlertCircle },
          { id: 'interactions', label: '4. Interactions & Duplicates', icon: ShieldAlert },
          { id: 'safety', label: '5. Safety Center', icon: Shield },
          { id: 'questions', label: '6. Doctor Questions', icon: HelpCircle },
          { id: 'chat', label: '7. Ask AI Assistant', icon: MessageSquare },
          { id: 'compare', label: '8. Compare Meds', icon: Columns },
          { id: 'report', label: '9. Summary Report', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-deepdive-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Educational Summary Callout */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-teal-600" /> Simplified Patient Overview
        </div>
        <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
          {prescription.simplifiedSummary}
        </p>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: DAILY SCHEDULE & VISUAL TIMELINE */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong>Strict Schedule Reorganization:</strong> This view organizes the explicit instructions already on your prescription into morning, afternoon, evening, and bedtime routines. It <strong>never</strong> alters your doctor&apos;s prescribed dose or frequency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Morning */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Sunrise className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Morning</h3>
                      <p className="text-[10px] text-slate-500">With or before breakfast</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {schedule.morning.length} med(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {schedule.morning.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No morning medicines prescribed.</p>
                  ) : (
                    schedule.morning.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.instructions}</p>
                        <span className="inline-block text-[10px] font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                          {item.withFoodNotes}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Afternoon */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Afternoon</h3>
                      <p className="text-[10px] text-slate-500">Midday / Lunch</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {schedule.afternoon.length} med(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {schedule.afternoon.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No afternoon medicines prescribed.</p>
                  ) : (
                    schedule.afternoon.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.instructions}</p>
                        <span className="inline-block text-[10px] font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                          {item.withFoodNotes}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Evening */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                      <Sunset className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Evening / Dinner</h3>
                      <p className="text-[10px] text-slate-500">Around dinner time</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {schedule.evening.length} med(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {schedule.evening.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No evening medicines prescribed.</p>
                  ) : (
                    schedule.evening.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.instructions}</p>
                        <span className="inline-block text-[10px] font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                          {item.withFoodNotes}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bedtime */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Bedtime</h3>
                      <p className="text-[10px] text-slate-500">Before sleeping / Night</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {schedule.bedtime.length} med(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {schedule.bedtime.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No bedtime medicines prescribed.</p>
                  ) : (
                    schedule.bedtime.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.instructions}</p>
                        <span className="inline-block text-[10px] font-medium bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
                          {item.duration}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* As Needed / SOS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">As Needed (SOS)</h3>
                      <p className="text-[10px] text-slate-500">Only when symptoms occur</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {schedule.asNeeded.length} med(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {schedule.asNeeded.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No SOS medicines prescribed.</p>
                  ) : (
                    schedule.asNeeded.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.instructions}</p>
                        <span className="inline-block text-[10px] font-medium bg-purple-50 text-purple-800 px-2 py-0.5 rounded">
                          {item.duration}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Unclear / Specific Instructions (Preserving doctor's original wording) */}
            {schedule.unclear.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-3 xl:col-span-5">
                <div>
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Specific / Timing as Prescribed</h3>
                        <p className="text-[10px] text-slate-500">Doctor did not specify a morning/afternoon/evening routine</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      {schedule.unclear.length} med(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {schedule.unclear.map((item, idx) => (
                      <div key={idx} className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{item.medicineName}</strong>
                          <span className="text-teal-700 font-semibold">{item.dose}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium">
                          <strong>Instruction:</strong> {item.instructions}
                        </p>
                        <span className="inline-block text-[10px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          {item.duration || 'Follow doctor guidance'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: INDIVIDUAL MEDICINE CARDS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'medicines' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescription.medicines.map((med, idx) => (
              <div
                key={med.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Medicine Name & Category */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                        Medicine #{idx + 1}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{med.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Generic: {med.genericName} • Strength: <strong>{med.strength}</strong>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                      Verified
                    </span>
                  </div>

                  {/* Section A: What Your Prescription Says (Prescription Extraction) */}
                  <div className="mt-4 p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2">
                    <div className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-teal-600" /> Prescribed Doctor Instructions
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Frequency:</span>
                        <strong className="text-slate-800">{med.frequency}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Duration:</span>
                        <strong className="text-slate-800">{med.duration}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Route:</span>
                        <strong className="text-slate-800">{med.route}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Food Timing:</span>
                        <strong className="text-slate-800">
                          {med.withFood === 'before_food'
                            ? 'Before meals'
                            : med.withFood === 'after_food'
                            ? 'After meals'
                            : 'With or after meals'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Section B: General Educational Information */}
                  {med.educationalInfo && (
                    <div className="mt-4 space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block">What is it generally used for?</span>
                        <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5">
                          {med.educationalInfo.commonUses.map((u, i) => (
                            <li key={i}>{u}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 block">How it works (Simple language):</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          {med.educationalInfo.howItWorksSimple}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px]">Administration Advice:</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{med.educationalInfo.administrationAdvice}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: SIDE-EFFECT EXPLAINER (Common vs Important vs Urgent) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'side_effects' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700">
            Side effects are categorized to help you understand what is normal versus symptoms that require prompt medical care. <strong>Do not stop prescribed medications without consulting your doctor.</strong>
          </div>

          <div className="space-y-6">
            {prescription.medicines.map((med) => {
              const info = med.educationalInfo?.sideEffects;
              return (
                <div key={med.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-base text-slate-900">
                      {med.name} ({med.strength})
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">Generic: {med.genericName}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Common / Mild */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                          1. Common Effects
                        </h4>
                      </div>
                      <p className="text-[11px] text-emerald-900/80">Usually mild and temporary as your body adapts.</p>
                      <ul className="list-disc list-inside text-xs text-emerald-950 space-y-1 pt-1 font-medium">
                        {(info?.common || ['Mild digestive upset', 'Drowsiness or fatigue']).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Important / Discuss with Doctor */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                          2. Important to Monitor
                        </h4>
                      </div>
                      <p className="text-[11px] text-amber-900/80">Discuss with your healthcare professional if persistent.</p>
                      <ul className="list-disc list-inside text-xs text-amber-950 space-y-1 pt-1 font-medium">
                        {(info?.important || ['Persistent nausea or diarrhea', 'Mild skin itching']).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Urgent / Seek Care */}
                    <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <h4 className="font-bold text-xs text-rose-950 uppercase tracking-wider">
                          3. Urgent Warning Signs
                        </h4>
                      </div>
                      <p className="text-[11px] text-rose-900/80">Require immediate medical attention.</p>
                      <ul className="list-disc list-inside text-xs text-rose-950 space-y-1 pt-1 font-medium">
                        {(info?.urgent || [
                          'Severe allergic reaction (swelling of face, lips, tongue)',
                          'Breathing difficulty or sudden chest tightness',
                        ]).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: DRUG INTERACTIONS & DUPLICATE DETECTION */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'interactions' && (
        <div className="space-y-6">
          {/* Explainable AI Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> Explainable Safety Analysis Engine
            </div>
            <h3 className="text-lg font-bold">Drug Interaction & Duplicate Ingredient Screen</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              We check every medication combination against known pharmacological databases. We also look for overlapping active ingredients hidden behind different brand names.
            </p>
          </div>

          {/* Duplicate Ingredient Detections */}
          {prescription.duplicateDetections.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Overlapping / Duplicate Ingredients Flagged
              </h3>
              {prescription.duplicateDetections.map((dup, i) => (
                <div key={i} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base">
                      Possible Duplicate Active Ingredient: <strong>{dup.activeIngredient}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-xs font-bold">
                      Caution
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">{dup.warning}</p>
                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs">
                    <strong>Medicines involved:</strong> {dup.medicines.join(' and ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Duplicate Ingredients Identified</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                None of your prescribed medicines appear to contain the exact same active pharmaceutical ingredient.
              </p>
            </div>
          )}

          {/* Drug Interactions */}
          {prescription.interactions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Potential Drug Interactions Checked
              </h3>
              {prescription.interactions.map((int) => (
                <div key={int.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">
                      {int.medicineA} + {int.medicineB}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        int.severity === 'major'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Severity: {int.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{int.description}</p>
                  {int.mechanism && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg font-mono">
                      Mechanism: {int.mechanism}
                    </p>
                  )}
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs text-teal-900">
                    <strong>What should you do?</strong> {int.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Known Severe Interactions Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No high-risk drug-to-drug interactions were identified between your prescribed medications. Always inform your doctor of any herbal or over-the-counter supplements you take.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: SAFETY CENTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" /> Comprehensive Prescription Safety Scan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated clinical check of dosage safety, duration guidelines, and patient alert flags.
              </p>
            </div>

            <div className="space-y-4">
              {prescription.safetyFindings.map((finding) => (
                <div
                  key={finding.id}
                  className={`p-5 rounded-2xl border ${
                    finding.severity === 'critical'
                      ? 'bg-rose-50/70 border-rose-200'
                      : finding.severity === 'warning'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-blue-50/70 border-blue-200'
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{finding.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{finding.description}</p>

                  {finding.explainability && (
                    <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <p><strong>Why was this flagged?</strong> {finding.explainability.why}</p>
                      <p className="text-teal-800 font-semibold">
                        <strong>Recommended Action:</strong> {finding.explainability.whatShouldYouDo}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: AI-GENERATED DOCTOR QUESTIONS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
                <HelpCircle className="w-3.5 h-3.5" /> High-Value Patient Questions
              </div>
              <h3 className="text-xl font-bold text-slate-900">Questions to Ask Your Doctor or Pharmacist</h3>
              <p className="text-xs text-slate-500 mt-1">
                Generated specifically from your prescription details, timing requirements, and precautions.
              </p>
            </div>

            <button
              id="copy-questions-btn"
              onClick={handleCopyQuestions}
              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-4 h-4" /> {copiedQuestions ? 'Copied to Clipboard!' : 'Copy Questions'}
            </button>
          </div>

          <div className="space-y-3">
            {prescription.questionsForDoctor.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/40 border border-slate-200 transition-colors flex items-start gap-3.5"
              >
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Tip: You can print this guide or take a screenshot to bring directly to your pharmacy counter or doctor consultation!
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 7: "ASK MY PRESCRIPTION" AI CHAT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ask My Prescription AI</h3>
                <p className="text-[11px] text-teal-200">
                  Strictly grounded in your current prescription & trusted medical principles
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">
              Safe Assistant Mode
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {msg.safetyNotice && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-amber-800 font-medium">
                        🛡️ {msg.safetyNotice}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pl-11">
                <span className="animate-pulse">Consulting prescription details...</span>
              </div>
            )}
          </div>

          {/* Quick Suggested Chips */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Quick Ask:</span>
            {[
              'What does BD mean?',
              'Should I take these before or after meals?',
              'What should I do if I miss a dose?',
              'Are there any duplicate medicines?',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              id="prescription-chat-input"
              type="text"
              placeholder="Ask anything about this prescription... (e.g. What does BID mean? Why take with food?)"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            <button
              id="send-chat-btn"
              onClick={() => handleSendMessage()}
              disabled={isChatLoading || !userInput.trim()}
              className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 8: MEDICINE COMPARISON TOOL */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'compare' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Compare Prescribed Medicines</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any two medicines from this prescription to review purpose, administration, and precautions side-by-side.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Medicine A:</label>
              <select
                value={compareMedA}
                onChange={(e) => setCompareMedA(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {prescription.medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.strength})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Medicine B:</label>
              <select
                value={compareMedB}
                onChange={(e) => setCompareMedB(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                {prescription.medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.strength})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix */}
          {(() => {
            const medA = prescription.medicines.find((m) => m.id === compareMedA);
            const medB = prescription.medicines.find((m) => m.id === compareMedB);
            if (!medA || !medB) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                {/* Med A Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs font-extrabold text-teal-800 uppercase">Option A</span>
                    <h4 className="text-lg font-bold text-slate-900">{medA.name}</h4>
                    <p className="text-xs text-slate-500">Generic: {medA.genericName}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p><strong>Strength:</strong> {medA.strength}</p>
                    <p><strong>Frequency:</strong> {medA.frequency}</p>
                    <p><strong>Route:</strong> {medA.route}</p>
                    <p><strong>Food:</strong> {medA.withFood || 'As directed'}</p>
                    <p><strong>Category:</strong> {medA.educationalInfo?.category || 'Prescription medication'}</p>
                    <p><strong>Common Uses:</strong> {medA.educationalInfo?.commonUses.join(', ') || 'As prescribed'}</p>
                  </div>
                </div>

                {/* Med B Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-xs font-extrabold text-blue-800 uppercase">Option B</span>
                    <h4 className="text-lg font-bold text-slate-900">{medB.name}</h4>
                    <p className="text-xs text-slate-500">Generic: {medB.genericName}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p><strong>Strength:</strong> {medB.strength}</p>
                    <p><strong>Frequency:</strong> {medB.frequency}</p>
                    <p><strong>Route:</strong> {medB.route}</p>
                    <p><strong>Food:</strong> {medB.withFood || 'As directed'}</p>
                    <p><strong>Category:</strong> {medB.educationalInfo?.category || 'Prescription medication'}</p>
                    <p><strong>Common Uses:</strong> {medB.educationalInfo?.commonUses.join(', ') || 'As prescribed'}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 9: PATIENT SUMMARY REPORT (Printable / Shareable) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6 print-card">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Prescription Understanding Report
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{prescription.title}</h2>
              <p className="text-xs text-slate-500">
                Prescription Date: {prescription.date} • Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                {prescription.confidenceScore}% High Confidence
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs sm:text-sm text-slate-800">
            <strong className="text-teal-900 block mb-1">Summary for Patient & Caregiver:</strong>
            {prescription.simplifiedSummary}
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-3">Prescribed Medications:</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {prescription.medicines.map((m, i) => (
                <div key={i} className="p-4 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-slate-900 text-sm">{m.name} ({m.strength})</strong>
                    <p className="text-slate-600 mt-0.5">{m.instructions}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-bold text-teal-800">{m.frequency}</span>
                    <p className="text-slate-500 text-[11px]">{m.duration} • {m.route}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">Questions to Discuss with Pharmacist:</h3>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {prescription.questionsForDoctor.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between no-print">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
