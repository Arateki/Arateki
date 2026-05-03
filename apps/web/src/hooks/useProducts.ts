import { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import { productService } from '../services/productService';
import { useAppConfig } from './useAppConfig';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useAppConfig();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getProducts(lang);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar produtos. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [lang]);

  return { products, isLoading, error };
}
