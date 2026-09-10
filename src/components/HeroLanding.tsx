import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileSearch,
  HelpCircle,
  Pill,
  Shield,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Upload,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroLandingProps {
  onStartSimplifying: () => void;
  onTryDemo: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onStartSimplifying, onTryDemo }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-teal-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 border border-teal-800/40 shadow-xl">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-800/60 border border-teal-600/40 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" /> {t('heroTag', 'Patient Health Empowerment')}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight text-center">
            {t('heroHeadline', 'Medical Prescription Simplifier')}
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-teal-100/90 font-light leading-relaxed text-center">
            {t('heroSubheadline', 'Understand your prescription in simple language.')}
          </p>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed text-center">
            {t('heroDescription', 'Transform confusing medical abbreviations, handwritten instructions, and complex medicine names into clear, transparent, and organized daily medication schedules.')}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              id="hero-simplify-btn"
              onClick={onStartSimplifying}
              className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Upload className="w-5 h-5" /> {t('simplifyPrescription', 'Simplify Prescription')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-demo-btn"
              onClick={onTryDemo}
              className="px-6 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-teal-200 border border-teal-700/50 font-semibold text-sm sm:text-base rounded-xl hover:border-teal-500/60 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-400" /> {t('tryDemo', 'Try Demo')}
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-10 pt-8 border-t border-slate-800/80 w-full grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('heroConfidenceRating', 'Confidence Rating')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('heroInteractionWarnings', 'Interaction Warnings')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('heroDoctorQuestions', 'Doctor Questions')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('heroLanguages', '6 Languages')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('howItWorksTitle', 'How It Works')}</h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            {t('howItWorksSubtitle', 'A safe, 5-step clinical workflow designed to prioritize transparency and patient safety.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            {
              step: '1',
              title: t('step1Title', '1. Upload or Enter'),
              desc: t('step1Desc', 'Upload a prescription photo, PDF, paste text, or use our manual entry form.'),
              icon: Upload,
              color: 'bg-teal-50 text-teal-700 border-teal-200',
            },
            {
              step: '2',
              title: t('step2Title', '2. AI & OCR Extraction'),
              desc: t('step2Desc', 'Vision and medical parsing extract drug names, doses, routes, and timing with confidence scores.'),
              icon: FileSearch,
              color: 'bg-blue-50 text-blue-700 border-blue-200',
            },
            {
              step: '3',
              title: t('step3Title', '3. Verify Details'),
              desc: t('step3Desc', 'Review and confirm the detected information against your physical prescription sheet.'),
              icon: Eye,
              color: 'bg-amber-50 text-amber-700 border-amber-200',
            },
            {
              step: '4',
              title: t('step4Title', '4. Safety Checks'),
              desc: t('step4Desc', 'Automated analysis checks for interactions, duplicate ingredients, and unclear dosage instructions.'),
              icon: ShieldAlert,
              color: 'bg-rose-50 text-rose-700 border-rose-200',
            },
            {
              step: '5',
              title: t('step5Title', '5. Simplified Guide'),
              desc: t('step5Desc', 'Receive morning-to-night timelines, plain-language explanations, and printable doctor questions.'),
              icon: BookCheck,
              color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-xl border flex flex-col items-center text-center relative ${item.color}`}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center font-bold text-sm mb-3">
                {item.step}
              </div>
              <item.icon className="w-6 h-6 mb-2" />
              <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Use It Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <BookCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('searchMedicalAbbreviations', 'Understand Medical Terminology')}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Translate confusing abbreviations like <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-xs">OD</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-xs">BID</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-xs">TDS</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-xs">AC</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono text-xs">PC</code> into simple daily language.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('filterByTiming', 'Organize Medicines & Timelines')}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            See which medicine to take with breakfast, after lunch, or at bedtime without ever altering your doctor&apos;s prescribed dose or duration.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('questionsHeader', 'Prepare Better Doctor Questions')}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Empower yourself with intelligent, relevant questions to bring directly to your next doctor or pharmacist appointment.
          </p>
        </div>
      </section>

      {/* Safety First & Educational Disclaimer Section */}
      <section className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-6 sm:p-8 text-amber-950">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-amber-950">
                {t('safeEducationalAssistant', 'Safety First — Educational Assistant Policy')}
              </h3>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Strict Protocol
              </span>
            </div>
            <p className="text-sm text-amber-900/90 leading-relaxed">
              <strong>{t('appName', 'Medical Prescription Simplifier')}</strong> is strictly an educational tool to help you understand your existing prescription. It <strong>never</strong> diagnoses diseases, prescribes medicines, recommends stopping treatments, or changes prescribed dosages.
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              If an extracted field is marked with low confidence or uncertainty, always verify with your pharmacist, nurse, or prescribing physician before taking your medication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
