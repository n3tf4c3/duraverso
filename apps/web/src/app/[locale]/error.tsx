'use client';
import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import { localizePath } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { const locale = useLocale(); const c = extraCopy(locale); return <div className="container page-space"><div className="empty-state"><h1>{c.errorTitle}</h1><p>{c.errorText}</p><button type="button" className="button button-primary" onClick={reset}>{c.retry}</button><Link className="text-link" href={localizePath('/produtos', locale)}>{c.queryModel} →</Link></div></div>; }
