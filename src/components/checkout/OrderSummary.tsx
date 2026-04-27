import type { CartItem } from '../../context/CartContext';
import type { ShippingOption } from '../../types/checkout';
import type { Product } from '../../types/product';
import type { TranslationType } from '../../types/i18n';

interface OrderSummaryProps {
  items: CartItem[];
  shipping: ShippingOption | null;
  theme: 'light' | 'dark';
  tCo: TranslationType['checkout'];
  onOpenProduct?: (product: Product) => void;
}

export const OrderSummary = ({ items, shipping, theme, tCo, onOpenProduct }: OrderSummaryProps) => {
  const isDark = theme === 'dark';
  const subtotal = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  const total = subtotal + (shipping?.price ?? 0);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className={`rounded-lg border p-6 space-y-4 ${
      isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8E8E8]'
    }`}>
      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-80">{tCo.summary.title}</h3>

      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className={`flex gap-3 items-center ${onOpenProduct ? 'cursor-pointer group' : ''}`}
            onClick={() => onOpenProduct?.(product)}
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity ${onOpenProduct ? 'group-hover:opacity-75' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-tight truncate transition-opacity ${onOpenProduct ? 'group-hover:opacity-70' : ''}`}>
                {product.name}
              </p>
              <p className="text-[10px] opacity-70 font-medium">{tCo.summary.qty}: {quantity}</p>
            </div>
            <span className="text-xs font-bold flex-shrink-0">{fmt(product.price * quantity)}</span>
          </div>
        ))}
      </div>

      <div className={`border-t pt-4 space-y-2 ${isDark ? 'border-[#2A2A2A]' : 'border-[#E8E8E8]'}`}>
        <div className="flex justify-between text-xs">
          <span className="opacity-80 font-medium">{tCo.summary.subtotal}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="opacity-80 font-medium">{tCo.summary.shipping}</span>
          <span>{shipping ? fmt(shipping.price) : '—'}</span>
        </div>
      </div>

      <div className={`border-t pt-4 flex justify-between ${isDark ? 'border-[#2A2A2A]' : 'border-[#E8E8E8]'}`}>
        <span className="text-[11px] uppercase tracking-widest font-bold">{tCo.summary.total}</span>
        <span className="text-lg font-black">{fmt(total)}</span>
      </div>
    </div>
  );
};
