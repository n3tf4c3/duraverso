import Link from 'next/link';
import { ArrowUpRight, MoveUpRight, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Product } from '@duraverso/core';
import { capacityLabel } from '@/lib/catalog';

export function WasherIllustration({ large = false }: { large?: boolean }) {
  return <div className={`washer ${large ? 'washer-large' : ''}`} aria-hidden="true">
    <div className="washer-top"><i /><div className="washer-control"><b /><span /><span /></div></div>
    <div className="washer-lid"><div /></div><div className="washer-front"><span /></div><div className="washer-feet"><i /><i /></div>
  </div>;
}
export function ProductCard({ product }: { product: Product }) {
  return <Link href={`/produtos/${product.slug}`} className="product-card">
    <div className={`product-art art-${product.brand.toLowerCase()}`}><span className="capacity-pill">{capacityLabel(product.capacityKg)}</span><WasherIllustration /><span className="illustration-label">Ilustração</span></div>
    <div className="product-card-body"><span className="overline">{product.brand}</span><h3>Lavadora {product.model}</h3><p>Abertura superior · {capacityLabel(product.capacityKg)}</p><div className="card-divider" /><div className="card-bottom"><span><span className="empty-dot" /> Conhecer o modelo</span><ArrowUpRight size={19} /></div></div>
  </Link>;
}
export function Breadcrumb({ current }: { current: string }) {
  return <nav aria-label="Caminho de navegação" className="breadcrumb"><Link href="/">Início</Link><span>/</span><span aria-current="page">{current}</span></nav>;
}
export function PreparationNotice() {
  return <div className="preparation-notice"><ShieldCheck size={18} /><p><strong>Prévia do catálogo.</strong> Explore o catálogo. Contas e contribuições serão abertas após a configuração do serviço.</p></div>;
}
export function ValuesStrip() {
  return <div className="values-strip"><span><ShieldCheck size={18} /> Experiências de quem usa</span><span><RefreshCw size={18} /> Histórias que continuam</span><span><MoveUpRight size={18} /> Informação para escolher melhor</span></div>;
}
