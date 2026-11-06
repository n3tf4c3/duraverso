import type { Metadata } from 'next';
import Link from 'next/link';
import { catalogActivationIssues } from '@duraverso/core';
import { currentActor } from '@/auth';
import { Breadcrumb } from '@/components/ui';
import { CatalogDecisionForm } from '@/components/catalog-decision-form';
import { isConnected } from '@/lib/env';
import { database } from '@/server/database';
import { CatalogAdminService } from '@/server/catalog-admin';
import { serviceError } from '@/server/errors';

export const metadata: Metadata = { title: 'Revisão do catálogo', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
function Source({ url, children }: { url: string | null; children: React.ReactNode }) {
  let safe = false;
  try {
    safe = !!url && new URL(url).protocol === 'https:';
  } catch { /* Fonte incompleta permanece visível sem virar link inseguro. */ }
  if (safe && url) return <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <span>{children}: fonte HTTPS ausente ou inválida</span>;
}
function date(value: string | null) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 10) : 'Data ausente ou inválida';
}
export default async function CatalogAdminPage() {
  const actor = isConnected() ? await currentActor() : null;
  if (!actor || actor.role !== 'admin') return <div className="container page-space narrow"><Breadcrumb current="Revisão do catálogo" /><section className="empty-state"><h1>Acesso restrito</h1><p>{isConnected() ? 'A revisão do catálogo está disponível somente para administradores autorizados.' : 'A revisão do catálogo está desativada nesta prévia.'}</p><Link className="button button-primary" href="/admin">Voltar à administração</Link></section></div>;
  const result = await new CatalogAdminService(database()).read(actor).then((entries) => ({ entries, error: '' }), (error: unknown) => ({ entries: [], error: serviceError(error).message }));
  return <div className="container page-space narrow">
    <Breadcrumb current="Revisão do catálogo" />
    <div className="page-heading"><span className="eyebrow muted">CATÁLOGO</span><h1>Conferir antes de liberar.</h1><p>Abra as fontes e confira cada modelo, referência, tensão e código de barras. Importar dados não libera produtos.</p><Link className="text-link" href="/admin">Revisar contribuições</Link></div>
    <div className="inline-notice">A identidade desta etapa é documental: referência, tensão e GTIN. Uma referência de catálogo não comprova uma revisão física. Se as fontes forem ambíguas, mantenha a variante suspensa e registre a correção antes de liberá-la.</div>
    <p>Suspender o modelo oculta suas variantes e relatos e impede novas avaliações. As liberações individuais são preservadas e voltam a valer quando o modelo é liberado novamente. Suspender uma variante oculta seus códigos e relatos e impede novas avaliações nessa variante.</p>
    {result.error ? <p role="alert" className="inline-notice">{result.error}</p> : result.entries.length === 0 && <div className="empty-state"><h2>Nenhum modelo importado.</h2></div>}
    <div className="review-list">{result.entries.map(({ product, token, history }) => <article className="info-panel" key={product.id}>
      <h2>{product.brand} {product.model} · {product.capacityKg} kg</h2>
      <p><strong>{product.verified ? 'Modelo liberado' : 'Modelo suspenso ou ainda não revisado'}</strong> · {product.slug}</p>
      <p><Source url={product.sourceUrl}>Fonte do modelo</Source> · Conferida em {date(product.sourceCheckedAt)}</p>
      <CatalogDecisionForm key={`${product.id}-${token}`} productId={product.id} variantId={null} token={token} verified={product.verified} issues={catalogActivationIssues(product, null)} />
      {product.variants.length === 0 && <p>Nenhuma variante importada. A liberação do modelo permite apenas a consulta por nome.</p>}
      {product.variants.map((variant) => <section className="catalog-variant" key={variant.id}>
        <h3>{variant.manufacturerCode} · {variant.voltage} V</h3>
        <p>{variant.codeKind === 'manufacturer_reference' ? 'Referência do fabricante' : variant.codeKind === 'catalog_reference' ? 'Referência de catálogo — não identifica revisão física' : 'Tipo de referência não conferido'} · <strong>{variant.verified ? product.verified ? 'Disponível' : 'Liberada, mas modelo suspenso' : 'Suspensa ou ainda não revisada'}</strong></p>
        {variant.gtins.length === 0 && <p>Nenhum GTIN documentado.</p>}
        <ul>{variant.gtins.map((gtin) => <li key={gtin.code}><strong>GTIN {gtin.code}</strong><p><Source url={gtin.sourceUrl}>Fonte do código e referência</Source> · <Source url={gtin.voltageSourceUrl}>Fonte da tensão</Source> · {date(gtin.checkedAt)}</p><p>{gtin.note || 'Sem nota de evidência.'}</p></li>)}</ul>
        <CatalogDecisionForm key={`${variant.id}-${token}`} productId={product.id} variantId={variant.id} token={token} verified={variant.verified} issues={catalogActivationIssues(product, variant.id)} />
      </section>)}
      <details><summary>Histórico administrativo — até 20 decisões recentes</summary>
        {history.length === 0 ? <p>Nenhuma decisão registrada.</p> : <ol>{history.map((decision) => <li key={decision.id}>
          <p><strong>{decision.variantId ? `Variante ${product.variants.find((v) => v.id === decision.variantId)?.manufacturerCode ?? decision.variantId}` : 'Modelo'}: {decision.beforeVerified ? 'liberado' : 'suspenso'} → {decision.afterVerified ? 'liberado' : 'suspenso'}</strong></p>
          <p>{decision.reason}</p><p className="small">{decision.createdAt} · {decision.administrator} · ID {decision.administratorId}</p>
        </li>)}</ol>}
      </details>
    </article>)}</div>
  </div>;
}
