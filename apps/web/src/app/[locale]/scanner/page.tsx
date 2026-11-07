import Link from 'next/link';
import { Scanner } from '@/components/scanner';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import { localizePath } from '@/lib/i18n';
export async function generateMetadata({ params }: { params: Promise<LocaleParams> }) {
  const { t } = await pageLocale(params);
  return { title: t.scanner.title };
}
export default async function ScannerPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale, t } = await pageLocale(params);
  return (
    <div className="container page-space">
      <nav className="breadcrumb" aria-label={t.support.ui.crumbs}>
        <Link href={localizePath('/', locale)}>{t.support.ui.home}</Link>
        <span>/</span>
        <span>{t.scanner.title}</span>
      </nav>
      <div className="page-heading">
        <h1>{t.scanner.title}</h1>
        <p className="lead">{t.scanner.intro}</p>
      </div>
      <Scanner locale={locale} labels={t.scanner} states={t.scannerStates} />
      <p className="small section-footnote">{t.common.market}</p>
    </div>
  );
}
