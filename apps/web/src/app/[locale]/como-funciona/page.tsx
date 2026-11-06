import { SupportPage } from '@/components/support-page';
import { pageLocale, type LocaleParams } from '@/lib/locale-page';
export async function generateMetadata({ params }: { params: Promise<LocaleParams> }) { const { t } = await pageLocale(params); return { title: t.support.pages.como.crumb }; }
export default function Page({ params }: { params: Promise<LocaleParams> }) { return <SupportPage params={params} kind="como" />; }
