import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, SearchX, SlidersHorizontal } from 'lucide-react';
import { brands, isValidGtin } from '@duraverso/core';
import { catalogResponse } from '@/lib/catalog';
import { Breadcrumb, PreparationNotice, ProductCard } from '@/components/ui';
import { SearchForm } from '@/components/search';
export const metadata: Metadata = { title: 'Explorar produtos' };
type Query = { q?: string; brand?: string; capacity?: string };
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.slice(0, 120) : '';
  const brand = brands.includes(params.brand as typeof brands[number]) ? params.brand! : '';
  const capacity = ['small', 'medium', 'large'].includes(params.capacity ?? '') ? params.capacity! : '';
  const result = catalogResponse(q, brand, capacity);
  const isCode = isValidGtin(q.replace(/[\s-]/g, ''));
  const hasFilters = Boolean(brand || capacity);
  const emptyTitle = hasFilters ? 'Nenhum modelo com esses filtros.'
    : isCode ? 'Código recebido. Produto ainda não cadastrado.' : 'Ainda não encontramos esse produto.';
  const emptyMessage = hasFilters ? 'Retire os filtros para consultar esse código ou modelo em todo o catálogo.'
    : isCode ? 'A consulta foi concluída. Nosso catálogo inicial contém apenas lavadoras, e esse código ainda não está incluído. Você pode escanear outro produto ou explorar os modelos disponíveis.'
      : 'Confira a marca ou o código do modelo na etiqueta. Nosso catálogo inicial contém apenas lavadoras.';
  return <div className="container page-space"><Breadcrumb current="Explorar produtos" /><div className="page-heading"><span className="eyebrow muted">CATÁLOGO INICIAL</span><h1>Encontre a próxima história.</h1><p>Pesquise seu modelo e conheça as informações disponíveis.</p></div><SearchForm key={q} initialValue={q} compact /><PreparationNotice />
    <div className="catalog-layout"><aside className="filters"><h2><SlidersHorizontal size={18} /> Filtrar produtos</h2><form action="/produtos"><input type="hidden" name="q" value={q} /><label htmlFor="brand">Marca</label><select id="brand" name="brand" defaultValue={brand} key={brand}><option value="">Todas as marcas</option>{brands.map((name) => <option key={name}>{name}</option>)}</select><label htmlFor="capacity">Capacidade</label><select id="capacity" name="capacity" defaultValue={capacity} key={capacity}><option value="">Todas as capacidades</option><option value="small">Até 10 kg</option><option value="medium">Mais de 10 até 13 kg</option><option value="large">Mais de 13 kg</option></select><button className="button button-primary" type="submit">Aplicar filtros</button><Link href="/produtos" className="clear-filters">Limpar pesquisa e filtros</Link></form><div className="filter-note"><strong>Um catálogo em construção.</strong><p>Começamos com lavadoras. Cada modelo terá suas variantes conferidas antes de receber avaliações.</p></div></aside>
    <section aria-label="Resultados da pesquisa"><div className="results-heading"><p><strong>{result.total}</strong> {result.total === 1 ? 'modelo encontrado' : 'modelos encontrados'}{q && <> para <strong>“{q}”</strong></>}</p><span>Ordem do catálogo</span></div>{result.total > 0 ? <div className="catalog-grid">{result.data.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><SearchX size={42} /><h2>{emptyTitle}</h2><p>{emptyMessage}</p>{hasFilters ? <p><Link href={`/produtos?q=${encodeURIComponent(q)}`} className="text-link">Retirar filtros e manter a busca</Link></p> : null}{isCode ? <p><Link href="/scanner" className="button button-outline">Escanear outro código</Link></p> : null}<Link href="/produtos" className="button button-primary">Ver todos os modelos <ArrowRight size={17} /></Link><p className="small">Sugestões de cadastro serão abertas junto com as contas.</p></div>}</section></div></div>;
}
