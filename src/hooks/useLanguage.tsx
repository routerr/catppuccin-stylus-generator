import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadSettings, saveSettings } from '../utils/storage';
import { type AppLanguage, translate, type TranslationKey } from '../i18n';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const DEFAULT_LANGUAGE: AppLanguage = 'en';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function loadLanguage(): AppLanguage {
  const language = loadSettings().language;
  if (language && ['en', 'zh-TW', 'zh-CN', 'es', 'fr', 'ja'].includes(language)) {
    return language as AppLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(loadLanguage);

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    saveSettings({ language: next });
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
