import { Moon, Sun, Globe, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { HorizontalLogo } from '../common/Logos';
import type { TranslationType } from '../../types/i18n';
import type { LangCode } from '../../hooks/useAppConfig';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: TranslationType;
}

export const Navbar = ({ theme, toggleTheme, lang, setLang, t }: NavbarProps) => {
  const { totalItems, openCart } = useCart();
  const location = useLocation();
  const isStorePage = location.pathname === '/vendas';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 border-b-2 ${
      theme === 'light' ? 'border-[#E0E0E0] bg-white/90 backdrop-blur-md' : 'border-[#333333] bg-black/90 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-1 flex items-center justify-between">
        
        {/* LOGO - Left Side */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center group cursor-pointer">
            <HorizontalLogo 
              theme={theme}
              className="w-32 md:w-44 transition-transform duration-500 group-hover:scale-105" 
            />
          </Link>
        </div>
        
        {/* LINKS - Perfect Center (Desktop) */}
        <div className="hidden md:flex justify-center space-x-4 lg:space-x-8 text-[10px] lg:text-xs uppercase tracking-widest font-light opacity-90">
          <a href="/#safrasense" className="hover:opacity-60 transition-opacity">{t.nav.product}</a>
          <a href="/#raiznet" className="hover:opacity-60 transition-opacity">{t.nav.network}</a>
          <a href="/#manifesto" className="hover:opacity-60 transition-opacity">{t.nav.manifesto}</a>
          <a href="/#waitlist" className="hover:opacity-60 transition-opacity">{t.nav.waitlist}</a>
          <a href="/#faq" className="hover:opacity-60 transition-opacity">{t.nav.faq}</a>
          <Link to="/vendas" className="hover:opacity-60 transition-opacity font-bold">{t.nav.store}</Link>
          <a href="#footer" className="hover:opacity-60 transition-opacity">{t.nav.contact}</a>
        </div>

        {/* MOBILE NAV - Center (Mobile Only) */}
        <div className="md:hidden flex-1 flex justify-center">
          <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
            theme === 'light' ? 'bg-black/5' : 'bg-white/5'
          }`}>
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium opacity-70">Menu</span>
            <svg className="w-2 h-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  if (e.target.value.startsWith('/')) {
                    window.location.href = e.target.value;
                  } else {
                    window.location.hash = e.target.value;
                  }
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              defaultValue=""
            >
              <option value="" disabled>Ir para...</option>
              <option value="/#safrasense">{t.nav.product}</option>
              <option value="/#raiznet">{t.nav.network}</option>
              <option value="/#manifesto">{t.nav.manifesto}</option>
              <option value="/#waitlist">{t.nav.waitlist}</option>
              <option value="/#faq">{t.nav.faq}</option>
              <option value="/vendas">{t.nav.store}</option>
              <option value="#footer">{t.nav.contact}</option>
            </select>
          </div>
        </div>

        {/* BUTTONS - Right Side */}
        <div className="flex-1 flex justify-end items-center space-x-3 text-current">
          <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all cursor-pointer group ${
            theme === 'light' 
              ? 'bg-white text-[#1A1A1A]' 
              : 'bg-black text-[#FAFAFA]'
          }`}>
            <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium">
              {lang}
            </span>
            <svg className="w-2 h-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>

            {/* Select visual */}
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as 'pt' | 'en' | 'es' | 'zh' | 'ja')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none text-center"
            >
              <option value="pt" className="bg-white dark:bg-black text-black dark:text-white">PT</option>
              <option value="en" className="bg-white dark:bg-black text-black dark:text-white">EN</option>
              <option value="es" className="bg-white dark:bg-black text-black dark:text-white">ES</option>
              <option value="zh" className="bg-white dark:bg-black text-black dark:text-white">ZH</option>
              <option value="ja" className="bg-white dark:bg-black text-black dark:text-white">JA</option>
            </select>
          </div>
          {isStorePage && (
            <button
              onClick={openCart}
              className="relative p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Carrinho"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              {totalItems > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black rounded-full flex items-center justify-center ${
                  theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                }`}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          )}
          <button onClick={toggleTheme} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Toggle Theme">
            {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>

      </div>
    </nav>
  );
};
