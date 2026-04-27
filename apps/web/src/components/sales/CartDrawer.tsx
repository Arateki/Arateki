import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/useCart';

interface CartDrawerProps {
  theme: 'light' | 'dark';
}

export const CartDrawer = ({ theme }: CartDrawerProps) => {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  const isDark = theme === 'dark';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isDark ? 'bg-[#161616] border-l border-[#2A2A2A]' : 'bg-white border-l border-[#E0E0E0]'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#333333]' : 'border-[#E0E0E0]'}`}>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Carrinho</h2>
          <button
            onClick={closeCart}
            className={`p-1.5 rounded-sm transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <ShoppingBag className="w-16 h-16" />
              <p className="text-sm uppercase tracking-widest font-light">Carrinho vazio</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className={`flex gap-3 pb-4 border-b last:border-b-0 ${isDark ? 'border-[#222222]' : 'border-[#F0F0F0]'}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest opacity-50 mb-0.5">{product.category}</p>
                  <p className="text-sm font-bold uppercase tracking-tight truncate">{product.name}</p>
                  <p className="text-sm font-bold mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency }).format(product.price)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`flex items-center rounded-sm border ${isDark ? 'border-[#333333]' : 'border-[#E0E0E0]'}`}>
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className={`p-1 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm font-bold">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className={`p-1 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-[#333333]' : 'border-[#E0E0E0]'} space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-60">Total</span>
              <span className="text-lg font-black">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
              </span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className={`block w-full py-3 text-center text-[11px] uppercase tracking-[0.25em] font-bold rounded-sm transition-all ${
                isDark ? 'bg-[#E0E0E0] text-[#181818] hover:bg-[#CACACA]' : 'bg-[#1D1D1D] text-[#F0F0F0] hover:bg-[#2E2E2E]'
              }`}
            >
              Finalizar Compra
            </Link>
            <button
              onClick={clearCart}
              className="w-full text-[10px] uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  );
};
