import Link from 'next/link';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import { localizePath } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
import { readCatalog } from '@/server/catalog-runtime';
import { isConnected } from '@/lib/env';
export type SupportKind = 'como' | 'regras' | 'privacidade' | 'conta';
export async function SupportPage({ params, kind }: { params: Promise<LocaleParams>; kind: SupportKind }) {
  const { locale, t } = await pageLocale(params);
  const c = extraCopy(locale);
  const page = t.support.pages[kind];
  const path = (value: string) => localizePath(value, locale);
  const catalog = await readCatalog();
  const sections: { title: string; text: string; items?: string[] }[] =
    'sections' in page
      ? page.sections.map((s) => ({ ...s, text: s.text.replace(/\b20 (modelos|models)\b/g, `${catalog.total} $1`) }))
      : [];
  if (kind === 'privacidade') sections.push({ title: c.cookieTitle, text: c.cookieText });
  return (
    <div className="container page-space">
      <nav className="breadcrumb" aria-label={t.support.ui.crumbs}>
        <Link href={path('/')}>{t.support.ui.home}</Link>
        <span>/</span>
        <span>{page.crumb}</span>
      </nav>
      <div className="support-layout">
        <aside className="support-toc">
          <p className="eyebrow">{t.support.ui.onPage}</p>
          <nav>
            {sections.map((s, i) => (
              <a key={s.title} href={`#section-${i + 1}`}>
                <span className="mono">0{i + 1}</span>
                {s.title}
              </a>
            ))}
            {'isAccount' in page && <a href="#access">{t.support.ui.access}</a>}
          </nav>
        </aside>
        <article className="support-article">
          <header className="page-heading">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className="lead">{page.intro}</p>
          </header>
          {'previewFlag' in page && !isConnected() && <p className="inline-notice">{t.support.ui.notOpen}</p>}
          {sections.map((s, i) => (
            <section className="support-section" id={`section-${i + 1}`} key={s.title}>
              <span className="mono section-number">0{i + 1}</span>
              <div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                {s.items && (
                  <dl className="pending-items">
                    {s.items.map((item) => (
                      <div key={item}>
                        <dt>{item}</dt>
                        <dd>{t.support.ui.pending}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>
          ))}
          {'isAccount' in page && (
            <section id="access" className="account-preview">
              <span className="status-label">{t.header.preview}</span>
              <h2>{page.statusTitle}</h2>
              <p>{page.statusText}</p>
              <button className="button button-google" type="button" disabled aria-describedby="login-why">
                <span aria-hidden="true">G</span>
                {page.loginLabel}
              </button>
              <p id="login-why" className="small">
                {page.loginWhy}
              </p>
            </section>
          )}
          <Link href={path('/produtos')} className="button button-primary">
            {'cta' in page ? page.cta : t.support.ui.explore} →
          </Link>
        </article>
      </div>
    </div>
  );
}
