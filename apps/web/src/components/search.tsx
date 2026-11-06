import { Search, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
export async function SearchForm({ initialValue = '', compact = false, locale = 'pt', brand = '', capacity = '', category = '' }: { initialValue?: string; compact?: boolean; locale?: Locale; brand?: string; capacity?: string; category?: string }) {
  const t = await getDictionary(locale);
  return <form action={localizePath('/produtos', locale)} role="search" className={`search-form ${compact ? 'search-compact' : ''}`}>
    {category && <input type="hidden" name="category" value={category} />}{brand && <input type="hidden" name="brand" value={brand} />}{capacity && <input type="hidden" name="capacity" value={capacity} />}
    <label className="search-field"><Search size={22} aria-hidden="true" /><span className="sr-only">{t.catalog.searchLabel}</span><input name="q" maxLength={120} defaultValue={initialValue} placeholder={t.home.searchPlaceholder} type="search" /></label>
    <button className="button button-primary" type="submit">{t.home.searchButton} <span aria-hidden="true">→</span></button>
    {!compact && <Link href={localizePath('/scanner', locale)} className="scanner-link"><ScanLine size={20} aria-hidden="true" />{t.home.scanLink}</Link>}
  </form>;
}
