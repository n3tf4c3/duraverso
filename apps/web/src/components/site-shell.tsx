import Link from 'next/link';
import { Suspense } from 'react';
import { getDictionary, localizePath, type Locale } from '@/lib/i18n';
import { isConnected } from '@/lib/env';
import { LanguageSwitcher } from './language-switcher';
import { LocaleProvider } from './locale-provider';

export function Mark() {
  return (
    <svg width="29" height="30" viewBox="0 0 29 30" fill="none" aria-hidden="true">
      <path d="M1 27H28M3 27V20M9 27V16M15 27V11M21 27V6M27 27V1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
export async function SiteShell({
  children,
  locale = 'pt',
  operational = false,
}: {
  children: React.ReactNode;
  locale?: Locale;
  operational?: boolean;
}) {
  const t = await getDictionary(locale);
  const url = (path: string) => localizePath(path, locale);
  return (
    <LocaleProvider locale={locale}>
      <a className="skip-link" href="#conteudo">
        {t.header.skip}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link href={url('/')} className="brand" aria-label={`Duraverso · ${t.header.home}`}>
            <Mark />
            duraverso
          </Link>
          <nav aria-label={t.header.navLabel}>
            <Link href={url('/produtos')}>{t.header.catalog}</Link>
            <Link href={url('/scanner')}>{t.header.scan}</Link>
            <Link href={url('/como-funciona')}>{t.header.how}</Link>
          </nav>
          {!isConnected() && <span className="header-status">{t.header.preview}</span>}
          {!operational && (
            <Suspense fallback={<span className="language-placeholder">{locale.toUpperCase()}</span>}>
              <LanguageSwitcher locale={locale} labels={t.header} />
            </Suspense>
          )}
        </div>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Link href={url('/')} className="brand">
              <Mark />
              duraverso
            </Link>
            <p>{t.footer.tagline}</p>
            <p className="small">{t.common.market}</p>
          </div>
          <nav aria-label={t.footer.navLabel}>
            {['como-funciona', 'regras', 'privacidade', 'conta'].map((path, i) => (
              <Link key={path} href={url(`/${path}`)}>
                {t.support.ui.links[i]}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </LocaleProvider>
  );
}
