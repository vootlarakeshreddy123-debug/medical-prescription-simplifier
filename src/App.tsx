import React, { useEffect, useState } from 'react';
import { AbbreviationTranslator } from './components/AbbreviationTranslator';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { DashboardOverview } from './components/DashboardOverview';
import { HeroLanding } from './components/HeroLanding';
import { MedicationCabinet } from './components/MedicationCabinet';
import { Navbar } from './components/Navbar';
import { PrescriptionConfidenceVerification } from './components/PrescriptionConfidenceVerification';
import { PrescriptionDeepDive } from './components/PrescriptionDeepDive';
import { PrescriptionInputStudio } from './components/PrescriptionInputStudio';
import { PrivacyCenter } from './components/PrivacyCenter';
import { SafetyCenter } from './components/SafetyCenter';
import { TestingDashboard } from './components/testing/TestingDashboard';
import { Prescription, SupportedLanguage, UserProfile } from './types';
import { safeFetchJson } from './utils/api';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [verifyingPrescription, setVerifyingPrescription] = useState<Prescription | null>(null);
  const [simpleMode, setSimpleMode] = useState<boolean>(false);
  const { language: globalLanguage, setLanguage: setGlobalLanguage, t } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial user & prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await safeFetchJson<Prescription[]>('/api/prescriptions');
      if (res.ok && Array.isArray(res.data)) {
        setPrescriptions(res.data);
        // If demo was already pre-loaded and no selected prescription, select the first one
        if (res.data.length > 0 && !selectedPrescription) {
          setSelectedPrescription(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initAuthAndData = async () => {
    setIsLoading(true);
    try {
      const authRes = await safeFetchJson<{ user: UserProfile }>('/api/auth/me');
      if (authRes.ok && authRes.data?.user) {
        setUser(authRes.data.user);
      } else {
        // Auto sign into demo user for seamless instant preview
        const demoRes = await safeFetchJson<{ user: UserProfile }>('/api/auth/demo-login', { method: 'POST' });
        if (demoRes.ok && demoRes.data?.user) {
          setUser(demoRes.data.user);
        }
      }
      await fetchPrescriptions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuthAndData();
  }, []);

  // Handle Loading Demo Prescription
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson<Prescription>('/api/prescriptions/demo', { method: 'POST' });
      if (res.ok && res.data) {
        await fetchPrescriptions();
        setSelectedPrescription(res.data);
        setActiveTab('deepdive');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler when a prescription is extracted
  const handlePrescriptionCreated = (newRx: Prescription) => {
    setPrescriptions((prev) => [newRx, ...prev.filter((p) => p.id !== newRx.id)]);
    setVerifyingPrescription(newRx);
    setActiveTab('verify');
  };

  // Handler when user confirms details in verification screen
  const handleConfirmVerification = (updatedRx: Prescription) => {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === updatedRx.id ? updatedRx : p))
    );
    setSelectedPrescription(updatedRx);
    setVerifyingPrescription(null);
    setActiveTab('deepdive');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 antialiased ${simpleMode ? 'simple-mode' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard') {
            setVerifyingPrescription(null);
          }
        }}
        user={user}
        simpleMode={simpleMode}
        setSimpleMode={setSimpleMode}
        language={globalLanguage}
        setLanguage={setGlobalLanguage}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLoadDemo={handleLoadDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <HeroLanding
              onStartSimplifying={() => setActiveTab('simplify')}
              onTryDemo={handleLoadDemo}
            />

            <DashboardOverview
              prescriptions={prescriptions}
              onSelectPrescription={(rx) => {
                setSelectedPrescription(rx);
                setActiveTab('deepdive');
              }}
              onNewPrescription={() => setActiveTab('simplify')}
              onManualEntry={() => setActiveTab('simplify')}
              onOpenCabinet={() => setActiveTab('cabinet')}
              onOpenSafety={() => setActiveTab('safety')}
              onOpenAbbreviations={() => setActiveTab('abbreviations')}
              onLoadDemo={handleLoadDemo}
            />
          </div>
        )}

        {/* Prescription Input Studio */}
        {activeTab === 'simplify' && (
          <PrescriptionInputStudio
            onPrescriptionCreated={handlePrescriptionCreated}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {/* Field-by-Field Confidence Verification */}
        {activeTab === 'verify' && verifyingPrescription && (
          <PrescriptionConfidenceVerification
            prescription={verifyingPrescription}
            onConfirmVerification={handleConfirmVerification}
            onBack={() => setActiveTab('simplify')}
          />
        )}

        {/* Deep Dive Simplified Analysis View */}
        {activeTab === 'deepdive' && selectedPrescription && (
          <PrescriptionDeepDive
            prescription={selectedPrescription}
            onBack={() => setActiveTab('dashboard')}
            onUpdatePrescription={(updated) => {
              setSelectedPrescription(updated);
              setPrescriptions((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
              );
            }}
            simpleMode={simpleMode}
          />
        )}

        {/* Medication Cabinet */}
        {activeTab === 'cabinet' && (
          <MedicationCabinet
            prescriptions={prescriptions}
            onSelectPrescription={(rx) => {
              setSelectedPrescription(rx);
              setActiveTab('deepdive');
            }}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h1 className="text-2xl font-bold text-slate-900">Prescription Archive & History</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                All simplified prescriptions and caregiver guides stored securely.
              </p>
            </div>
            <DashboardOverview
              prescriptions={prescriptions}
              onSelectPrescription={(rx) => {
                setSelectedPrescription(rx);
                setActiveTab('deepdive');
              }}
              onNewPrescription={() => setActiveTab('simplify')}
              onManualEntry={() => setActiveTab('simplify')}
              onOpenCabinet={() => setActiveTab('cabinet')}
              onOpenSafety={() => setActiveTab('safety')}
              onOpenAbbreviations={() => setActiveTab('abbreviations')}
              onLoadDemo={handleLoadDemo}
            />
          </div>
        )}

        {/* Safety Center */}
        {activeTab === 'safety' && (
          <SafetyCenter
            prescriptions={prescriptions}
            onSelectPrescription={(rx) => {
              setSelectedPrescription(rx);
              setActiveTab('deepdive');
            }}
          />
        )}

        {/* Abbreviation Translator */}
        {activeTab === 'abbreviations' && <AbbreviationTranslator />}

        {/* Privacy & Data Rights */}
        {activeTab === 'privacy' && (
          <PrivacyCenter
            onDataPurged={() => {
              setPrescriptions([]);
              setSelectedPrescription(null);
            }}
          />
        )}

        {/* Admin Telemetry */}
        {activeTab === 'admin' && <AdminDashboard />}

        {/* Prescription Testing & Accuracy Evaluation Dashboard */}
        {activeTab === 'testing' && <TestingDashboard />}
      </main>

      {/* Global Safety Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500 text-center space-y-2 no-print">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Medical Prescription Simplifier — An Intelligent Patient Education & Safety System
          </p>
          <p className="text-[11px] text-slate-400">
            Disclaimer: This application provides educational information to assist patients in understanding their prescribed medications. It does not provide medical diagnoses, alter treatments, or substitute for the clinical judgment of a licensed healthcare professional. Always consult your doctor or pharmacist regarding your medication regimen.
          </p>
        </div>
      </footer>

      {/* Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          fetchPrescriptions();
        }}
      />
    </div>
  );
}
