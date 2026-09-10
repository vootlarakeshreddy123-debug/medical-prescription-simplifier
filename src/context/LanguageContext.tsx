import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { SupportedLanguage, Prescription } from '../types';
import { TranslationDictionary, UI_TRANSLATIONS, getTranslation } from '../utils/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
  dict: TranslationDictionary;
  getCachedPrescription: (rxId: string, lang: SupportedLanguage) => Prescription | undefined;
  setCachedPrescription: (rxId: string, lang: SupportedLanguage, rx: Prescription) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'rx_selected_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
      if (saved && ['en', 'te', 'hi', 'ta', 'kn', 'ml'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  // Client-side cache for translated dynamic prescriptions
  const prescriptionCache = useRef<Record<string, Prescription>>({});

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    return getTranslation(language, key) || fallback || String(key);
  };

  const getCachedPrescription = (rxId: string, lang: SupportedLanguage): Prescription | undefined => {
    return prescriptionCache.current[`${rxId}_${lang}`];
  };

  const setCachedPrescription = (rxId: string, lang: SupportedLanguage, rx: Prescription) => {
    prescriptionCache.current[`${rxId}_${lang}`] = rx;
  };

  const dict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dict,
        getCachedPrescription,
        setCachedPrescription,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
