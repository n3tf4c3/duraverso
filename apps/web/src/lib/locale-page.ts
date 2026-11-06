import { notFound } from 'next/navigation';
import { getDictionary, isLocale } from './i18n';
export type LocaleParams = { locale: string };
export async function pageLocale(params: Promise<LocaleParams>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: await getDictionary(locale) };
}
