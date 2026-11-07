'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_REVIEW_LENGTH } from '@duraverso/core';
import { needsLogin, postJson } from '@/lib/api-client';
import { SessionExpired } from './account-actions';
export function ModerationForm({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    setExpired(false);
    try {
      setMessage(
        await postJson('/api/v1/moderation', {
          revisionId,
          decision: form.get('decision'),
          reason: form.get('reason'),
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
      <fieldset disabled={busy || done}>
        <legend>Decisão de revisão</legend>
        <label htmlFor={`decision-${revisionId}`}>Resultado</label>
        <select id={`decision-${revisionId}`} name="decision" required defaultValue="">
          <option value="" disabled>
            Escolha uma decisão
          </option>
          <option value="published">Publicar</option>
          <option value="changes_requested">Pedir ajustes</option>
          <option value="rejected">Não publicar</option>
        </select>
        <label htmlFor={`reason-${revisionId}`}>Motivo para o proprietário</label>
        <textarea
          id={`reason-${revisionId}`}
          name="reason"
          rows={3}
          required
          minLength={1}
          maxLength={MAX_REVIEW_LENGTH}
        />
        <p className="small">
          O motivo fica no histórico e será exibido ao proprietário. Não inclua informações privadas de terceiros.
        </p>
        <button className="button button-primary" type="submit">
          {busy ? 'Registrando…' : 'Registrar decisão'}
        </button>
      </fieldset>
      <p role="status" className="form-message">
        {message}
      </p>
      {expired && <SessionExpired />}
    </form>
  );
}
