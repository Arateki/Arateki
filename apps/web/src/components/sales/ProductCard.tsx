import { ShoppingCart } from 'lucide-react';
import type { Product } from '../../types/product';
import type { TranslationType } from '../../types/i18n';

interface ProductCardProps {
  product: Product;
  theme: 'light' | 'dark';
  t: TranslationType['store'];
  onAddToCart: (product: Product) => void;
  onOpenModal: (product: Product) => void;
}

export const ProductCard = ({ product, theme, t, onAddToCart, onOpenModal }: ProductCardProps) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className={`group flex aspect-[1/2] flex-col rounded-lg overflow-hidden transition-all duration-300 border cursor-pointer ${
        theme === 'light'
          ? 'bg-white border-[#E0E0E0] hover:border-black/20'
          : 'bg-[#1C1C1C] border-[#2A2A2A] hover:border-white/20'
      }`}
      onClick={() => onOpenModal(product)}
    >
      <div className="aspect-square flex-none overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover scale-[0.96] transition-transform duration-500 group-hover:scale-100"
        />
        {isOutOfStock && (
          <div className={`absolute inset-x-0 bottom-0 px-2 py-1.5 text-center text-[9px] uppercase tracking-[0.16em] font-black ${
            theme === 'light'
              ? 'bg-[#1D1D1D] text-[#F0F0F0]'
              : 'bg-[#E0E0E0] text-[#181818]'
          }`}>
            {t.outOfStock}
          </div>
        )}
      </div>
      <div className="p-2 md:p-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <span className="text-[7px] md:text-[9px] uppercase tracking-widest opacity-50 mb-1 block truncate">
          {product.category}
        </span>
        <h3 className="text-[11px] md:text-base font-bold mb-1 uppercase tracking-tight leading-tight line-clamp-2 min-h-7 md:min-h-10">{product.name}</h3>
        <p className="hidden sm:block text-[11px] md:text-xs opacity-70 mb-3 line-clamp-2 min-h-8 md:min-h-10">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-1.5 md:gap-2">
          <span className="text-[10px] md:text-sm lg:text-base font-bold whitespace-nowrap">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency }).format(product.price)}
          </span>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={e => {
              e.stopPropagation();
              if (!isOutOfStock) onAddToCart(product);
            }}
            aria-label={isOutOfStock ? t.outOfStock : t.buyButton}
            title={isOutOfStock ? t.outOfStock : t.buyButton}
            className={`flex h-7 w-7 md:h-8 ${isOutOfStock ? 'md:w-8 md:px-2' : 'md:w-auto md:px-3'} items-center justify-center gap-1.5 rounded-sm text-[9px] uppercase tracking-[0.14em] font-bold whitespace-nowrap transition-all active:scale-95 ${
              isOutOfStock
                ? theme === 'light'
                  ? 'bg-[#E0E0E0] text-[#1A1A1A]/60 cursor-not-allowed'
                  : 'bg-[#2A2A2A] text-[#E8E8E8]/60 cursor-not-allowed'
                :
              theme === 'light'
                ? 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'
                : 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]'
            }`}
          >
            <ShoppingCart className="w-3 h-3 flex-shrink-0" />
            {!isOutOfStock && <span className="hidden md:inline">{t.buyButton}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
