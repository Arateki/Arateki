import { Mail, MessageCircle, MapPin, Github, Instagram, Linkedin } from 'lucide-react';
import { HorizontalLogo } from '../common/Logos';
import type { TranslationType } from '../../types/i18n';

interface FooterProps {
  t: TranslationType;
  theme: 'light' | 'dark';
}

export const Footer = ({ t, theme }: FooterProps) => {
  return (
    <footer id="footer" className={`relative z-10 py-20 px-6 border-t-2 ${theme === 'light' ? 'border-[#E0E0E0]' : 'border-[#333333]'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8">
        <div className="flex flex-col items-start md:col-span-1">
          <HorizontalLogo 
            theme={theme}
            className="w-56 mb-8 opacity-80" 
          />
          <p className="text-xs font-light opacity-50 uppercase tracking-widest leading-relaxed mb-4">
            © {new Date().getFullYear()} ARATEKI.<br />
            {t.footer.rights}
          </p>
          <p className="text-xs font-light opacity-50 uppercase tracking-widest">
            CNPJ: 45.642.122.0001-10
          </p>
        </div>

        <div className="flex flex-col items-start">
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] mb-6 opacity-50">{t.footer.contact}</h4>
          <a href="mailto:contato@arateki.com" className="text-sm font-light opacity-80 hover:opacity-100 flex items-center gap-3 mb-4 transition-opacity">
            <Mail className="w-4 h-4" /> contato@arateki.com
          </a>
          <a href="https://wa.me/5585991501759" target="_blank" rel="noopener noreferrer" className="text-sm font-light opacity-80 hover:opacity-100 flex items-center gap-3 transition-opacity">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>

        <div className="flex flex-col items-start">
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] mb-6 opacity-50">{t.footer.address}</h4>
          <div className="text-sm font-light opacity-80 flex items-start gap-3 leading-relaxed">
            <MapPin className="w-4 h-4 mt-1 shrink-0" />
            <p>
              Rua Rio Grande do Sul, 395<br />
              Fortaleza, CE<br />
              CEP: 60441-145
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] mb-6 opacity-50">{t.footer.social}</h4>
          <div className="flex flex-col gap-4">
            <a href="https://github.com/Arateki" target="_blank" rel="noopener noreferrer" className="text-sm font-light opacity-80 hover:opacity-100 flex items-center gap-3 transition-opacity">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://instagram.com/Arateki" target="_blank" rel="noopener noreferrer" className="text-sm font-light opacity-80 hover:opacity-100 flex items-center gap-3 transition-opacity">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
            <a href="https://linkedin.com/company/arateki" target="_blank" rel="noopener noreferrer" className="text-sm font-light opacity-80 hover:opacity-100 flex items-center gap-3 transition-opacity">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
