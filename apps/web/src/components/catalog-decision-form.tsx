'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_REVIEW_LENGTH } from '@duraverso/core';
import { needsLogin, postJson } from '@/lib/api-client';
import { SessionExpired } from './account-actions';

export function CatalogDecisionForm({
  productId,
  variantId,
  token,
  verified,
  issues,
}: {
  productId: string;
  variantId: string | null;
  token: string;
  verified: boolean;
  issues: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  const id = variantId ?? productId;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    setExpired(false);
    try {
      setMessage(
        await postJson('/api/v1/admin/catalog', {
          productId,
          variantId,
          expectedToken: token,
          verified: !verified,
          reason: form.get('reason'),
          evidenceConfirmed: form.get('evidenceConfirmed') === 'on',
        }),
      );
      setDone(true);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível registrar a decisão.');
      setExpired(needsLogin(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="review-form" onSubmit={submit}>
      <fieldset disabled={busy || done || (!verified && issues.length > 0)}>
        <legend>{verified ? 'Suspender disponibilidade' : 'Liberar após conferência'}</legend>
        {!verified && (
          <label className="catalog-confirm" htmlFor={`confirm-${id}`}>
            <input id={`confirm-${id}`} type="checkbox" name="evidenceConfirmed" required /> Conferi as fontes, a
            identificação e{' '}
            {variantId
              ? 'a associação entre referência, tensão e todos os GTINs listados'
              : 'os dados do modelo e as variantes que voltarão a ficar disponíveis'}
            .
          </label>
        )}
        <label htmlFor={`reason-${id}`}>Motivo da decisão</label>
        <textarea id={`reason-${id}`} name="reason" required maxLength={MAX_REVIEW_LENGTH} rows={2} />
        <p className="small">O motivo fica no histórico administrativo. Não inclua dados pessoais.</p>
        <button className="button button-primary" type="submit">
          {busy ? 'Registrando…' : verified ? 'Suspender' : 'Liberar'}
        </button>
      </fieldset>
      {!verified &&
        issues.map((issue) => (
          <p className="small" key={issue}>
            {issue}
          </p>
        ))}
      <p role="status" className="form-message">
        {message}
      </p>
      {expired && <SessionExpired />}
      {message && !done && (
        <button className="text-link" type="button" onClick={() => router.refresh()}>
          Atualizar dados para conferir novamente
        </button>
      )}
    </form>
  );
}
