export const locales = ['pt', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const LOCALE_COOKIE = 'duraverso_locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const localeMeta = {
  pt: { tag: 'pt-BR', name: 'Português', country: 'Brasil', short: 'PT' },
  en: { tag: 'en-US', name: 'English', country: 'United States', short: 'EN' },
  es: { tag: 'es-ES', name: 'Español', country: 'España', short: 'ES' },
} as const;
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
export function stripLocale(path: string) {
  return path.replace(/^\/(pt|en|es)(?=\/|$|\?|#)/, '') || '/';
}
export function localizePath(path: string, locale: Locale) {
  const base = stripLocale(path);
  return locale === 'pt' ? base : `/${locale}${base === '/' ? '' : base}`;
}
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
export function formatKg(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(localeMeta[locale].tag, { maximumFractionDigits: 1 }).format(value)} kg`;
}
export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeMeta[locale].tag, {
    timeZone: 'UTC',
    day: '2-digit',
    month: locale === 'en' ? 'short' : '2-digit',
    year: 'numeric',
  }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));
}
const dictionaries = {
  pt: () => import('@/messages/pt.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
  es: () => import('@/messages/es.json').then((m) => m.default),
};
export type Dictionary = Awaited<ReturnType<typeof dictionaries.pt>>;
export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
export function alternateLanguages(path: string) {
  return Object.fromEntries(locales.map((locale) => [localeMeta[locale].tag, localizePath(path, locale)]));
}
