'use client';
import { useLocale } from '@/components/locale-provider';
import { extraCopy } from '@/lib/copy';
export default function Loading() { const c = extraCopy(useLocale()); return <div className="container page-space" role="status"><p>{c.loading}</p><div className="loading-bar" /></div>; }
