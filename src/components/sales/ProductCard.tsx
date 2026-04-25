import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
  theme: 'light' | 'dark';
}

export const ProductCard = ({ product, theme }: ProductCardProps) => {
  return (
    <div className={`group rounded-lg overflow-hidden transition-all duration-300 border ${
      theme === 'light' 
        ? 'bg-white border-[#E0E0E0] hover:border-black/20' 
        : 'bg-[#121212] border-[#333333] hover:border-white/20'
    }`}>
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6">
        <span className="text-[10px] uppercase tracking-widest opacity-50 mb-2 block">
          {product.category}
        </span>
        <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{product.name}</h3>
        <p className="text-sm opacity-70 mb-6 line-clamp-3 h-15">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency }).format(product.price)}
          </span>
          <button className={`px-4 py-2 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
            theme === 'light'
              ? 'bg-black text-white hover:bg-black/80'
              : 'bg-white text-black hover:bg-white/80'
          }`}>
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
};
