import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../lib/types';
import { messages, type MessageKey } from './messages';

const LANGUAGE_KEY = 'km-exam:language';
const supportedLanguages: readonly Language[] = ['de', 'en', 'fr', 'it', 'es'];

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (supportedLanguages.includes(saved as Language)) return saved as Language;
  } catch {
    // Continue with the browser language when storage is unavailable.
  }
  const browserLanguage = typeof navigator === 'undefined' ? '' : navigator.language.split('-')[0].toLowerCase();
  return supportedLanguages.includes(browserLanguage as Language) ? browserLanguage as Language : 'de';
}

function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(params[key] ?? match));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    updateLanguage(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    } catch {
      // The language still changes for this page view if storage is unavailable.
    }
  }, []);

  const t = useCallback((key: MessageKey, params?: Record<string, string | number>) => {
    return interpolate(messages[language][key], params);
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = messages[language]['app.title'];
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}