import type { ProductView } from '../domain/product.js';

const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

const HREFLANG_TAGS: Record<Lang, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  zh: 'zh-CN',
  ja: 'ja',
};

interface SitemapEntry {
  path: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  lastmod?: Date;
}

const STATIC_PATHS: Array<{ path: string; changefreq: NonNullable<SitemapEntry['changefreq']>; priority: number }> = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/sales', changefreq: 'daily', priority: 0.9 },
];

export function buildSitemapXml(products: ProductView[], siteUrl: string): string {
  const urls: string[] = [];

  // Static pages × languages
  for (const entry of STATIC_PATHS) {
    for (const lang of SUPPORTED_LANGS) {
      urls.push(renderUrlWithAlternates({
        path: localizedPath(lang, entry.path),
        changefreq: entry.changefreq,
        priority: entry.priority,
      }, entry.path, siteUrl));
    }
  }

  // Products × languages
  for (const product of products) {
    const productPath = `/sales/${encodeURIComponent(product.id)}`;
    for (const lang of SUPPORTED_LANGS) {
      urls.push(renderUrlWithAlternates({
        path: localizedPath(lang, productPath),
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: product.updatedAt,
      }, productPath, siteUrl));
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls.join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

function localizedPath(lang: Lang, path: string): string {
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

function renderUrlWithAlternates(entry: SitemapEntry, basePath: string, siteUrl: string): string {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>`,
  ];
  if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod.toISOString()}</lastmod>`);
  if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);

  for (const lang of SUPPORTED_LANGS) {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${HREFLANG_TAGS[lang]}" href="${escapeXml(`${siteUrl}${localizedPath(lang, basePath)}`)}" />`,
    );
  }
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${siteUrl}${basePath}`)}" />`,
  );
  lines.push('  </url>');

  return lines.join('\n');
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
