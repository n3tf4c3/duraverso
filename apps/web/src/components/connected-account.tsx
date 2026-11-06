import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import { currentActor } from '@/auth';
import { isConnected } from '@/lib/env';
import { AccountActions, LoginButton, WithdrawButton } from '@/components/account-actions';
import { database } from '@/server/database';
import { ReviewService } from '@/server/reviews';
import { statusLabels, type reviewStatuses } from '@duraverso/core';
export const metadata: Metadata = { title: 'Minha conta' };
export const dynamic = 'force-dynamic';
function statusLabel(value: string) { return statusLabels[value as typeof reviewStatuses[number]] ?? 'Em acompanhamento'; }
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  if (isConnected()) {
    const actor = await currentActor(); const params = await searchParams;
    const returnTo = typeof params.returnTo === 'string' && /^\/avaliar\/[a-z0-9-]+$/.test(params.returnTo) ? params.returnTo : '/conta';
    if (!actor) return <div className="container page-space narrow"><Breadcrumb current="Minha conta" /><section className="account-panel"><div className="large-icon"><UserRound size={30} /></div><h1>Suas histórias,<br />em um só lugar.</h1><p>Entre com Google para compartilhar sua experiência e acompanhar a revisão dos seus relatos.</p><LoginButton returnTo={returnTo} />{params.error && <p role="alert" className="form-message">Não foi possível concluir o login. Confira a conta Google e tente novamente.</p>}<p className="small">Seu e-mail e sua foto não aparecem no perfil público. Consulte a <Link className="text-link" href="/privacidade">privacidade</Link> antes de continuar.</p><Link className="text-link centered-link" href="/produtos">Explorar sem entrar <ArrowRight size={17} /></Link></section></div>;
    const reviews = await new ReviewService(database()).mine(actor);
    return <div className="container page-space"><Breadcrumb current="Minha conta" /><div className="page-heading"><span className="eyebrow muted">MINHA CONTA</span><h1>Olá, {actor.displayName}.</h1><p>Acompanhe seus relatos e a revisão de cada atualização.</p></div><div className="account-layout"><div className="review-list"><h2>Minhas experiências</h2>{reviews.length === 0 && <div className="empty-state"><h3>Sua primeira história começa aqui.</h3><p>Encontre o modelo que você usa e confira a versão na etiqueta.</p><Link href="/produtos" className="button button-primary">Encontrar meu produto</Link></div>}{reviews.map((r) => <article className="info-panel" key={r.id}><h2><Link href={`/produtos/${r.productSlug}`}>{r.brand} {r.model} · {r.voltage} V</Link></h2><span className="status-pill">{statusLabel(r.status === 'withdrawn' ? r.status : r.pendingStatus ?? r.status)}</span><p><strong>Sua última versão: {r.rating} de 5</strong></p><p className="review-text">{r.comment || 'Sem comentário.'}</p>{r.status === 'published' && r.pendingStatus !== 'published' && <p className="small">A versão anterior continua publicada. A atualização só substitui seu voto após aprovação.</p>}{r.reason && <div className="inline-notice">Motivo da revisão: {r.reason}</div>}{r.status !== 'withdrawn' && <div className="review-actions"><Link className="button button-outline" href={`/avaliar/${r.productSlug}`}>Atualizar experiência</Link><WithdrawButton id={r.id} /></div>}</article>)}</div><aside><AccountActions displayName={actor.displayName} />{actor.role !== 'member' && <Link className="button button-outline centered-link" href="/admin">Abrir fila de revisão</Link>}</aside></div></div>;
  }
  return <div className="container page-space narrow"><Breadcrumb current="Minha conta" /><div className="account-panel"><div className="large-icon"><UserRound size={30} /></div><span className="eyebrow muted">SUA EXPERIÊNCIA TEM VALOR</span><h1>Suas histórias,<br />em um só lugar.</h1><p>Quando o piloto abrir, você poderá registrar seus produtos, compartilhar experiências e acompanhar a revisão das suas contribuições.</p><button className="button button-google" disabled aria-describedby="login-status"><span aria-hidden="true">G</span> Entrar com Google</button><p id="login-status" className="inline-notice"><LockKeyhole size={18} /> O acesso ainda não está disponível nesta prévia. Nenhuma conta será criada.</p><Link href="/produtos" className="text-link centered-link">Explorar sem criar conta <ArrowRight size={17} /></Link></div></div>;
}
