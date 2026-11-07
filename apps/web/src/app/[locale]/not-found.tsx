'use client';
import Link from 'next/link';
import { useLocale } from '@/components/locale-provider';
import { localizePath } from '@/lib/i18n';
import { extraCopy } from '@/lib/copy';
export default function NotFound() {
  const locale = useLocale();
  const c = extraCopy(locale);
  return (
    <div className="container page-space">
      <div className="empty-state">
        <span className="mono">404</span>
        <h1>{c.notFound}</h1>
        <p>{c.notFoundText}</p>
        <Link className="button button-primary" href={localizePath('/produtos', locale)}>
          {c.queryModel} →
        </Link>
      </div>
    </div>
  );
}
