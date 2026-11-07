import type { Metadata } from 'next';
import { ClipboardCheck, Database, LockKeyhole, MessageSquareWarning } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';
import { currentActor } from '@/auth';
import { isConnected } from '@/lib/env';
import { database } from '@/server/database';
import { ReviewService } from '@/server/reviews';
import { RepairService } from '@/server/repairs';
import { ModerationForm } from '@/components/moderation-form';
export const metadata: Metadata = { title: 'Administração' };
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  if (isConnected()) {
    const actor = await currentActor();
    if (!actor || actor.role === 'member')
      return (
        <div className="container page-space narrow">
          <Breadcrumb current="Administração" />
          <section className="empty-state">
            <LockKeyhole size={30} />
            <h1>Acesso restrito</h1>
            <p>Esta área está disponível somente para a equipe autorizada de revisão.</p>
            <Link className="button button-primary" href="/conta">
              Ir para minha conta
            </Link>
          </section>
        </div>
      );
    const db = database();
    const [queue, repairQueue] = await Promise.all([
      new ReviewService(db).queue(actor),
      new RepairService(db).queue(actor),
    ]);
    return (
      <div className="container page-space narrow">
        {actor.role === 'admin' && (
          <Link className="button button-outline" href="/admin/catalogo">
            Catálogo e variantes
          </Link>
        )}
        <Breadcrumb current="Revisão de contribuições" />
        <div className="page-heading">
          <span className="eyebrow muted">MODERAÇÃO</span>
          <h1>Experiências em revisão.</h1>
          <p>Revise o relato, confira a versão do produto e explique sua decisão ao proprietário.</p>
        </div>
        <div className="inline-notice">
          Aplique os mesmos critérios a opiniões positivas e negativas. Suas próprias contribuições não entram nesta
          fila.
        </div>
        <div className="review-list">
          {queue.length === 0 && (
            <div className="empty-state">
              <ClipboardCheck size={30} />
              <h2>Nenhuma contribuição pendente.</h2>
            </div>
          )}
          {queue.map((r) => (
            <article className="info-panel" key={r.revisionId}>
              <span className="eyebrow muted">
                {r.status === 'published' ? 'ATUALIZAÇÃO DE RELATO PUBLICADO' : 'RELATO AGUARDANDO PUBLICAÇÃO'}
              </span>
              <h2>
                {r.brand} {r.model} · {r.voltage} V
              </h2>
              <p>
                Por {r.displayName} · <strong>{r.rating} de 5</strong>
              </p>
              <dl>
                <div>
                  <dt>Em uso desde</dt>
                  <dd>{r.startedUsing}</dd>
                </div>
                <div>
                  <dt>Aquisição</dt>
                  <dd>{r.acquired === 'new' ? 'Novo' : 'Usado'}</dd>
                </div>
                <div>
                  <dt>Funcionamento</dt>
                  <dd>
                    {r.functioning === 'working'
                      ? 'Normal'
                      : r.functioning === 'with_problem'
                        ? 'Com problema'
                        : 'Não funciona'}
                  </dd>
                </div>
                <div>
                  <dt>Precisou de reparo</dt>
                  <dd>{r.hadRepair ? 'Sim' : 'Não'}</dd>
                </div>
                <div>
                  <dt>Compraria novamente</dt>
                  <dd>{r.buyAgain === 'yes' ? 'Sim' : r.buyAgain === 'no' ? 'Não' : 'Não sabe'}</dd>
                </div>
              </dl>
              <p className="review-text">{r.comment || 'Sem comentário.'}</p>
              <ModerationForm revisionId={r.revisionId!} />
            </article>
          ))}
        </div>
        <div className="page-heading">
          <h2>Reparos em revisão.</h2>
          <p>
            Confira se o reparo é coerente com o relato e se não expõe dados pessoais. Reparos não têm edição: publique
            ou recuse com motivo.
          </p>
        </div>
        <div className="review-list">
          {repairQueue.length === 0 && (
            <div className="empty-state">
              <ClipboardCheck size={30} />
              <h3>Nenhum reparo pendente.</h3>
            </div>
          )}
          {repairQueue.map((repair) => (
            <article className="info-panel" key={repair.id}>
              <span className="eyebrow muted">REPARO AGUARDANDO PUBLICAÇÃO</span>
              <h2>
                {repair.brand} {repair.model} · {repair.voltage} V
              </h2>
              <p>
                Por {repair.displayName} · em uso desde {repair.startedUsing}
              </p>
              <dl>
                <div>
                  <dt>Quando</dt>
                  <dd>{repair.occurredMonth}</dd>
                </div>
                <div>
                  <dt>Problema</dt>
                  <dd>{repair.symptom}</dd>
                </div>
                <div>
                  <dt>Consertado</dt>
                  <dd>{repair.repaired ? 'Sim' : 'Não'}</dd>
                </div>
                <div>
                  <dt>Depois do reparo</dt>
                  <dd>
                    {repair.resultingStatus === 'working'
                      ? 'Normal'
                      : repair.resultingStatus === 'with_problem'
                        ? 'Com problema'
                        : 'Não funciona'}
                  </dd>
                </div>
                <div>
                  <dt>Custo</dt>
                  <dd>
                    {repair.costCents === null
                      ? 'Não informado'
                      : (repair.costCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </dd>
                </div>
              </dl>
              <p className="review-text">{repair.comment || 'Sem detalhes.'}</p>
              <ModerationForm repairId={repair.id} />
            </article>
          ))}
        </div>
        <p className="small">
          Até 100 contribuições por vez, das mais antigas para as mais recentes. Ao concluir uma revisão, a fila é
          atualizada.
        </p>
      </div>
    );
  }
  return (
    <div className="container page-space">
      <Breadcrumb current="Administração" />
      <div className="page-heading">
        <span className="eyebrow muted">OPERAÇÃO DO PILOTO</span>
        <h1>Uma comunidade bem cuidada.</h1>
        <p>Estrutura de administração em preparação.</p>
      </div>
      <div className="inline-notice">
        <LockKeyhole size={20} /> O acesso administrativo ainda não foi habilitado. Esta página não contém dados
        privados nem permite aprovar ou alterar contribuições.
      </div>
      <div className="steps-grid admin-grid">
        {[
          {
            icon: ClipboardCheck,
            title: 'Revisão de contribuições',
            text: 'Avaliações, atualizações e reparos serão revisados antes da publicação.',
          },
          {
            icon: Database,
            title: 'Organização do catálogo',
            text: 'Conferência de variantes, códigos de barras e sugestões de produtos.',
          },
          {
            icon: MessageSquareWarning,
            title: 'Denúncias e reconsiderações',
            text: 'Decisões com motivo, prioridade para dados pessoais expostos e histórico de ações.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <article className="info-panel" key={title}>
            <Icon size={27} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <section className="info-panel">
        <h2>Critérios de revisão</h2>
        <ul>
          <li>Publicar experiências próprias, compreensíveis e relacionadas ao modelo correto.</li>
          <li>Aplicar os mesmos critérios a notas positivas e negativas.</li>
          <li>Solicitar correção de inconsistências e retirada de dados pessoais.</li>
          <li>Não alterar estrelas ou opinião em nome do proprietário.</li>
          <li>Registrar motivo e responsável por cada decisão.</li>
        </ul>
        <p className="small">
          A fila real dependerá do banco, do login Google e da autorização de administrador. Nenhuma permissão é
          concedida pelo navegador ou pelo e-mail informado em um formulário.
        </p>
      </section>
    </div>
  );
}
