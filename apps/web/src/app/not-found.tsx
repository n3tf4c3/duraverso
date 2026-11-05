import Link from 'next/link';
export default function NotFound() { return <div className="container page-space empty-state"><span className="eyebrow muted">PÁGINA NÃO ENCONTRADA</span><h1>Essa história ainda não está aqui.</h1><p>O endereço pode ter mudado ou o produto ainda não faz parte do catálogo.</p><Link href="/produtos" className="button button-primary">Explorar produtos</Link></div>; }
