export const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'] as const;
export type LangCode = typeof SUPPORTED_LANGS[number];

export const DEFAULT_LANG: LangCode = 'pt';

const FALLBACK_SITE_URL = 'https://arateki.com';

const rawSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? FALLBACK_SITE_URL;

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const canonical = (path: string): string => absoluteUrl(path);

const LANG_PREFIX_REGEX = /^\/(pt|en|es|zh|ja)(\/|$)/;

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function langPath(lang: LangCode, path = '/'): string {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  if (cleaned === '/') return `/${lang}`;
  return `/${lang}${cleaned}`;
}

export function stripLangFromPath(pathname: string): string {
  const match = pathname.match(LANG_PREFIX_REGEX);
  if (!match) return pathname || '/';
  const remainder = pathname.slice(match[0].length - (match[2] === '/' ? 1 : 0));
  return remainder.startsWith('/') ? remainder : `/${remainder}`;
}

export function extractLangFromPath(pathname: string): LangCode | null {
  const match = pathname.match(LANG_PREFIX_REGEX);
  return match && isLangCode(match[1]) ? match[1] : null;
}

export function pickPreferredLang(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = window.localStorage?.getItem('arateki-lang');
  if (isLangCode(stored)) return stored;
  const navLang = window.navigator?.language?.split('-')[0];
  return isLangCode(navLang) ? navLang : DEFAULT_LANG;
}

const OG_LOCALES: Record<LangCode, string> = {
  pt: 'pt_BR',
  en: 'en_US',
  es: 'es_ES',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

export const HTML_LANG: Record<LangCode, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  zh: 'zh-CN',
  ja: 'ja',
};

export const ogLocale = (lang: LangCode): string => OG_LOCALES[lang];

export const allOgLocales = (): string[] => Object.values(OG_LOCALES);

export const DEFAULT_OG_IMAGE = '/og-image.png';
