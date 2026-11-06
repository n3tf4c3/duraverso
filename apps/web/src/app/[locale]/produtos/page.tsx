import Link from 'next/link';
import { brands, filterCatalog, isValidGtin, productCategories, productCategory, type ProductCategory } from '@duraverso/core';
import { readCatalog } from '@/server/catalog-runtime';
import { SearchForm } from '@/components/search';
import { CatalogFilters } from '@/components/catalog-filters';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import { fill, localizePath } from '@/lib/i18n';
import { categoryLabel, formatProductMeasure } from '@/lib/product-presentation';
import { extraCopy } from '@/lib/copy';
type Query = { q?: string; brand?: string; capacity?: string; category?: string };
export async function generateMetadata({ params }: { params: Promise<LocaleParams> }) { const { t } = await pageLocale(params); return { title: t.catalog.title }; }
export default async function ProductsPage({ params, searchParams }: { params: Promise<LocaleParams>; searchParams: Promise<Query> }) {
  const [{ locale, t }, query, catalog] = await Promise.all([pageLocale(params), searchParams, readCatalog()]);
  const c = extraCopy(locale); const path = (value: string) => localizePath(value, locale);
  const q = typeof query.q === 'string' ? query.q.slice(0, 120) : '';
  const brand = brands.includes(query.brand as typeof brands[number]) ? query.brand! : '';
  const category = productCategories.includes(query.category as ProductCategory) ? query.category as ProductCategory : '';
  const capacity = ['small', 'medium', 'large'].includes(query.capacity ?? '') ? query.capacity! : '';
  const result = filterCatalog(catalog, q, brand, capacity, category); const preview = catalog.mode === 'local_catalog';
  const isCode = isValidGtin(q.replace(/[\s-]/g, '')); const hasFilters = Boolean(brand || capacity || category);
  function without(key: string) { const nextQuery = new URLSearchParams({ q, brand, capacity, category }); nextQuery.delete(key); return `${path('/produtos')}?${nextQuery}`; }
  return <div className="container page-space">
    <nav className="breadcrumb" aria-label={t.support.ui.crumbs}><Link href={path('/')}>{t.support.ui.home}</Link><span>/</span><span>{t.header.catalog}</span></nav>
    <div className="page-heading"><h1>{t.catalog.title}</h1><p>{fill(c.catalogSub, { n: catalog.total })}</p>{preview && <span className="status-label">{c.candidate}</span>}</div>
    <SearchForm locale={locale} initialValue={q} brand={brand} capacity={capacity} category={category} compact />
    <div className="catalog-layout">
      <CatalogFilters key={`${q}:${brand}:${capacity}:${category}`} locale={locale} labels={t.catalog} q={q} brand={brand} capacity={capacity} category={category} />
      <section className="catalog-results" aria-label={t.catalog.title}>
        <div className="results-heading"><p>{fill(result.total === 1 ? t.catalog.countOne : t.catalog.countMany, { n: result.total })} {q && fill(t.catalog.countFor, { q })}</p><span>{t.catalog.order}</span></div>
        {hasFilters && <div className="filter-chips" aria-label={t.catalogMobile.applied}>
          {category && <Link href={without('category')} aria-label={`${t.catalogMobile.removeFilter}: ${categoryLabel(category, locale)}`}>{categoryLabel(category, locale)} ×</Link>}
          {brand && <Link href={without('brand')} aria-label={`${t.catalogMobile.removeFilter}: ${brand}`}>{brand} ×</Link>}
          {capacity && <Link href={without('capacity')} aria-label={`${t.catalogMobile.removeFilter}: ${t.catalog.capacity}`}>{capacity === 'small' ? t.catalog.capUpTo10 : capacity === 'medium' ? t.catalog.cap10to13 : t.catalog.capOver13} ×</Link>}
        </div>}
        {result.total ? <div className="catalog-table">
          <div className="catalog-row catalog-table-head" aria-hidden="true"><span>{t.catalog.colModel}</span><span>{t.catalog.colBrand}</span><span>{t.catalog.colCapacity}</span><span>{preview ? t.catalog.colReports : t.product.summaryId}</span><span>{t.catalog.colAction}</span></div>
          <ul>{result.data.map((p) => <li key={p.id} className="catalog-row">
            <div className="model-name"><strong><Link href={path(`/produtos/${p.slug}`)}>{p.model}</Link></strong><span className="row-category">{categoryLabel(productCategory(p), locale)}</span></div>
            <span className="row-brand">{p.brand}</span><span className="row-capacity">{formatProductMeasure(p, locale)}</span><span className="row-status">{preview ? t.common.noReportsYet : t.common.verified}</span>
            <Link className="text-link row-action" href={path(`/produtos/${p.slug}`)} aria-label={`${t.common.viewRecord}: ${p.brand} ${p.model}`}>{t.common.viewRecord} ↗</Link>
          </li>)}</ul>
        </div> : <div className="empty-state"><span className="mono">∅</span><h2>{hasFilters ? t.catalog.emptyFiltersTitle : fill(t.catalog.emptyQueryTitle, { q })}</h2><p>{isCode ? c.noMatch : hasFilters ? t.catalog.emptyFiltersText : t.catalog.emptyQueryText}</p>{hasFilters && <Link className="text-link" href={`${path('/produtos')}?q=${encodeURIComponent(q)}`}>{t.catalogMobile.clearFiltersOnly} →</Link>}<Link className="text-link" href={path('/scanner')}>{t.catalog.emptyScan} →</Link><p className="small">{t.common.market}</p></div>}
        <p className="small section-footnote">{t.catalog.footnote}</p>
      </section>
    </div>
  </div>;
}
