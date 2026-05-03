import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useAppConfig } from '../../hooks/useAppConfig';
import { adminProductService, type RawProduct } from '../../services/adminProductService';

export default function AdminProducts() {
  const { token } = useAuth();
  const { theme, lang, t } = useAppConfig();
  const isDark = theme === 'dark';
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const data = await adminProductService.getProducts(token);
        setProducts(data);
        setError('');
      } catch {
        setError(t.admin.products.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProducts();
  }, [token]);

  if (isLoading) {
    return <div className="text-center py-20">{t.admin.products.loading}</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t.admin.products.title}</h1>
        <Link
          to="/manage/products/new"
          className="flex items-center gap-2 bg-[#E0E0E0] text-[#181818] px-4 py-2 rounded-sm text-xs uppercase tracking-widest font-bold hover:bg-[#CACACA] transition-colors"
        >
          <Plus size={16} />
          {t.admin.products.newProduct}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className={`col-span-full border rounded-lg p-12 text-center text-gray-500 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
            {t.admin.products.empty}
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className={`border rounded-lg overflow-hidden flex flex-col ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
              <div className={`aspect-video relative overflow-hidden border-b ${isDark ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#F0F0F0] border-[#E0E0E0]'}`}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name[lang] || product.name.pt} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">{t.admin.products.noImage}</div>
                )}
                <div className="absolute top-2 right-2">
                  {product.active ? (
                    <span className="bg-green-500/20 text-green-500 text-[10px] uppercase font-bold px-2 py-1 rounded-sm border border-green-500/30 flex items-center gap-1">
                      <Eye size={10} /> {t.admin.common.active}
                    </span>
                  ) : (
                    <span className="bg-red-500/20 text-red-500 text-[10px] uppercase font-bold px-2 py-1 rounded-sm border border-red-500/30 flex items-center gap-1">
                      <EyeOff size={10} /> {t.admin.common.inactive}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold mb-1 uppercase tracking-tight line-clamp-1">{product.name[lang] || product.name.pt}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">{product.description[lang] || product.description.pt}</p>

                <div className={`mt-auto pt-4 border-t flex justify-between items-center ${isDark ? 'border-[#2A2A2A]' : 'border-[#E0E0E0]'}`}>
                  <div className="text-sm">
                    <span className="text-gray-500">{t.admin.products.sku}:</span> <span className="font-mono">{product.variants[0]?.sku || '-'}</span>
                  </div>
                  <Link
                    to={`/manage/products/${product.id}/edit`}
                    className={`p-2 text-gray-400 rounded-sm transition-colors ${isDark ? 'hover:text-white hover:bg-[#2A2A2A]' : 'hover:text-[#181818] hover:bg-[#F0F0F0]'}`}
                  >
                    <Edit2 size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
