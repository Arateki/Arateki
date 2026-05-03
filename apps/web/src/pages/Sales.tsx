import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppConfig } from '../hooks/useAppConfig';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/useCart';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProductCard } from '../components/sales/ProductCard';
import { CartDrawer } from '../components/sales/CartDrawer';
import { ProductModal } from '../components/sales/ProductModal';
import { FadeInSection } from '../components/common/FadeInSection';
import { emailService } from '../services/emailService';
import type { Product } from '../types/product';

export default function Sales() {
  const { theme, lang, setLang, t, toggleTheme } = useAppConfig();
  const { products, isLoading, error } = useProducts();
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;

    setIsSubmitting(true);
    try {
      await emailService.submitToWaitlist(email, 'Store Banner');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Waitlist error:', err);
      alert('Erro ao registrar e-mail. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-['Montserrat'] transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''} ${
      theme === 'light'
        ? 'bg-[#F5F5F5] text-[#1A1A1A] selection:bg-[#1D1D1D] selection:text-[#F0F0F0]'
        : 'bg-[#111111] text-[#E8E8E8] selection:bg-[#E0E0E0] selection:text-[#181818]'
    }`}>

      <ParticleBackground theme={theme} />

      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      <main className="pt-24 md:pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                {t.store.title}
              </h1>
              <p className="text-sm md:text-base opacity-70 max-w-2xl mx-auto font-light">
                {t.store.subtitle}
              </p>
            </div>
          </FadeInSection>

          {/* Waitlist Banner */}
          <FadeInSection delay={200}>
            <div className={`mb-12 p-6 md:p-8 rounded-lg border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-6 ${
              theme === 'light' ? 'bg-white/50 border-black/10' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight mb-1">
                  {t.store.notifyMe.title}
                </h2>
                <p className="text-xs md:text-sm opacity-70 font-light max-w-xl">
                  {t.store.notifyMe.desc}
                </p>
              </div>

              <div className="w-full md:w-auto min-w-[280px]">
                {isSubmitted ? (
                  <div className="text-center md:text-right py-3 px-4 border border-current opacity-60 italic text-sm">
                    {t.store.notifyMe.success}
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="relative group">
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={t.waitlist.placeholder}
                      className={`w-full bg-transparent border-b-2 py-3 pl-2 pr-32 outline-none transition-colors text-sm font-light ${
                        theme === 'light' ? 'border-black/20 focus:border-black' : 'border-white/20 focus:border-white'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold hover:translate-x-1 transition-transform"
                    >
                      {isSubmitting ? t.waitlist.registering : (
                        <>{t.store.notifyMe.button} <ArrowRight size={14} /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </FadeInSection>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-20">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-5">
              {products.map((product) => (
                <FadeInSection key={product.id} className="h-full">
                  <ProductCard
                    product={product}
                    theme={theme}
                    t={t.store}
                    onAddToCart={addToCart}
                    onOpenModal={setSelectedProduct}
                  />
                </FadeInSection>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer
        t={t}
        theme={theme}
      />

      <CartDrawer theme={theme} />

      <ProductModal
        product={selectedProduct}
        theme={theme}
        t={t.store}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}
