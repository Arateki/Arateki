import { Check } from 'lucide-react';
import type { TranslationType } from '../../types/i18n';

interface CheckoutStepperProps {
  current: number;
  theme: 'light' | 'dark';
  tCo: TranslationType['checkout'];
}

export const CheckoutStepper = ({ current, theme, tCo }: CheckoutStepperProps) => {
  const isDark = theme === 'dark';
  const steps = tCo.steps;

  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                done
                  ? isDark ? 'bg-[#E0E0E0] border-[#E0E0E0] text-[#181818]' : 'bg-[#1D1D1D] border-[#1D1D1D] text-[#F0F0F0]'
                  : active
                  ? isDark ? 'border-[#E0E0E0] text-[#E8E8E8]' : 'border-[#1D1D1D] text-[#1D1D1D]'
                  : isDark ? 'border-[#2A2A2A] text-[#E8E8E8]/30' : 'border-[#D0D0D0] text-[#1A1A1A]/30'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${
                active
                  ? 'opacity-100 font-bold'
                  : done ? 'opacity-80 font-semibold' : 'opacity-50 font-medium'
              }`}>
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-6 transition-all ${
                done
                  ? isDark ? 'bg-[#E0E0E0]/60' : 'bg-[#1D1D1D]/60'
                  : isDark ? 'bg-[#2A2A2A]' : 'bg-[#E0E0E0]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
