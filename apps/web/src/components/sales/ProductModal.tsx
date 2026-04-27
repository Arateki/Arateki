import { useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import type { Product } from '../../types/product';

interface ProductModalProps {
  product: Product | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  showAddToCart?: boolean;
}

export const ProductModal = ({ product, theme, onClose, onAddToCart, showAddToCart = true }: ProductModalProps) => {
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl animate-scaleIn ${
          isDark ? 'bg-[#1A1A1A] border border-[#2A2A2A]' : 'bg-white border border-[#E0E0E0]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-1.5 rounded-sm transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 aspect-square md:aspect-auto md:h-auto overflow-hidden flex-shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="md:w-1/2 flex flex-col p-8">
            <span className="text-[10px] uppercase tracking-widest opacity-50 font-medium mb-3">
              {product.category}
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4 leading-tight">
              {product.name}
            </h2>
            <p className={`text-sm leading-relaxed flex-1 ${isDark ? 'opacity-70' : 'opacity-60'} ${showAddToCart ? 'mb-8' : 'mb-4'}`}>
              {product.description}
            </p>

            <div className={`pt-6 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-[#F0F0F0]'}`}>
              <div className={`flex items-center justify-between ${showAddToCart ? 'mb-5' : ''}`}>
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-medium">Preço</span>
                <span className="text-2xl font-black">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency }).format(product.price)}
                </span>
              </div>
              {showAddToCart && onAddToCart && (
                <button
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-sm text-[11px] uppercase tracking-[0.25em] font-bold transition-all active:scale-[0.98] ${
                    isDark
                      ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]'
                      : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar ao Carrinho
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
