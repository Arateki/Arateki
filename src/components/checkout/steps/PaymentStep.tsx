import { useState } from 'react';
import { Loader2, QrCode, CreditCard } from 'lucide-react';
import type { PaymentData } from '../../../types/checkout';
import type { TranslationType } from '../../../types/i18n';

interface PaymentStepProps {
  data: PaymentData;
  onChange: (data: PaymentData) => void;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  theme: 'light' | 'dark';
  isSubmitting: boolean;
  tCo: TranslationType['checkout'];
}

export const PaymentStep = ({ data, onChange, onConfirm, onBack, theme, isSubmitting, tCo }: PaymentStepProps) => {
  const [error, setError] = useState('');
  const isDark = theme === 'dark';
  const tc = tCo.payment;

  const METHODS = [
    { id: 'pix' as const,         label: tc.pix,  icon: QrCode,     desc: tc.pixDesc  },
    { id: 'credit_card' as const, label: tc.card, icon: CreditCard, desc: tc.cardDesc },
  ];

  const handleConfirm = async () => {
    if (!data.method) { setError(tCo.payment.confirm); return; }
    setError('');
    await onConfirm();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-1">{tc.title}</h2>
        <p className="text-sm opacity-85 font-medium">{tc.subtitle}</p>
      </div>

      <div className="space-y-3">
        {METHODS.map(({ id, label, icon: Icon, desc }) => (
          <label
            key={id}
            className={`flex items-center gap-4 p-4 rounded-sm border cursor-pointer transition-all ${
              data.method === id
                ? isDark ? 'border-[#E0E0E0]/60 bg-[#E0E0E0]/5' : 'border-[#1D1D1D]/40 bg-[#1D1D1D]/5'
                : isDark ? 'border-[#2A2A2A] hover:border-[#E0E0E0]/20' : 'border-[#E0E0E0] hover:border-[#1D1D1D]/20'
            }`}
          >
            <input type="radio" name="payment" value={id} checked={data.method === id} onChange={() => { onChange({ method: id }); setError(''); }} className="sr-only" />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              data.method === id
                ? isDark ? 'border-[#E0E0E0]' : 'border-[#1D1D1D]'
                : isDark ? 'border-[#444444]' : 'border-[#CCCCCC]'
            }`}>
              {data.method === id && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#E0E0E0]' : 'bg-[#1D1D1D]'}`} />}
            </div>
            <Icon className="w-5 h-5 opacity-70 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-tight">{label}</p>
              <p className="text-[10px] opacity-75 font-medium">{desc}</p>
            </div>
          </label>
        ))}
        {error && <span className="text-[10px] text-red-500 tracking-wide">{error}</span>}
      </div>

      {data.method && (
        <div className={`p-4 rounded-sm text-sm opacity-85 font-medium leading-relaxed ${
          isDark ? 'bg-[#E0E0E0]/5 border border-[#2A2A2A]' : 'bg-[#1D1D1D]/5 border border-[#E8E8E8]'
        }`}>
          {data.method === 'pix' ? tc.pixInfo : tc.cardInfo}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={isSubmitting} className={`flex-1 py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold border transition-all active:scale-[0.98] disabled:opacity-40 ${isDark ? 'border-[#2A2A2A] hover:border-[#E0E0E0]/30' : 'border-[#E0E0E0] hover:border-[#1D1D1D]/30'}`}>
          {tc.back}
        </button>
        <button onClick={handleConfirm} disabled={isSubmitting} className={`flex-[2] py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 ${isDark ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]' : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'}`}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {tc.processing}</> : tc.confirm}
        </button>
      </div>
    </div>
  );
};
