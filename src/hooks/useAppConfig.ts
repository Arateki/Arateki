import { useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import type { TranslationType } from '../types/i18n';

const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'] as const;
export type LangCode = typeof SUPPORTED_LANGS[number];

export const useAppConfig = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('arateki-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [lang, setLang] = useState<LangCode>(() => {
    const saved = localStorage.getItem('arateki-lang') as LangCode;
    if (SUPPORTED_LANGS.includes(saved as LangCode)) return saved as LangCode;

    const sysLang = navigator.language.split('-')[0] as LangCode;
    return SUPPORTED_LANGS.includes(sysLang) ? sysLang : 'en';
  });

  const t: TranslationType = translations[lang];

  useEffect(() => {
    localStorage.setItem('arateki-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('arateki-lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return { theme, lang, setLang, t, toggleTheme };
};
