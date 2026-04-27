import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Moon, Sun } from 'lucide-react';
import { useAppConfig } from '../hooks/useAppConfig';
import type { LangCode } from '../hooks/useAppConfig';
import { useCart } from '../context/useCart';
import { checkoutService } from '../services/checkoutService';
import { SHIPPING_OPTIONS } from '../types/checkout';
import { CheckoutStepper } from '../components/checkout/CheckoutStepper';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { ContactStep } from '../components/checkout/steps/ContactStep';
import { DeliveryStep } from '../components/checkout/steps/DeliveryStep';
import { PaymentStep } from '../components/checkout/steps/PaymentStep';
import { ConfirmationStep } from '../components/checkout/steps/ConfirmationStep';
import { ProductModal } from '../components/sales/ProductModal';
import { HorizontalLogo } from '../components/common/Logos';
import type { CheckoutFormData } from '../types/checkout';
import type { Product } from '../types/product';

const EMPTY_FORM: CheckoutFormData = {
  contact:  { name: '', email: '', phone: '' },
  delivery: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', shippingMethod: '' },
  payment:  { method: '' },
};

export default function Checkout() {
  const { theme, toggleTheme, lang, setLang, t } = useAppConfig();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [step, setStep]                     = useState(0);
  const [langOpen, setLangOpen]             = useState(false);
  const [form, setForm]                     = useState<CheckoutFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [orderId, setOrderId]               = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (items.length === 0 && !orderId) navigate('/vendas');
  }, [items, orderId, navigate]);

  const selectedShipping = SHIPPING_OPTIONS.find(o => o.id === form.delivery.shippingMethod) ?? null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { orderId: id } = await checkoutService.createOrder({ ...form, items });
      setOrderId(id);
      clearCart();
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-['Montserrat'] transition-colors duration-500 ${
      isDark ? 'bg-[#111111] text-[#E8E8E8]' : 'bg-[#F5F5F5] text-[#1A1A1A]'
    }`}>

      {/* Minimal header */}
      <header className={`fixed w-full z-40 border-b ${
        isDark ? 'border-[#2A2A2A] bg-[#111111]/90' : 'border-[#E0E0E0] bg-[#F5F5F5]/90'
      } backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to="/vendas"
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.checkout.backToStore}
          </Link>

          <HorizontalLogo theme={theme} className="w-28" />

          {/* Lang + theme controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-all ${
                  isDark ? 'bg-[#1C1C1C] hover:bg-[#242424]' : 'bg-white hover:bg-[#EFEFEF]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 opacity-60" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{lang}</span>
                <svg className={`w-2 h-2 opacity-40 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className={`absolute right-0 top-full mt-1 z-50 rounded-sm border overflow-hidden shadow-lg min-w-full ${
                    isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'
                  }`}>
                    {(['pt', 'en', 'es', 'zh', 'ja'] as LangCode[]).map(l => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        className={`block w-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium text-left transition-colors ${
                          l === lang
                            ? isDark ? 'bg-[#E0E0E0]/10' : 'bg-[#1D1D1D]/8'
                            : isDark ? 'hover:bg-[#E0E0E0]/5' : 'hover:bg-[#1D1D1D]/5'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {step < 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <CheckoutStepper current={step} theme={theme} tCo={t.checkout} />
                {step === 0 && (
                  <ContactStep
                    data={form.contact}
                    onChange={contact => setForm(f => ({ ...f, contact }))}
                    onNext={() => setStep(1)}
                    theme={theme}
                    tCo={t.checkout}
                  />
                )}
                {step === 1 && (
                  <DeliveryStep
                    data={form.delivery}
                    onChange={delivery => setForm(f => ({ ...f, delivery }))}
                    onNext={() => setStep(2)}
                    onBack={() => setStep(0)}
                    theme={theme}
                    tCo={t.checkout}
                  />
                )}
                {step === 2 && (
                  <PaymentStep
                    data={form.payment}
                    onChange={payment => setForm(f => ({ ...f, payment }))}
                    onConfirm={handleConfirm}
                    onBack={() => setStep(1)}
                    theme={theme}
                    isSubmitting={isSubmitting}
                    tCo={t.checkout}
                  />
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-28">
                  <OrderSummary
                    items={items}
                    shipping={selectedShipping}
                    theme={theme}
                    tCo={t.checkout}
                    onOpenProduct={setSelectedProduct}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-lg mx-auto">
              <ConfirmationStep orderId={orderId} email={form.contact.email} theme={theme} tCo={t.checkout} />
            </div>
          )}
        </div>
      </main>

      <ProductModal
        product={selectedProduct}
        theme={theme}
        onClose={() => setSelectedProduct(null)}
        showAddToCart={false}
      />
    </div>
  );
}
