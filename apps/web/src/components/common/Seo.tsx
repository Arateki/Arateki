import {
  absoluteUrl,
  allOgLocales,
  canonical,
  DEFAULT_OG_IMAGE,
  HTML_LANG,
  langPath,
  ogLocale,
  stripLangFromPath,
  SUPPORTED_LANGS,
  type LangCode,
} from '../../lib/seo';

interface SeoProps {
  title: string;
  description: string;
  path: string;
  lang: LangCode;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
}

export const Seo = ({ title, description, path, lang, noindex, ogImage, ogType = 'website' }: SeoProps) => {
  const url = canonical(path);
  const image = absoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);
  const locale = ogLocale(lang);
  const otherLocales = allOgLocales().filter(item => item !== locale);

  const localPath = stripLangFromPath(path);
  const alternates = SUPPORTED_LANGS.map(code => ({
    code,
    hreflang: HTML_LANG[code],
    href: absoluteUrl(langPath(code, localPath)),
  }));
  const xDefaultHref = absoluteUrl(localPath);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {!noindex && alternates.map(item => (
        <link key={item.code} rel="alternate" hrefLang={item.hreflang} href={item.href} />
      ))}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Arateki" />
      <meta property="og:locale" content={locale} />
      {otherLocales.map(item => (
        <meta key={item} property="og:locale:alternate" content={item} />
      ))}
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
    </>
  );
};
