import Link from 'next/link';
import { MIN_COMMUNITY_REVIEWS } from '@duraverso/core';
import { isConnected } from '@/lib/env';
import { database } from '@/server/database';
import { ReviewService } from '@/server/reviews';
import { fill, getDictionary, localeMeta, localizePath, type Locale } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
export async function PublicReviews({ slug, selected, locale = 'pt' }: { slug: string; selected?: string; locale?: Locale }) {
  const t = await getDictionary(locale); const c = extraCopy(locale);
  if (!isConnected()) return <section id="experiencias" className="record-section"><h2>{t.product.experienceTitle}</h2><div className="experience-empty"><span className="mono">{t.product.zeroReports}</span><h3>{t.product.experienceEmpty}</h3><p>{t.product.experienceEmptySub}</p><div className="time-ruler" aria-hidden="true">{['0', t.product.oneYear, '2', '3', '4', '5+'].map((n) => <span key={n}>{n}</span>)}</div></div><p className="small">{c.future}</p><div className="experience-slots">{t.product.slots.map((slot) => <article key={slot.title}><h3>{slot.title}</h3><p>{slot.text}</p></article>)}</div></section>;
  const service = new ReviewService(database()); const variants = await service.variants(slug);
  if (!variants.length) return <section id="experiencias" className="empty-state"><h2>{t.product.reviewTitle}</h2><p>{c.pendingVariant}</p></section>;
  const variant = variants.find((v) => v.id === selected) ?? variants[0]!;
  const [summary, reviews] = await Promise.all([service.summary(slug, variant.id), service.published(slug, variant.id)]);
  return <section id="experiencias" className="review-list record-section"><h2>{t.product.experienceTitle}</h2><p>{t.product.variantsSub}</p><nav className="variant-links" aria-label={c.version}>{variants.map((v) => <Link key={v.id} aria-current={v.id === variant.id ? 'page' : undefined} className={`button ${v.id === variant.id ? 'button-primary' : 'button-outline'}`} href={`${localizePath(`/produtos/${slug}`, locale)}?variante=${v.id}#experiencias`}>{v.manufacturerCode} · {v.voltage} V</Link>)}</nav><div className="info-panel"><h3>{summary.average === null ? c.noAverage : `${summary.average.toLocaleString(localeMeta[locale].tag)} ${c.preliminary}`}</h3><p>{summary.count} {c.published}</p><p className="small">{fill(c.averageNote, { n: MIN_COMMUNITY_REVIEWS })}</p></div>{!reviews.length && <p>{t.product.experienceEmpty}</p>}{reviews.map((r) => <article className="info-panel" key={r.id}><h3>{r.displayName} · {r.rating}/5</h3><p className="small">{c.usedSince} {r.startedUsing} · {r.functioning === 'working' ? c.working : r.functioning === 'with_problem' ? c.problem : c.stopped} · {r.hadRepair ? c.repaired : c.noRepair}</p><p className="small">{c.original}</p><p className="review-text">{r.comment || c.noComment}</p></article>)}{summary.count > reviews.length && <p className="small">{fill(c.moreReports, { n: reviews.length })}</p>}<Link className="button button-primary" href={`/avaliar/${slug}`}>{c.share}</Link></section>;
}
