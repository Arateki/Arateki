import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TranslationType } from '../../../types/i18n';

interface ConfirmationStepProps {
  orderId: string;
  email: string;
  theme: 'light' | 'dark';
  tCo: TranslationType['checkout'];
}

export const ConfirmationStep = ({ orderId, email, theme, tCo }: ConfirmationStepProps) => {
  const isDark = theme === 'dark';
  const tc = tCo.confirmation;

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      <CheckCircle2 className={`w-16 h-16 ${isDark ? 'text-[#E0E0E0]' : 'text-[#1D1D1D]'} opacity-90`} />

      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">{tc.title}</h2>
        <p className="text-sm opacity-85 font-medium max-w-xs">
          {tc.emailSent} <span className="font-bold">{email}</span>.
        </p>
      </div>

      <div className={`px-6 py-4 rounded-sm border ${isDark ? 'border-[#2A2A2A] bg-[#E0E0E0]/5' : 'border-[#E0E0E0] bg-[#1D1D1D]/5'}`}>
        <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold mb-1">{tc.orderNumber}</p>
        <p className="text-xl font-black tracking-wider">{orderId}</p>
      </div>

      <p className="text-xs opacity-75 font-medium max-w-xs leading-relaxed">
        {tc.trackingInfo}
      </p>

      <Link
        to="/vendas"
        className={`px-8 py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold transition-all active:scale-[0.98] ${
          isDark ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]' : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'
        }`}
      >
        {tc.continueShopping}
      </Link>
    </div>
  );
};
