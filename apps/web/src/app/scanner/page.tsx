import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import { Scanner } from '@/components/scanner';
import { catalog } from '@/lib/catalog';
export const metadata: Metadata = { title: 'Escanear produto' };
export default function ScannerPage() {
  const supported = catalog.filter((product) => product.confirmedGtins.length > 0);
  return <div className="container page-space narrow"><Breadcrumb current="Escanear produto" /><div className="page-heading"><span className="eyebrow muted">UM ATALHO PARA ENCONTRAR</span><h1>Leia o código.<br />Conheça a história.</h1><p>Use o código de barras da embalagem ou digite os números.</p></div><div className="inline-notice">Nesta prévia, a busca reconhece {supported.reduce((total, product) => total + product.confirmedGtins.length, 0)} códigos conferidos de {supported.length} modelos. A cobertura ainda é parcial; se não encontrar, pesquise pela marca ou modelo. Confira a versão e a voltagem na etiqueta do produto.</div><Scanner /><Link href="/produtos" className="text-link centered-link">Prefiro pesquisar pela marca ou modelo <ArrowRight size={17} /></Link></div>;
}
