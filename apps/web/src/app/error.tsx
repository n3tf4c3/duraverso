'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="container page-space empty-state" role="alert"><h1>Não conseguimos carregar esta página.</h1><p>Tente novamente. Se o problema continuar, volte ao catálogo.</p><button className="button button-primary" onClick={reset}>Tentar novamente</button><Link href="/produtos" className="text-link">Voltar ao catálogo</Link></div>; }
