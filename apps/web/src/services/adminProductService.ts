/** Frontend types mirroring the Rust API product JSON (camelCase). */
export interface LocalizedText {
  pt: string;
  en: string;
  es: string;
  zh: string;
  ja: string;
}

export interface ProductPrices {
  brlCents: number;
  usdCents: number;
}

export interface ProductVariantInput {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  prices: ProductPrices;
  stock: number;
  active?: boolean;
}

export interface RawProduct {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string;
  variants: Array<ProductVariantInput & { id: string }>;
  active: boolean;
}

export interface RawProductInput {
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string;
  variants: ProductVariantInput[];
  active?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const adminProductService = {
  async getProducts(token: string): Promise<RawProduct[]> {
    const response = await fetch(`${API_URL}/admin/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    return data.products;
  },

  async getProduct(token: string, id: string): Promise<RawProduct> {
    const response = await fetch(`${API_URL}/admin/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    const data = await response.json();
    return data.product;
  },

  async createProduct(token: string, product: RawProductInput): Promise<RawProduct> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      throw new Error('Failed to create product');
    }

    const data = await response.json();
    return data.product;
  },

  async updateProduct(token: string, id: string, product: RawProductInput): Promise<RawProduct> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      throw new Error('Failed to update product');
    }

    const data = await response.json();
    return data.product;
  }
};
