import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import { fontClasses } from '@/lib/fonts';
import { locales, localeMeta } from '@/lib/i18n';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
import '../globals.css';
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({ params }: { params: Promise<LocaleParams> }): Promise<Metadata> {
  const { t } = await pageLocale(params);
  return {
    title: { default: t.meta.title, template: '%s | Duraverso' },
    description: t.meta.description,
    robots: { index: false, follow: false },
  };
}
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await pageLocale(params);
  return (
    <html lang={localeMeta[locale].tag} className={fontClasses}>
      <body>
        <SiteShell locale={locale}>{children}</SiteShell>
      </body>
    </html>
  );
}
