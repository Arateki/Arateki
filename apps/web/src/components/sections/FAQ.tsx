import { Plus, Minus } from 'lucide-react';
import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface FAQProps {
  t: TranslationType;
  theme: 'light' | 'dark';
  openFaq: number | null;
  setOpenFaq: (index: number | null) => void;
}

export const FAQ = ({ t, theme, openFaq, setOpenFaq }: FAQProps) => {
  return (
    <section id="faq" className={`relative z-10 py-32 px-6 border-t-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <h2 className="text-3xl md:text-4xl font-light mb-16 text-center tracking-tight">{t.faq.title}</h2>
        </FadeInSection>

        <div className="space-y-4">
          {t.faq.items.map((faq, idx) => (
            <FadeInSection key={idx} delay={idx * 100}>
              <div className={`border-b-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
                >
                  <span className="text-lg font-medium pr-8 group-hover:opacity-70 transition-opacity">{faq.q}</span>
                  <span className={`transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}>
                    {openFaq === idx ? <Minus className="w-5 h-5 opacity-50" /> : <Plus className="w-5 h-5 opacity-50" />}
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openFaq === idx ? 'max-h-96 opacity-100 pb-8' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="font-light leading-relaxed opacity-80">{faq.a}</div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
};
