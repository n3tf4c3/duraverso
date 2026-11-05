import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentActor } from '@/auth';
import { isConnected } from '@/lib/env';
import { findProduct } from '@/lib/catalog';
import { database } from '@/server/database';
import { ReviewService } from '@/server/reviews';
import { Breadcrumb } from '@/components/ui';
import { ReviewForm } from '@/components/review-form';
import { LoginButton } from '@/components/account-actions';
export const metadata: Metadata = { title: 'Compartilhar experiência' };
export const dynamic = 'force-dynamic';
export default async function EvaluatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = findProduct(slug); if (!product) notFound();
  let content;
  if (!isConnected()) content = <section className="empty-state"><h2>Estamos preparando a participação.</h2><p>As contas e o envio de avaliações ainda não estão abertos nesta prévia local.</p><Link href={`/produtos/${slug}`} className="button button-outline">Voltar ao produto</Link></section>;
  else {
    const actor = await currentActor();
    if (!actor) content = <section className="account-panel"><h2>Uma experiência, uma pessoa.</h2><p>Entre com Google para enviar seu relato à revisão.</p><LoginButton returnTo={`/avaliar/${slug}`} /></section>;
    else {
      const service = new ReviewService(database());
      const [variants, mine] = await Promise.all([service.variants(slug), service.mine(actor)]);
      const existing = mine.find((r) => r.productSlug === slug);
      if (existing?.status === 'withdrawn') content = <section className="empty-state"><h2>Este relato foi retirado.</h2><p>A participação neste modelo foi encerrada. A restauração de relatos ainda não está disponível.</p><Link className="button button-outline" href="/conta">Minha conta</Link></section>;
      else if (!variants.length || (existing && !variants.some((v) => v.id === existing.variantId))) content = <section className="empty-state"><h2>Identificação em conferência.</h2><p>O envio será liberado após a conferência do modelo e da versão do produto. Não precisamos que você adivinhe o código da etiqueta.</p></section>;
      else content = <ReviewForm variants={variants} existing={existing} maxMonth={new Date().toISOString().slice(0, 7)} />;
    }
  }
  return <div className="container page-space narrow"><Breadcrumb current="Compartilhar experiência" /><div className="page-heading"><span className="eyebrow muted">EXPERIÊNCIAS DE QUEM USA</span><h1>{product.brand} {product.model}</h1><p>Satisfação, funcionamento e histórico de uso, nas suas palavras.</p></div>{content}</div>;
}
