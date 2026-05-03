import { useState } from 'react';
import { Globe, Moon, Sun } from 'lucide-react';
import type { LangCode } from '../../hooks/useAppConfig';
import type { TranslationType } from '../../types/i18n';

interface AdminHeaderControlsProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: TranslationType;
}

export function AdminHeaderControls({
  theme,
  toggleTheme,
  lang,
  setLang,
  t,
}: AdminHeaderControlsProps) {
  const [langOpen, setLangOpen] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-3 text-current">
      <div className="relative">
        <button
          type="button"
          onClick={() => setLangOpen(open => !open)}
          aria-label={t.admin.common.selectLanguage}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-sm transition-all ${
            isDark ? 'bg-[#1C1C1C] hover:bg-[#242424]' : 'bg-white hover:bg-[#EFEFEF]'
          }`}
        >
          <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-60" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium">
            {lang}
          </span>
          <svg className={`w-2 h-2 opacity-40 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className={`absolute right-0 top-full mt-1 z-50 rounded-sm border overflow-hidden shadow-lg min-w-full ${
              isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'
            }`}>
              {(['pt', 'en', 'es', 'zh', 'ja'] as LangCode[]).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setLang(option); setLangOpen(false); }}
                  className={`block w-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium text-left transition-colors ${
                    option === lang
                      ? isDark ? 'bg-[#E0E0E0]/10' : 'bg-[#1D1D1D]/8'
                      : isDark ? 'hover:bg-[#E0E0E0]/5' : 'hover:bg-[#1D1D1D]/5'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={t.admin.common.toggleTheme}
        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
      </button>
    </div>
  );
}
