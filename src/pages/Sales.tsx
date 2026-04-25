import { useAppConfig } from '../hooks/useAppConfig';
import { useProducts } from '../hooks/useProducts';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProductCard } from '../components/sales/ProductCard';
import { FadeInSection } from '../components/common/FadeInSection';

export default function Sales() {
  const { theme, lang, setLang, t, toggleTheme } = useAppConfig();
  const { products, isLoading, error } = useProducts();

  return (
    <div className={`min-h-screen font-['Montserrat'] transition-colors duration-500 ${theme === 'dark' ? 'dark' : ''} ${
      theme === 'light' 
        ? 'bg-white text-[#1A1A1A] selection:bg-[#1A1A1A] selection:text-white' 
        : 'bg-black text-[#FAFAFA] selection:bg-[#FAFAFA] selection:text-black'
    }`}>
      
      <ParticleBackground theme={theme} />

      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        lang={lang} 
        setLang={setLang} 
        t={t} 
      />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                Loja de Componentes
              </h1>
              <p className="text-lg opacity-70 max-w-2xl mx-auto font-light">
                Adquira os componentes eletrônicos essenciais para seus projetos open-source e reparos.
              </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <FadeInSection key={product.id}>
                  <ProductCard product={product} theme={theme} />
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
    </div>
  );
}
