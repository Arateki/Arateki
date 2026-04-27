import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface ManifestoProps {
  t: TranslationType;
  theme: 'light' | 'dark';
}

export const Manifesto = ({ t, theme }: ManifestoProps) => {
  return (
    <section id="manifesto" className={`relative z-10 py-32 px-6 border-t-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
      <div className="max-w-7xl mx-auto">
        <FadeInSection>
          <h3 className="text-sm uppercase tracking-[0.3em] font-medium mb-16 text-center opacity-70">
            {t.manifesto.title}
          </h3>
        </FadeInSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {t.manifesto.items.map((item, idx) => (
            <FadeInSection key={idx} delay={idx * 150}>
              <div className="p-8 h-full border border-transparent hover:border-current transition-colors duration-500">
                <div className="opacity-70">{item.icon}</div>
                <h4 className="text-xl font-medium mb-4">{item.title}</h4>
                <p className="font-light leading-relaxed opacity-80">{item.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
};
