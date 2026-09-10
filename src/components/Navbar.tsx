import React from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  FileText,
  FlaskConical,
  HeartPulse,
  Home,
  Languages,
  Layers,
  Lock,
  MessageSquareText,
  Pill,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { LanguageOption, SupportedLanguage, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  simpleMode: boolean;
  setSimpleMode: (val: boolean) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onOpenAuth: () => void;
  onLoadDemo: () => void;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  simpleMode,
  setSimpleMode,
  language,
  setLanguage,
  onOpenAuth,
  onLoadDemo,
}) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      {/* Top Banner for Patient Safety & Simple Mode toggle */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
            <Shield className="w-3 h-3" /> {t('safeEducationalAssistant', 'Safe Educational Assistant')}
          </span>
          <span className="hidden sm:inline text-slate-300">
            {t('safetyBannerText', 'Does not replace a doctor or pharmacist • Always verify prescription details')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Simple Mode Toggle */}
          <button
            id="toggle-simple-mode-btn"
            onClick={() => setSimpleMode(!simpleMode)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              simpleMode
                ? 'bg-amber-400 text-amber-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Simple Mode with larger text and high readability for elderly patients"
          >
            <span>{simpleMode ? t('simpleModeOn', '★ Simple Mode: ON') : t('simpleModeOff', '☆ Simple Mode')}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-teal-400" />
            <select
              id="global-language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-slate-800 text-slate-200 text-xs rounded-md px-2 py-0.5 border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-400 cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                {t('appName', 'Medical Prescription Simplifier')}
              </span>
              <p className="text-xs text-slate-500 font-medium">{t('appSubtitle', 'Clear • Safe • Patient-Friendly')}</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" /> {t('dashboard', 'Dashboard')}
            </button>

            <button
              id="nav-simplify"
              onClick={() => setActiveTab('simplify')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'simplify'
                  ? 'bg-teal-600 text-white shadow-xs font-semibold'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <Sparkles className="w-4 h-4" /> {t('simplifyPrescription', 'Simplify Prescription')}
            </button>

            <button
              id="nav-cabinet"
              onClick={() => setActiveTab('cabinet')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'cabinet'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Pill className="w-4 h-4" /> {t('myMedicines', 'My Medicines')}
            </button>

            <button
              id="nav-history"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" /> {t('history', 'History')}
            </button>

            <button
              id="nav-safety"
              onClick={() => setActiveTab('safety')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'safety'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {t('safetyCenter', 'Safety Center')}
            </button>

            <button
              id="nav-abbreviations"
              onClick={() => setActiveTab('abbreviations')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'abbreviations'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" /> {t('abbreviations', 'Medical Terms')}
            </button>

            <button
              id="nav-privacy"
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Lock className="w-4 h-4" /> {t('privacyRights', 'Privacy')}
            </button>

            {/* Developer Testing & Accuracy Evaluation Dashboard */}
            <button
              id="nav-testing"
              onClick={() => setActiveTab('testing')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'testing'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                  : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/60 font-medium'
              }`}
              title="Prescription Testing & Accuracy Evaluation Dashboard (Developer Testing Mode)"
            >
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <span>Testing</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                Dev
              </span>
            </button>
          </nav>

          {/* User Controls & Demo Actions */}
          <div className="flex items-center gap-2">
            <button
              id="quick-demo-btn"
              onClick={onLoadDemo}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> {t('tryDemo', 'Try Demo')}
            </button>

            {user ? (
              <div
                id="user-profile-badge"
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-800 cursor-pointer font-medium border border-slate-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name}</span>
              </div>
            ) : (
              <button
                id="login-register-btn"
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <User className="w-3.5 h-3.5" /> {t('signIn', 'Sign In')}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 gap-1 border-t border-slate-100 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'dashboard' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('dashboard', 'Dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('simplify')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'simplify' ? 'bg-teal-600 text-white' : 'text-teal-800 bg-teal-50'
            }`}
          >
            + {t('simplifyPrescription', 'Simplify')}
          </button>
          <button
            onClick={() => setActiveTab('cabinet')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'cabinet' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('myMedicines', 'Medicines')}
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'safety' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('safetyCenter', 'Safety')}
          </button>
          <button
            onClick={() => setActiveTab('abbreviations')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'abbreviations' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('abbreviations', 'Abbreviations')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'history' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('history', 'History')}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium ${
              activeTab === 'admin' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            {t('adminTelemetry', 'Admin')}
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-bold flex items-center gap-1 ${
              activeTab === 'testing' ? 'bg-indigo-700 text-white' : 'text-indigo-700 bg-indigo-50 border border-indigo-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Testing
          </button>
        </div>
      </div>
    </header>
  );
};
