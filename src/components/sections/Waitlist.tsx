import { ArrowRight } from 'lucide-react';
import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface WaitlistProps {
  t: TranslationType;
  theme: 'light' | 'dark';
  isSubmitting: boolean;
  isSubmitted: boolean;
  handleEmailSubmit: (e: React.FormEvent) => Promise<void>;
}

export const Waitlist = ({ t, theme, isSubmitting, isSubmitted, handleEmailSubmit }: WaitlistProps) => {
  return (
    <section id="waitlist" className={`relative z-10 py-32 px-6 border-t-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight">{t.waitlist.title}</h2>
          <p className="text-base md:text-lg font-light leading-relaxed opacity-80 mb-12 max-w-2xl mx-auto">
            {t.waitlist.desc}
          </p>
        </FadeInSection>
        
        <FadeInSection delay={200}>
          {isSubmitted ? (
            <div className="py-8 px-6 border-2 border-dashed border-current opacity-80 inline-block animate-in fade-in zoom-in duration-500 text-center">
              <p className="text-lg md:text-xl font-medium tracking-tight italic">
                {t.waitlist.successMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="relative max-w-lg mx-auto">
              <input 
                name="email"
                type="email" 
                required
                disabled={isSubmitting}
                placeholder={t.waitlist.placeholder}
                className={`w-full bg-transparent border-b-2 py-4 pl-4 pr-40 outline-none transition-colors font-light ${
                  theme === 'light' 
                    ? 'border-black/20 focus:border-black text-black placeholder:text-black/40' 
                    : 'border-white/20 focus:border-white text-white placeholder:text-white/40'
                }`}
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`absolute right-0 top-1/2 -translate-y-1/2 uppercase tracking-widest text-[10px] md:text-xs font-medium px-4 md:px-6 py-2 transition-all flex items-center gap-2 ${
                  isSubmitting ? 'opacity-50 cursor-wait' : 'hover:scale-105'
                } ${
                  theme === 'light' ? 'text-black' : 'text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    {t.waitlist.registering}
                  </>
                ) : (
                  <>
                    {t.waitlist.button} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </FadeInSection>
      </div>
    </section>
  );
};
