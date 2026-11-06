import Link from 'next/link';
import { productCategory } from '@duraverso/core';
import { categoryLabel, formatProductMeasure } from '@/lib/product-presentation';
import { readCatalog } from '@/server/catalog-runtime';
import { SearchForm } from '@/components/search';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import { fill, localizePath } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
export default async function Home({ params }: { params: Promise<LocaleParams> }) {
  const [{ locale, t }, result] = await Promise.all([pageLocale(params), readCatalog()]);
  const c = extraCopy(locale); const path = (value: string) => localizePath(value, locale);
  const preview = result.mode === 'local_catalog';
  const brands = [...new Set(result.data.map((product) => product.brand))];
  return <div className="container"><section className="home-hero"><div><p className="eyebrow">{preview ? t.home.eyebrow : t.common.market}</p><h1>{t.home.title}</h1><p className="lead">{t.home.lead}</p><SearchForm locale={locale} /></div><aside className="archive-status"><h2>{t.home.statusTitle}</h2><dl><div><dt>{preview ? c.candidates : c.checkedModels}</dt><dd>{result.total}</dd></div><div><dt>{t.home.statusCodes}</dt><dd>{new Set(result.data.flatMap((p) => p.confirmedGtins)).size}</dd></div><div><dt>{t.home.statusReports}</dt><dd>{preview ? '0' : c.reportsInRecords}</dd></div><div><dt>{t.home.statusSubmissions}</dt><dd>{preview ? t.home.statusSubmissionsValue : c.openSubmissions}</dd></div></dl>{preview && <p className="small">{t.home.statusNote}</p>}</aside></section>
    <section className="section brand-section"><div className="section-heading"><div><h2>{t.home.catalogTitle}</h2><p>{fill(c.catalogSub, { n: result.total })}</p></div><Link className="text-link" href={path('/produtos')}>{t.home.catalogAll} →</Link></div><nav className="category-index" aria-label={t.catalog.category}>{[...new Set(result.data.map(productCategory))].map((category) => <Link key={category} href={`${path('/produtos')}?category=${category}`}>{categoryLabel(category, locale)} <span className="mono">{result.data.filter((p) => productCategory(p) === category).length}</span></Link>)}</nav><div className="brand-index">{brands.map((brand) => <section key={brand}><h3>{brand}<span>{result.data.filter((p) => p.brand === brand).length.toString().padStart(2, '0')}</span></h3><ul>{result.data.filter((p) => p.brand === brand).map((p) => <li key={p.id}><Link href={path(`/produtos/${p.slug}`)}><strong>{p.model}<small className="home-category">{categoryLabel(productCategory(p), locale)}</small></strong><span>{formatProductMeasure(p, locale)}</span><span aria-hidden="true">↗</span></Link></li>)}</ul></section>)}</div>{!result.total && <p>{c.emptyCatalog}</p>}{preview && <p className="small section-footnote">{t.home.catalogNoReports}</p>}</section>
    <section className="section"><div className="section-heading"><h2>{t.home.howTitle}</h2><Link className="text-link" href={path('/como-funciona')}>{t.header.how} →</Link></div>{preview && <p className="small">{c.future}</p>}<div className="principles">{t.home.how.map((item, index) => <article key={item.title}><span className="mono">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    <section className="owners-note"><h2>{t.home.ownersTitle}</h2><div><p>{preview ? t.home.ownersText : c.openSubmissions}</p><Link className="text-link" href={path('/regras')}>{t.home.ownersLink} →</Link></div></section>
  </div>;
}
