'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MAX_REVIEW_LENGTH, validateReview } from '@duraverso/core';
import type { ReviewRow, Variant } from '@/server/reviews';
import { postJson } from './account-actions';

export function ReviewForm({
  variants,
  existing,
  maxMonth,
}: {
  variants: Variant[];
  existing?: ReviewRow;
  maxMonth: string;
}) {
  const router = useRouter();
  const submissionId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const review = {
      variantId: existing?.variantId ?? form.get('variantId'),
      rating: Number(form.get('rating')),
      startedUsing: form.get('startedUsing'),
      acquired: form.get('acquired'),
      functioning: form.get('functioning'),
      hadRepair: form.get('hadRepair') === 'yes',
      buyAgain: form.get('buyAgain'),
      comment: form.get('comment'),
    };
    const checked = validateReview(review);
    if (!checked.success) {
      setMessage(checked.error.issues[0]?.message ?? 'Confira os campos.');
      return;
    }
    submissionId.current ??= crypto.randomUUID();
    setBusy(true);
    setMessage('');
    try {
      setMessage(await postJson('/api/v1/reviews', { submissionId: submissionId.current, review: checked.data }));
      setSent(true);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar. Seu texto foi preservado.');
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <section className="info-panel">
        <h2>Recebemos sua experiência.</h2>
        <p role="status">{message}</p>
        <p>
          Você pode acompanhar a decisão e eventuais pedidos de ajuste na sua conta. A publicação depende da revisão
          manual.
        </p>
        <Link className="button button-primary" href="/conta">
          Acompanhar na minha conta
        </Link>
      </section>
    );
  return (
    <form
      className="info-panel review-form"
      onSubmit={submit}
      onChange={() => {
        submissionId.current = null;
      }}
    >
      <fieldset disabled={busy}>
        <legend>{existing ? 'Atualizar experiência' : 'Sua experiência com este produto'}</legend>
        <label htmlFor="variant">Versão do produto</label>
        <select
          id="variant"
          name="variantId"
          defaultValue={existing?.variantId ?? ''}
          required
          disabled={Boolean(existing)}
        >
          <option value="" disabled>
            Escolha a versão da etiqueta
          </option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.manufacturerCode} · {v.voltage} V
            </option>
          ))}
        </select>
        {existing && (
          <p className="small">
            Uma avaliação por pessoa e modelo. A versão vinculada ao relato não pode ser trocada nesta etapa.
          </p>
        )}
        <div className="form-columns">
          <div>
            <label htmlFor="startedUsing">Desde quando você usa?</label>
            <input
              id="startedUsing"
              name="startedUsing"
              type="month"
              min="1900-01"
              max={maxMonth}
              required
              defaultValue={existing?.startedUsing}
            />
          </div>
          <div>
            <label htmlFor="acquired">Como adquiriu?</label>
            <select id="acquired" name="acquired" defaultValue={existing?.acquired ?? ''} required>
              <option value="" disabled>
                Selecione
              </option>
              <option value="new">Novo</option>
              <option value="used">Usado</option>
            </select>
          </div>
        </div>
        <label htmlFor="rating">Sua satisfação geral</label>
        <select id="rating" name="rating" defaultValue={existing?.rating ?? ''} required>
          <option value="" disabled>
            Escolha uma nota
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} de 5 {n === 1 ? '— muito insatisfeito' : n === 5 ? '— muito satisfeito' : ''}
            </option>
          ))}
        </select>
        <label htmlFor="functioning">Como está funcionando hoje?</label>
        <select id="functioning" name="functioning" defaultValue={existing?.functioning ?? ''} required>
          <option value="" disabled>
            Selecione
          </option>
          <option value="working">Funciona normalmente</option>
          <option value="with_problem">Funciona com problema</option>
          <option value="not_working">Não funciona</option>
        </select>
        <div className="form-columns">
          <div>
            <label htmlFor="hadRepair">Já precisou de reparo?</label>
            <select
              id="hadRepair"
              name="hadRepair"
              defaultValue={existing ? (existing.hadRepair ? 'yes' : 'no') : ''}
              required
            >
              <option value="" disabled>
                Selecione
              </option>
              <option value="no">Não</option>
              <option value="yes">Sim</option>
            </select>
          </div>
          <div>
            <label htmlFor="buyAgain">Compraria novamente?</label>
            <select id="buyAgain" name="buyAgain" defaultValue={existing?.buyAgain ?? ''} required>
              <option value="" disabled>
                Selecione
              </option>
              <option value="yes">Sim</option>
              <option value="no">Não</option>
              <option value="unsure">Não sei</option>
            </select>
          </div>
        </div>
        <label htmlFor="comment">
          Conte sua experiência <span className="muted">(opcional)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={6}
          maxLength={MAX_REVIEW_LENGTH}
          defaultValue={existing?.comment}
          aria-describedby="comment-help"
        />
        <p id="comment-help" className="small">
          Até {MAX_REVIEW_LENGTH} caracteres. Não inclua telefone, endereço, documentos ou dados de outras pessoas.
        </p>
        <label className="check-label">
          <input type="checkbox" required /> Confirmo que este relato é sobre meu próprio uso e que li as{' '}
          <Link href="/regras" target="_blank" rel="noopener noreferrer">
            regras de participação
          </Link>
          .
        </label>
        <p className="small">
          {existing?.status === 'published'
            ? 'Sua versão publicada permanece visível até que esta atualização seja aprovada.'
            : 'Seu relato será revisado antes de aparecer no site.'}
        </p>
        <button className="button button-primary" type="submit">
          {busy ? 'Enviando…' : 'Enviar para revisão'}
        </button>
      </fieldset>
      <p className="form-message" role="status">
        {message}
      </p>
    </form>
  );
}
