import type { Product } from '../types/product';

const API_URL = import.meta.env.VITE_API_URL || '/api';
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  stock?: number;
  imageUrl?: string;
  variants?: Array<{ id: string; stock?: number }>;
}

export const productService = {
  async getProducts(lang: string = 'pt', country: string = 'BR'): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products?lang=${lang}&country=${country}`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json() as { products: ApiProduct[] };

    return data.products.map((p) => {
      const selectedVariant = p.variants?.find(variant => (variant.stock ?? 0) > 0) ?? p.variants?.[0];

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.priceCents / 100,
        currency: p.currency,
        image: p.imageUrl || 'https://images.unsplash.com/photo-1553406830-ef2513020d76?q=80&w=400&auto=format&fit=crop',
        category: 'Componentes',
        variantId: selectedVariant?.id || '',
        stock: selectedVariant?.stock ?? p.stock ?? 0,
      };
    });
  }
};
