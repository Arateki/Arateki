import { PrimaryLogo } from '../common/Logos';
import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface HeroProps {
  t: TranslationType;
  theme: 'light' | 'dark';
}

export const Hero = ({ t, theme }: HeroProps) => {
  return (
    <section className="relative z-10 pt-24 pb-12 px-6 flex items-center justify-center overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* LOGO - Appears first on mobile */}
        <div className="flex justify-center md:justify-end md:order-2 relative w-full h-full">
          <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 pointer-events-none mb-8 md:mb-0">
            <FadeInSection delay={300} className="w-full flex justify-center md:justify-end pointer-events-auto">
              <PrimaryLogo 
                theme={theme}
                className="w-[140px] md:w-[180px] lg:w-[240px] xl:w-[320px] opacity-90 transition-transform duration-700 hover:scale-105" 
              />
            </FadeInSection>
          </div>
        </div>

        {/* TEXT - Appears after on mobile */}
        <div className="text-left flex flex-col items-start pt-0 md:pt-0 md:order-1">
          <FadeInSection>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">
              {t.hero.title}
            </h1>
          </FadeInSection>
          <FadeInSection delay={200}>
            <h2 className="text-xl md:text-3xl font-medium mb-4 text-opacity-80">
              {t.hero.subtitle}
            </h2>
          </FadeInSection>
          <FadeInSection delay={400}>
            <p className="text-sm font-normal leading-relaxed max-w-lg mb-8 opacity-80">
              {t.hero.desc}
            </p>
          </FadeInSection>
        </div>

      </div>
    </section>
  );
};
