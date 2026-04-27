import { useState } from 'react';
import { CheckoutInput } from '../CheckoutInput';
import type { ContactData } from '../../../types/checkout';
import type { TranslationType } from '../../../types/i18n';

interface ContactStepProps {
  data: ContactData;
  onChange: (data: ContactData) => void;
  onNext: () => void;
  theme: 'light' | 'dark';
  tCo: TranslationType['checkout'];
}

function validate(data: ContactData) {
  const errors: Partial<ContactData> = {};
  if (!data.name.trim()) errors.name = 'Nome obrigatório';
  if (!data.email.trim()) errors.email = 'E-mail obrigatório';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'E-mail inválido';
  if (!data.phone.trim()) errors.phone = 'Telefone obrigatório';
  return errors;
}

export const ContactStep = ({ data, onChange, onNext, theme, tCo }: ContactStepProps) => {
  const [errors, setErrors] = useState<Partial<ContactData>>({});
  const isDark = theme === 'dark';

  const set = (field: keyof ContactData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [field]: e.target.value });

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2)  return d;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    return v;
  };

  const handleNext = () => {
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-1">{tCo.contact.title}</h2>
        <p className="text-sm opacity-85 font-medium">{tCo.contact.subtitle}</p>
      </div>

      <div className="space-y-4">
        <CheckoutInput label={tCo.contact.name} theme={theme} value={data.name} onChange={set('name')} placeholder="João da Silva" error={errors.name} autoFocus />
        <CheckoutInput label={tCo.contact.email} theme={theme} type="email" value={data.email} onChange={set('email')} placeholder="joao@email.com" error={errors.email} />
        <CheckoutInput
          label={tCo.contact.phone}
          theme={theme}
          value={data.phone}
          onChange={e => onChange({ ...data, phone: formatPhone(e.target.value) })}
          placeholder="(11) 99999-9999"
          error={errors.phone}
        />
      </div>

      <button
        onClick={handleNext}
        className={`w-full py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold transition-all active:scale-[0.98] ${
          isDark ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]' : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'
        }`}
      >
        {tCo.contact.next}
      </button>
    </div>
  );
};
