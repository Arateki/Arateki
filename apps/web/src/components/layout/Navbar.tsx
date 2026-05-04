import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Globe, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { HorizontalLogo } from '../common/Logos';
import type { TranslationType } from '../../types/i18n';
import type { LangCode } from '../../hooks/useAppConfig';
import { useCart } from '../../context/useCart';

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
  const isStorePage = location.pathname === '/sales';
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const navItems = useMemo(() => [
    { key: 'safrasense', href: '/#safrasense', label: t.nav.product, sectionId: 'safrasense' },
    { key: 'raiznet', href: '/#raiznet', label: t.nav.network, sectionId: 'raiznet' },
    { key: 'manifesto', href: '/#manifesto', label: t.nav.manifesto, sectionId: 'manifesto' },
    { key: 'waitlist', href: '/#waitlist', label: t.nav.waitlist, sectionId: 'waitlist' },
    { key: 'faq', href: '/#faq', label: t.nav.faq, sectionId: 'faq' },
    { key: 'store', href: '/sales', label: t.nav.store },
    { key: 'contact', href: '#footer', label: t.nav.contact, sectionId: 'footer' },
  ], [t.nav.contact, t.nav.faq, t.nav.manifesto, t.nav.network, t.nav.product, t.nav.store, t.nav.waitlist]);
  const activeTextClass = isDark ? 'text-[#F0F0F0] opacity-100 font-bold' : 'text-[#181818] opacity-100 font-bold';
  const inactiveTextClass = 'opacity-70 hover:opacity-100';
  const activeItemBgClass = isDark ? 'bg-[#E0E0E0]/10' : 'bg-[#1D1D1D]/8';
  const inactiveItemBgClass = isDark ? 'hover:bg-[#E0E0E0]/5' : 'hover:bg-[#1D1D1D]/5';
  const activeNavKey = isStorePage ? 'store' : location.pathname === '/' ? activeSectionKey : null;

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    const sectionItems = navItems.filter(item => item.sectionId);

    const updateActiveSection = () => {
      const bottomDistance = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (bottomDistance <= 24) {
        setActiveSectionKey('contact');
        return;
      }

      const headerHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
      const activationLine = headerHeight + window.innerHeight * 0.25;
      const activeItem = sectionItems.find(item => {
        const section = document.getElementById(item.sectionId as string);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= activationLine && rect.bottom > activationLine;
      });

      setActiveSectionKey(activeItem?.key ?? null);
    };

    const frameId = window.requestAnimationFrame(updateActiveSection);
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [location.pathname, location.hash, navItems]);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 border-b-2 ${
      theme === 'light' ? 'border-[#E0E0E0] bg-[#F5F5F5]/60 backdrop-blur-md' : 'border-[#2A2A2A] bg-[#111111]/60 backdrop-blur-md'
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
        <div className="hidden min-[851px]:flex justify-center items-center space-x-4 lg:space-x-8 text-[10px] lg:text-xs uppercase tracking-widest font-medium">
          {navItems.slice(0, 5).map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`transition-opacity ${activeNavKey === item.key ? activeTextClass : inactiveTextClass}`}
            >
              {item.label}
            </a>
          ))}

          {/* CRYSTALLINE TEXT CTA */}
          <Link
            to="/sales"
            className={isStorePage
              ? `px-2 py-2 transition-opacity ${activeNavKey === 'store' ? activeTextClass : inactiveTextClass}`
              : 'relative px-2 py-2 group flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95'
            }
          >
            {/* Background Aura (Breathing) */}
            {!isStorePage && (
              <div className={`absolute inset-0 rounded-full animate-pulse-aura blur-xl ${
                isDark ? 'bg-white scale-75' : 'bg-zinc-800 scale-100'
              }`} />
            )}

            {/* Text with Shimmer Effect */}
            <span
              className={isStorePage
                ? 'uppercase'
                : `text-[10px] font-black uppercase tracking-[0.3em] relative z-10 antialiased animate-text-shimmer bg-clip-text text-transparent ${
                  isDark
                    ? 'bg-gradient-to-r from-gray-400 via-white to-gray-400'
                    : 'bg-gradient-to-r from-gray-600 via-black to-gray-600'
                }`
              }
            >
              {t.nav.store}
            </span>
          </Link>

          <a
            href="#footer"
            className={`transition-opacity ${activeNavKey === 'contact' ? activeTextClass : inactiveTextClass}`}
          >
            {t.nav.contact}
          </a>
        </div>

        {/* MOBILE NAV - Center (Mobile Only) */}
        <div className="flex min-[851px]:hidden flex-1 justify-center">
          <div className="relative">
            <button
              onClick={() => {
                setMobileMenuOpen(open => !open);
                setLangOpen(false);
              }}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all ${
                isDark ? 'bg-[#1C1C1C] hover:bg-[#242424]' : 'bg-white hover:bg-[#EFEFEF]'
              }`}
            >
              <span className="text-[9px] uppercase tracking-[0.2em] font-medium opacity-70">Menu</span>
              <svg className={`w-2 h-2 opacity-40 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                <div className={`absolute left-1/2 top-full mt-1 z-50 w-52 -translate-x-1/2 rounded-sm border overflow-hidden shadow-lg ${
                  isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'
                }`}>
                  {navItems.map(item => {
                    const isStoreItem = item.href === '/sales';
                    const showStoreEffect = isStoreItem && !isStorePage;
                    const isActiveItem = activeNavKey === item.key;

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block w-full px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-left transition-colors ${
                          showStoreEffect
                            ? 'relative group overflow-hidden transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]'
                            : isActiveItem
                              ? activeItemBgClass
                              : inactiveItemBgClass
                        }`}
                      >
                        {showStoreEffect && (
                          <span className={`absolute inset-x-6 inset-y-2 rounded-full animate-pulse-aura blur-xl ${
                            isDark ? 'bg-white scale-75' : 'bg-zinc-800 scale-100'
                          }`} />
                        )}
                        <span
                          className={showStoreEffect
                            ? `relative z-10 block font-black tracking-[0.3em] antialiased animate-text-shimmer bg-clip-text text-transparent ${
                              isDark
                                ? 'bg-gradient-to-r from-gray-400 via-white to-gray-400'
                                : 'bg-gradient-to-r from-gray-600 via-black to-gray-600'
                            }`
                            : undefined
                          }
                        >
                          {item.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* BUTTONS - Right Side */}
        <div className="flex-1 flex justify-end items-center space-x-3 text-current">
          <div className="relative">
            <button
              onClick={() => {
                setLangOpen(open => !open);
                setMobileMenuOpen(false);
              }}
              aria-label="Select language"
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
                  {(['pt', 'en', 'es', 'zh', 'ja'] as LangCode[]).map(l => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`block w-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium text-left transition-colors ${
                        l === lang
                          ? isDark ? 'bg-[#E0E0E0]/10' : 'bg-[#1D1D1D]/8'
                          : isDark ? 'hover:bg-[#E0E0E0]/5' : 'hover:bg-[#1D1D1D]/5'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </>
            )}
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
                  theme === 'light' ? 'bg-[#1D1D1D] text-[#F0F0F0]' : 'bg-[#E0E0E0] text-[#181818]'
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
