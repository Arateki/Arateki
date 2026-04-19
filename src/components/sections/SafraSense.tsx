import { Leaf, Droplets, Zap, Wifi, Brain, Users, ArrowRight } from 'lucide-react';
import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface SafraSenseProps {
  t: TranslationType;
  theme: 'light' | 'dark';
}

export const SafraSense = ({ t, theme }: SafraSenseProps) => {
  return (
    <section id="safrasense" className={`relative z-10 pt-16 pb-24 md:pt-24 md:pb-32 px-6 border-t-2 overflow-hidden flex items-center ${
      theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'
    }`}>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl">
          <FadeInSection>
            <div className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-medium border-2 mb-8 border-[#FF9999] text-[#FF9999]">
              {t.safra.tag}
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 flex items-baseline gap-3">
              {t.safra.title}
              <span className="text-lg md:text-2xl font-light tracking-[0.2em] uppercase text-[#89CFF0] opacity-90">Aqua</span>
            </h2>
            <p className="text-lg md:text-xl font-light leading-relaxed opacity-80 mb-16">
              {t.safra.desc}
            </p>
          </FadeInSection>

          {/* LEAF ICON - Mobile: Between text and points | Desktop: Absolute background */}
          <div className="relative md:absolute md:right-[-10%] md:top-1/2 md:-translate-y-1/2 w-full md:w-[800px] lg:w-[1000px] aspect-video md:aspect-square pointer-events-none flex items-center justify-center my-8 md:my-0 opacity-10 dark:opacity-25">
            <Leaf className="w-32 h-32 md:w-[60%] md:h-[60%] opacity-20 dark:opacity-40" strokeWidth={0.5} />
          </div>

          <div className="space-y-10">
            {[
              { icon: <Droplets className="w-8 h-8 mt-1" />, ...t.safra.features[0] },
              { icon: <Zap className="w-8 h-8 mt-1" />, ...t.safra.features[1] },
              { icon: <Wifi className="w-8 h-8 mt-1" />, ...t.safra.features[2] },
              { icon: <Brain className="w-8 h-8 mt-1" />, ...t.safra.features[3] },
              { icon: <Users className="w-8 h-8 mt-1" />, ...t.safra.features[4] },
            ].map((feat, idx) => (
              <FadeInSection key={idx} delay={idx * 150}>
                <div className="flex gap-6">
                  <div className="opacity-70">{feat.icon}</div>
                  <div>
                    <h4 className="font-medium text-xl mb-3">{feat.title}</h4>
                    <p className="opacity-80 text-base font-light leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={500}>
            <div className={`mt-14 pt-10 border-t flex flex-col sm:flex-row sm:items-center gap-8 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium opacity-50 block mb-2">{t.safra.priceLabel}</span>
                <span className="text-4xl font-light tracking-tight">{t.safra.price}</span>
              </div>
              <a href="#waitlist" className={`inline-flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs font-medium px-8 py-4 border transition-all duration-300 hover:scale-105 ${
                theme === 'light' 
                  ? 'border-black text-black hover:bg-black hover:text-white' 
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}>
                {t.safra.cta} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
};
