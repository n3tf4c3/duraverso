import Link from 'next/link';
export function Breadcrumb({ current }: { current: string }) {
  return <nav aria-label="Caminho de navegação" className="breadcrumb"><Link href="/">Início</Link><span>/</span><span aria-current="page">{current}</span></nav>;
}
