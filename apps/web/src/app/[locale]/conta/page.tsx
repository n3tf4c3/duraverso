import { SupportPage } from '@/components/support-page';
import ConnectedAccount from '@/components/connected-account';
import { isConnected } from '@/lib/env';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<LocaleParams> }) {
  const { t } = await pageLocale(params);
  return { title: t.support.pages.conta.crumb };
}
export default function Page({
  params,
  searchParams,
}: {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  return isConnected() ? (
    <ConnectedAccount searchParams={searchParams} />
  ) : (
    <SupportPage params={params} kind="conta" />
  );
}
