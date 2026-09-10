import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { safeFetchJson } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'profile'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await safeFetchJson<{ user: UserProfile }>('/api/auth/demo-login', { method: 'POST' });
      if (res.ok && res.data?.user) {
        onLoginSuccess(res.data.user);
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to sign in to demo session');
      }
    } catch (e: any) {
      setErrorMessage('Failed to sign in to demo session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload: any = { email };

    if (mode === 'register') {
      payload.name = name || email.split('@')[0];
      payload.allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      payload.conditions = conditionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      payload.isPregnant = isPregnant;
    }

    try {
      const res = await safeFetchJson<{ user: UserProfile; error?: string }>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.data?.user) {
        throw new Error(res.error || 'Authentication failed');
      }

      onLoginSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5" /> Patient Identity & Profile
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {user ? 'Patient Profile' : mode === 'register' ? 'Create Health Account' : 'Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user
              ? 'Manage your health profile and personalized safety preferences.'
              : 'Save prescriptions, track medicines, and enable safety alerts.'}
          </p>
        </div>

        {/* 1-Click Demo Login */}
        {!user && (
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Instant Demo Login (No Password)</span>
          </button>
        )}

        {!user && (
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Or with Email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Known Drug Allergies (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chronic Health Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pregnant-checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="pregnant-checkbox" className="text-xs text-slate-700 font-medium">
                  Currently Pregnant or Breastfeeding (Enables extra drug cautions)
                </label>
              </div>
            </>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'register'
              ? 'Create Patient Account'
              : 'Sign In'}
          </button>
        </form>

        {!user && (
          <div className="text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
