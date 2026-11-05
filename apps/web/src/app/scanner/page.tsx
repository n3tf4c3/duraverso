import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import { Scanner } from '@/components/scanner';
export const metadata: Metadata = { title: 'Escanear produto' };
export default function ScannerPage() {
  return <div className="container page-space narrow"><Breadcrumb current="Escanear produto" /><div className="page-heading"><span className="eyebrow muted">UM ATALHO PARA ENCONTRAR</span><h1>Leia o código.<br />Conheça a história.</h1><p>Use o código de barras da embalagem ou digite os números.</p></div><div className="inline-notice">Nesta prévia, os códigos ainda não estão vinculados às variantes. A leitura pode funcionar e o produto ainda não ser encontrado.</div><Scanner /><Link href="/produtos" className="text-link centered-link">Prefiro pesquisar pela marca ou modelo <ArrowRight size={17} /></Link></div>;
}
