import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CheckoutInput } from '../CheckoutInput';
import { SHIPPING_OPTIONS } from '../../../types/checkout';
import type { DeliveryData } from '../../../types/checkout';
import type { TranslationType } from '../../../types/i18n';

interface DeliveryStepProps {
  data: DeliveryData;
  onChange: (data: DeliveryData) => void;
  onNext: () => void;
  onBack: () => void;
  theme: 'light' | 'dark';
  tCo: TranslationType['checkout'];
}

type Errors = Partial<Record<keyof DeliveryData, string>>;

function validate(data: DeliveryData): Errors {
  const e: Errors = {};
  if (!data.cep.replace(/\D/g,'') || data.cep.replace(/\D/g,'').length < 8) e.cep = 'CEP inválido';
  if (!data.street.trim())       e.street = 'Logradouro obrigatório';
  if (!data.number.trim())       e.number = 'Número obrigatório';
  if (!data.neighborhood.trim()) e.neighborhood = 'Bairro obrigatório';
  if (!data.city.trim())         e.city = 'Cidade obrigatória';
  if (!data.shippingMethod)      e.shippingMethod = 'Selecione uma opção de frete';
  return e;
}

export const DeliveryStep = ({ data, onChange, onNext, onBack, theme, tCo }: DeliveryStepProps) => {
  const [errors, setErrors]         = useState<Errors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const isDark = theme === 'dark';
  const tc = tCo.delivery;

  const set = (field: keyof DeliveryData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...data, [field]: e.target.value });

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g,'').slice(0,8);
    return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange({ ...data, cep: formatted });
    const digits = formatted.replace(/\D/g,'');
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const json = await res.json();
        if (!json.erro) {
          onChange({ ...data, cep: formatted, street: json.logradouro ?? '', neighborhood: json.bairro ?? '', city: json.localidade ?? '', state: json.uf ?? '' });
          setErrors(prev => ({ ...prev, cep: undefined, street: undefined, neighborhood: undefined, city: undefined }));
        } else {
          setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        }
      } catch {
        setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }));
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleNext = () => {
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-1">{tc.title}</h2>
        <p className="text-sm opacity-85 font-medium">{tc.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <CheckoutInput label={tc.cep} theme={theme} value={data.cep} onChange={handleCepChange} placeholder="00000-000" error={errors.cep} maxLength={9} />
          </div>
          {cepLoading && <Loader2 className="w-5 h-5 animate-spin opacity-50 mb-3 flex-shrink-0" />}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <CheckoutInput label={tc.street} theme={theme} value={data.street} onChange={set('street')} placeholder="Rua..." error={errors.street} />
          </div>
          <CheckoutInput label={tc.number} theme={theme} value={data.number} onChange={set('number')} placeholder="123" error={errors.number} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CheckoutInput label={tc.complement} theme={theme} value={data.complement} onChange={set('complement')} placeholder="Apto, bloco..." />
          <CheckoutInput label={tc.neighborhood} theme={theme} value={data.neighborhood} onChange={set('neighborhood')} placeholder="Centro" error={errors.neighborhood} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <CheckoutInput label={tc.city} theme={theme} value={data.city} onChange={set('city')} placeholder="São Paulo" error={errors.city} />
          </div>
          <CheckoutInput label={tc.state} theme={theme} value={data.state} onChange={set('state')} placeholder="SP" maxLength={2} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">{tc.shippingLabel}</p>
        {SHIPPING_OPTIONS.map(option => (
          <label
            key={option.id}
            className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-all ${
              data.shippingMethod === option.id
                ? isDark ? 'border-[#E0E0E0]/60 bg-[#E0E0E0]/5' : 'border-[#1D1D1D]/40 bg-[#1D1D1D]/5'
                : isDark ? 'border-[#2A2A2A] hover:border-[#E0E0E0]/20' : 'border-[#E0E0E0] hover:border-[#1D1D1D]/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <input type="radio" name="shipping" value={option.id} checked={data.shippingMethod === option.id} onChange={() => onChange({ ...data, shippingMethod: option.id })} className="sr-only" />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                data.shippingMethod === option.id
                  ? isDark ? 'border-[#E0E0E0]' : 'border-[#1D1D1D]'
                  : isDark ? 'border-[#444444]' : 'border-[#CCCCCC]'
              }`}>
                {data.shippingMethod === option.id && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#E0E0E0]' : 'bg-[#1D1D1D]'}`} />}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">{option.name}</p>
                <p className="text-[10px] opacity-75 font-medium">{option.days}</p>
              </div>
            </div>
            <span className="text-sm font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}
            </span>
          </label>
        ))}
        {errors.shippingMethod && <span className="text-[10px] text-red-500 tracking-wide">{errors.shippingMethod}</span>}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className={`flex-1 py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold border transition-all active:scale-[0.98] ${isDark ? 'border-[#2A2A2A] hover:border-[#E0E0E0]/30' : 'border-[#E0E0E0] hover:border-[#1D1D1D]/30'}`}>
          {tc.back}
        </button>
        <button onClick={handleNext} className={`flex-[2] py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold transition-all active:scale-[0.98] ${isDark ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]' : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'}`}>
          {tc.next}
        </button>
      </div>
    </div>
  );
};
