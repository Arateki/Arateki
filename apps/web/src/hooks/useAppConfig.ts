import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { translations } from '../i18n/translations';
import type { TranslationType } from '../types/i18n';
import {
  DEFAULT_LANG,
  HTML_LANG,
  isLangCode,
  pickPreferredLang,
  SUPPORTED_LANGS,
  type LangCode,
} from '../lib/seo';

export type { LangCode };
export { SUPPORTED_LANGS };

export const useAppConfig = () => {
  const params = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const urlLang = isLangCode(params.lang) ? params.lang : null;

  const [storedLang, setStoredLang] = useState<LangCode>(() => pickPreferredLang());

  const lang = urlLang ?? storedLang;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('arateki-theme') : null;
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const t: TranslationType = translations[lang] ?? translations[DEFAULT_LANG];

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arateki-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arateki-lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = HTML_LANG[lang];
    }
  }, [lang]);

  const setLang = useCallback((newLang: LangCode) => {
    setStoredLang(newLang);

    if (urlLang) {
      const restOfPath = location.pathname.replace(/^\/(?:pt|en|es|zh|ja)/, '') || '/';
      const target = `/${newLang}${restOfPath === '/' ? '' : restOfPath}${location.search}${location.hash}`;
      navigate(target, { replace: true });
    }
  }, [urlLang, location.pathname, location.search, location.hash, navigate]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, lang, setLang, t, toggleTheme };
};
