import { Children, isValidElement, type ReactNode } from 'react';
import type { Product } from '../types/product';
import { absoluteUrl, langPath, SITE_URL, type LangCode } from './seo';

type Json = Record<string, unknown>;

interface FaqEntry { question: string; answer: string }
interface Crumb { name: string; path: string }

export function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join(' ').trim();
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return Children.toArray(props.children).map(nodeToText).join(' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

export function organizationLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Arateki',
    url: SITE_URL,
    logo: absoluteUrl('/04_arateki_white.svg'),
    description: 'Hardware open-source com foco em privacidade, autonomia e direito ao reparo.',
    sameAs: [
      'https://github.com/Arateki/Arateki',
      'https://github.com/Arateki/Raiznet',
      'https://github.com/Arateki/Safrasense',
    ],
  };
}

export function websiteLd(lang: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Arateki',
    inLanguage: lang,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

export function faqPageLd(items: FaqEntry[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbLd(crumbs: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function productLd(product: Product, lang: LangCode): Json {
  const url = absoluteUrl(langPath(lang, `/sales/${encodeURIComponent(product.id)}`));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: product.name,
    description: product.description,
    sku: product.id,
    mpn: product.id,
    category: product.category,
    image: product.image ? absoluteUrl(product.image) : undefined,
    brand: { '@type': 'Brand', name: 'Arateki' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
}

export function itemListLd(products: Product[], lang: LangCode): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(langPath(lang, `/sales/${encodeURIComponent(product.id)}`)),
      name: product.name,
    })),
  };
}
