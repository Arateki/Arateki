import type { ClientSession } from 'mongodb';

export type Currency = 'BRL' | 'USD';
export type ProductLocale = 'pt' | 'en' | 'es' | 'zh' | 'ja';

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

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  prices: ProductPrices;
  stock: number;
  active: boolean;
}

export interface ProductVariantInput {
  id?: string | undefined;
  sku: string;
  attributes: Record<string, string>;
  prices: ProductPrices;
  stock: number;
  active?: boolean | undefined;
}

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string | undefined;
  variants: ProductVariant[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductInput {
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string | undefined;
  variants: ProductVariantInput[];
  active?: boolean | undefined;
}

export interface ProductListOptions {
  currency: Currency;
  locale: ProductLocale;
}

export interface ProductView {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | undefined;
  priceCents: number;
  currency: Currency;
  stock: number;
  variants: ProductVariantView[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantView {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  priceCents: number;
  currency: Currency;
  stock: number;
  active: boolean;
}

export interface ProductRepository {
  listActive(): Promise<Product[]>;
  listAll(): Promise<Product[]>;
  findActiveById(id: string, session?: ClientSession): Promise<Product | null>;
  findById(id: string, session?: ClientSession): Promise<Product | null>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product | null>;
  seedIfEmpty(products: Product[]): Promise<void>;
  decrementStock(productId: string, variantId: string, quantity: number, session?: ClientSession): Promise<void>;
}

export function toProductView(product: Product, options: ProductListOptions): ProductView {
  const variants = product.variants
    .filter(variant => variant.active)
    .map(variant => toProductVariantView(variant, options.currency));
  const prices = variants.map(variant => variant.priceCents);

  return {
    id: product.id,
    name: product.name[options.locale] || product.name.en,
    description: product.description[options.locale] || product.description.en,
    imageUrl: product.imageUrl,
    priceCents: prices.length > 0 ? Math.min(...prices) : 0,
    currency: options.currency,
    stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    variants,
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toProductVariantView(variant: ProductVariant, currency: Currency): ProductVariantView {
  return {
    id: variant.id,
    sku: variant.sku,
    attributes: variant.attributes,
    priceCents: currency === 'BRL' ? variant.prices.brlCents : variant.prices.usdCents,
    currency,
    stock: variant.stock,
    active: variant.active,
  };
}
