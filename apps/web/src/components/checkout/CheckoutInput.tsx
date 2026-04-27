import type { InputHTMLAttributes } from 'react';

interface CheckoutInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  theme: 'light' | 'dark';
  error?: string;
}

export const CheckoutInput = ({ label, theme, error, className = '', ...props }: CheckoutInputProps) => {
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">{label}</label>
      <input
        className={`w-full px-4 py-3 text-sm rounded-sm border bg-transparent transition-colors outline-none
          ${isDark
            ? 'border-[#2A2A2A] focus:border-[#E0E0E0]/50 placeholder:text-[#E8E8E8]/40'
            : 'border-[#E0E0E0] focus:border-[#1D1D1D]/40 placeholder:text-[#1A1A1A]/40'
          }
          ${error ? 'border-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && <span className="text-[10px] text-red-500 tracking-wide">{error}</span>}
    </div>
  );
};
