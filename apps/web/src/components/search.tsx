import { Search, ScanLine } from 'lucide-react';
import Link from 'next/link';
export function SearchForm({ initialValue = '', compact = false }: { initialValue?: string; compact?: boolean }) {
  return <form action="/produtos" role="search" className={`search-form ${compact ? 'search-compact' : ''}`}>
    <label className="search-field"><Search size={22} /><span className="sr-only">Marca, modelo ou código de barras</span><input name="q" maxLength={120} defaultValue={initialValue} placeholder="Marca, modelo ou código de barras" type="search" /></label>
    <button className="button button-primary" type="submit">Pesquisar</button>
    {!compact && <Link href="/scanner" className="scanner-link" aria-label="Escanear código de barras"><ScanLine size={20} /><span>Escanear</span></Link>}
  </form>;
}
