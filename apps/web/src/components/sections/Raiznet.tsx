import { Network, Server, Globe, Map } from 'lucide-react';
import { FadeInSection } from '../common/FadeInSection';
import type { TranslationType } from '../../types/i18n';

interface RaiznetProps {
  t: TranslationType;
  theme: 'light' | 'dark';
}

export const Raiznet = ({ t, theme }: RaiznetProps) => {
  return (
    <section id="raiznet" className={`relative z-10 py-32 px-6 border-t-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
      <div className="max-w-7xl mx-auto text-center mb-20">
        <FadeInSection>
          <Network className="w-16 h-16 mx-auto mb-8 opacity-90" />
          <h2 className="text-4xl md:text-5xl font-light mb-6">{t.raiznet.title}</h2>
          <p className="text-lg font-light leading-relaxed opacity-80 max-w-2xl mx-auto">
            {t.raiznet.desc}
          </p>
        </FadeInSection>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {[
          { icon: <Network className="w-8 h-8 mb-6" />, ...t.raiznet.nodes[0] },
          { icon: <Server className="w-8 h-8 mb-6" />, ...t.raiznet.nodes[1] },
          { icon: <Globe className="w-8 h-8 mb-6" />, ...t.raiznet.nodes[2] },
          { icon: <Map className="w-8 h-8 mb-6" />, ...t.raiznet.nodes[3] }
        ].map((node, idx) => (
          <FadeInSection key={idx} delay={idx * 150}>
            <div className={`p-8 border h-full transition-all duration-300 hover:-translate-y-2 bg-transparent ${
              theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'
            }`}>
              <div className="opacity-70">{node.icon}</div>
              <h4 className="text-xl font-medium mb-4">{node.title}</h4>
              <p className="font-light leading-relaxed opacity-80">{node.desc}</p>
            </div>
          </FadeInSection>
        ))}
      </div>
    </section>
  );
};
