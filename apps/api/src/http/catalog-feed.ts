import type { FastifyRequest } from 'fastify';
import type { ProductView } from '../domain/product.js';

const BRAND = 'Arateki';
const FEED_TITLE = 'Arateki Product Catalog';
const FEED_DESCRIPTION = 'Current Arateki products for shopping catalogs.';
const GOOGLE_PRODUCT_CATEGORY = 'Electronics > Electronics Accessories';
const PRODUCT_TYPE = 'Electronics > Components';

interface CatalogOffer {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock';
  condition: 'new';
  price: string;
  link: string;
  imageLink: string;
  brand: string;
  mpn: string;
  googleProductCategory: string;
  productType: string;
}

export function getCatalogSiteUrl(request: FastifyRequest, configuredSiteUrl?: string): string {
  if (configuredSiteUrl) return trimTrailingSlash(configuredSiteUrl);

  const forwardedHost = firstHeaderValue(request.headers['x-forwarded-host']);
  const host = forwardedHost ?? firstHeaderValue(request.headers.host) ?? 'arateki.com';
  const forwardedProto = firstHeaderValue(request.headers['x-forwarded-proto']);
  const proto = forwardedProto ?? (host.startsWith('localhost') ? 'http' : 'https');

  return trimTrailingSlash(`${proto}://${host}`);
}

export function buildGoogleShoppingXml(products: ProductView[], siteUrl: string): string {
  const offers = buildCatalogOffers(products, siteUrl);
  const items = offers.map(offer => [
    '    <item>',
    `      <title>${escapeXml(offer.title)}</title>`,
    `      <link>${escapeXml(offer.link)}</link>`,
    `      <description>${escapeXml(offer.description)}</description>`,
    `      <g:id>${escapeXml(offer.id)}</g:id>`,
    `      <g:image_link>${escapeXml(offer.imageLink)}</g:image_link>`,
    `      <g:availability>${offer.availability}</g:availability>`,
    `      <g:price>${escapeXml(offer.price)}</g:price>`,
    `      <g:condition>${offer.condition}</g:condition>`,
    `      <g:brand>${escapeXml(offer.brand)}</g:brand>`,
    `      <g:mpn>${escapeXml(offer.mpn)}</g:mpn>`,
    `      <g:google_product_category>${escapeXml(offer.googleProductCategory)}</g:google_product_category>`,
    `      <g:product_type>${escapeXml(offer.productType)}</g:product_type>`,
    '    </item>',
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(FEED_TITLE)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${escapeXml(FEED_DESCRIPTION)}</description>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function buildProductsTsv(products: ProductView[], siteUrl: string): string {
  const offers = buildCatalogOffers(products, siteUrl);
  const header = catalogColumns().join('\t');
  const rows = offers.map(offer => catalogColumns().map(column => sanitizeCell(columnValue(offer, column))).join('\t'));

  return [header, ...rows, ''].join('\n');
}

export function buildMetaCatalogCsv(products: ProductView[], siteUrl: string): string {
  const offers = buildCatalogOffers(products, siteUrl);
  const columns = catalogColumns();
  const header = columns.join(',');
  const rows = offers.map(offer => columns.map(column => csvCell(columnValue(offer, column))).join(','));

  return [header, ...rows, ''].join('\n');
}

function buildCatalogOffers(products: ProductView[], siteUrl: string): CatalogOffer[] {
  return products.flatMap(product => {
    const variant = product.variants.find(item => item.active && item.stock > 0) ?? product.variants.find(item => item.active);
    const imageLink = product.imageUrl ? absoluteUrl(product.imageUrl, siteUrl) : null;

    if (!variant || !imageLink || product.priceCents <= 0) return [];

    return [{
      id: product.id,
      title: product.name,
      description: product.description,
      availability: product.stock > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: formatMoney(product.priceCents, product.currency),
      link: `${siteUrl}/sales?product=${encodeURIComponent(product.id)}`,
      imageLink,
      brand: BRAND,
      mpn: variant.sku,
      googleProductCategory: GOOGLE_PRODUCT_CATEGORY,
      productType: PRODUCT_TYPE,
    }];
  });
}

function catalogColumns(): Array<keyof CatalogOffer | 'image_link' | 'google_product_category' | 'product_type'> {
  return [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'mpn',
    'google_product_category',
    'product_type',
  ];
}

function columnValue(
  offer: CatalogOffer,
  column: keyof CatalogOffer | 'image_link' | 'google_product_category' | 'product_type',
): string {
  switch (column) {
    case 'image_link':
      return offer.imageLink;
    case 'google_product_category':
      return offer.googleProductCategory;
    case 'product_type':
      return offer.productType;
    default:
      return offer[column];
  }
}

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

function absoluteUrl(value: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}/${value.replace(/^\/+/, '')}`;
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const firstValue = rawValue?.split(',')[0]?.trim();
  return firstValue || undefined;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function escapeXml(value: string): string {
  return sanitizeCell(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sanitizeCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function csvCell(value: string): string {
  return `"${sanitizeCell(value).replaceAll('"', '""')}"`;
}
