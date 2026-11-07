import Link from 'next/link';
import { productCategory, productMeasurementField } from '@duraverso/core';
import { categoryLabel, formatProductMeasure, productMeasureLabel } from '@/lib/product-presentation';
import { notFound } from 'next/navigation';
import { readProduct } from '@/server/catalog-runtime';
import { barcodeEvidence } from '@/lib/catalog-evidence';
import { PublicReviews } from '@/components/public-reviews';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import { fill, formatDate, localizePath } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
export const dynamic = 'force-dynamic';
type Params = LocaleParams & { slug: string };
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const [{ t }, { slug }] = await Promise.all([pageLocale(params), params]);
  const p = await readProduct(slug);
  return { title: p ? `${p.brand} ${p.model}` : t.catalog.emptyFiltersTitle };
}
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ variante?: string }>;
}) {
  const [{ locale, t }, { slug }, { variante }] = await Promise.all([pageLocale(params), params, searchParams]);
  const p = await readProduct(slug);
  if (!p) notFound();
  const c = extraCopy(locale);
  const path = (value: string) => localizePath(value, locale);
  const candidate = p.identification === 'candidate';
  const evidence = candidate ? barcodeEvidence[p.slug] : undefined;
  const fields: [string, string, boolean][] = [
    [t.product.brand, p.brand, true],
    [t.product.reference, p.model, true],
    [t.catalog.category, categoryLabel(productCategory(p), locale), true],
    [productMeasureLabel(p, locale), formatProductMeasure(p, locale), p[productMeasurementField(p)] !== undefined],
  ];
  return (
    <div className="container page-space">
      <nav className="breadcrumb" aria-label={t.product.breadcrumb}>
        <Link href={path('/')}>{t.support.ui.home}</Link>
        <span>/</span>
        <Link href={path('/produtos')}>{t.header.catalog}</Link>
        <span>/</span>
        <span>{p.model}</span>
      </nav>
      <section className="product-intro">
        <div className="photo-placeholder">
          <span className="mono">
            {p.brand} / {p.model}
          </span>
          <p>{t.product.photoPlaceholder}</p>
        </div>
        <div>
          <p className="eyebrow">
            {p.brand} · {categoryLabel(productCategory(p), locale)}
          </p>
          <h1>{p.model}</h1>
          <p className="lead">
            {categoryLabel(productCategory(p), locale)} · {formatProductMeasure(p, locale)}
          </p>
          <dl className="product-summary">
            <div>
              <dt>{t.product.summaryId}</dt>
              <dd className={candidate ? 'pending-text' : 'verified-text'}>
                {candidate ? c.candidate : t.common.verified}
              </dd>
            </div>
            <div>
              <dt>{t.product.summaryVoltage}</dt>
              <dd>{t.common.toConfirm}</dd>
            </div>
            <div>
              <dt>{t.product.summaryReports}</dt>
              <dd>
                <a href="#experiencias">{c.reportsInRecords} ↓</a>
              </dd>
            </div>
          </dl>
          <p className="small">{fill(t.product.checkedOn, { date: formatDate(p.sourceCheckedAt, locale) })}</p>
        </div>
      </section>
      <div className="record-layout">
        <div>
          <section className="record-section">
            <h2>{t.product.knownTitle}</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.product.field}</th>
                  <th>{t.product.value}</th>
                  <th>{t.product.status}</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(([label, value, documented]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                    <td className={documented ? undefined : 'pending-text'}>
                      {documented ? (candidate ? c.identity : t.common.verified) : t.common.toConfirm}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">{t.product.voltage}</th>
                  <td>{t.product.voltageNote}</td>
                  <td className="pending-text">{t.common.toConfirm}</td>
                </tr>
              </tbody>
            </table>
            <p>
              <a className="text-link" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                {t.product.sourceMaker} ↗
              </a>
            </p>
            {evidence && (
              <p>
                <a className="text-link" href={evidence.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {t.product.sourceCodes} ↗
                </a>
              </p>
            )}
          </section>
          <section className="record-section">
            <h2>{c.documentedCodes}</h2>
            <p>{t.product.variantsSub}</p>
            {p.confirmedGtins.length ? (
              <ul className="code-list">
                {p.confirmedGtins.map((code) => (
                  <li key={code}>
                    <code>{code}</code>
                    <span>
                      {t.product.voltage}: {t.common.toConfirm}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{c.noCodes}</p>
            )}
            {candidate && <p className="small">{c.pendingVariant}</p>}
          </section>
          <PublicReviews slug={p.slug} selected={variante} locale={locale} />
        </div>
        <aside className="record-sidebar">
          <h2>{t.product.nextTitle}</h2>
          <section>
            <h3>{t.product.voltageHowTitle}</h3>
            <p>{t.product.voltageHowText}</p>
          </section>
          <section>
            <h3>{t.product.ownersTitle}</h3>
            <p>{candidate ? t.product.ownersText : c.openSubmissions}</p>
            <Link className="text-link" href={path('/regras')}>
              {t.footer.rules} →
            </Link>
          </section>
          <Link
            className="text-link"
            href={`${path('/produtos')}?category=${productCategory(p)}&brand=${encodeURIComponent(p.brand)}`}
          >
            {t.home.catalogAll} →
          </Link>
        </aside>
      </div>
    </div>
  );
}
