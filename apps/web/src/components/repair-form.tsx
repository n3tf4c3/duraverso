'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_REPAIR_SYMPTOM_LENGTH, MAX_REVIEW_LENGTH, parseRepairCost, validateRepair } from '@duraverso/core';
import { needsLogin, postJson } from '@/lib/api-client';
import { SessionExpired } from './account-actions';

/** Registro de reparo do próprio relato; a posse e o mês são conferidos de novo no servidor. */
export function RepairForm({ reviewId, minMonth, maxMonth }: { reviewId: string; minMonth: string; maxMonth: string }) {
  const router = useRouter();
  const submissionId = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const costCents = parseRepairCost(String(form.get('cost') ?? ''));
    if (costCents === undefined) {
      setMessage('Informe o custo em reais, como 350 ou 1.250,90, ou deixe em branco.');
      return;
    }
    const checked = validateRepair({
      reviewId,
      occurredMonth: form.get('occurredMonth'),
      symptom: form.get('symptom'),
      repaired: form.get('repaired') === 'yes',
      resultingStatus: form.get('resultingStatus'),
      costCents,
      comment: form.get('comment'),
    });
    if (!checked.success) {
      setMessage(checked.error.issues[0]?.message ?? 'Confira os campos.');
      return;
    }
    submissionId.current ??= crypto.randomUUID();
    setBusy(true);
    setMessage('');
    setExpired(false);
    try {
      setMessage(await postJson('/api/v1/repairs', { submissionId: submissionId.current, repair: checked.data }));
      submissionId.current = null;
      element.reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar. Seu texto foi preservado.');
      setExpired(needsLogin(error));
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <div>
        <button className="text-link" type="button" onClick={() => setOpen(true)}>
          Registrar um reparo
        </button>
        <p role="status" className="form-message">
          {message}
        </p>
      </div>
    );
  return (
    <form
      className="review-form"
      onSubmit={submit}
      onChange={() => {
        submissionId.current = null;
      }}
    >
      <fieldset disabled={busy}>
        <legend>Novo reparo</legend>
        <div className="form-columns">
          <div>
            <label htmlFor={`occurred-${reviewId}`}>Quando aconteceu?</label>
            <input
              id={`occurred-${reviewId}`}
              name="occurredMonth"
              type="month"
              min={minMonth}
              max={maxMonth}
              required
            />
          </div>
          <div>
            <label htmlFor={`cost-${reviewId}`}>
              Custo em reais <span className="muted">(opcional)</span>
            </label>
            <input id={`cost-${reviewId}`} name="cost" inputMode="decimal" placeholder="350,00" />
          </div>
        </div>
        <label htmlFor={`symptom-${reviewId}`}>Qual foi o problema?</label>
        <textarea
          id={`symptom-${reviewId}`}
          name="symptom"
          rows={2}
          required
          minLength={3}
          maxLength={MAX_REPAIR_SYMPTOM_LENGTH}
        />
        <div className="form-columns">
          <div>
            <label htmlFor={`repaired-${reviewId}`}>Foi consertado?</label>
            <select id={`repaired-${reviewId}`} name="repaired" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </div>
          <div>
            <label htmlFor={`status-${reviewId}`}>Como ficou depois?</label>
            <select id={`status-${reviewId}`} name="resultingStatus" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              <option value="working">Funciona normalmente</option>
              <option value="with_problem">Funciona com problema</option>
              <option value="not_working">Não funciona</option>
            </select>
          </div>
        </div>
        <label htmlFor={`repair-comment-${reviewId}`}>
          Detalhes <span className="muted">(opcional)</span>
        </label>
        <textarea id={`repair-comment-${reviewId}`} name="comment" rows={3} maxLength={MAX_REVIEW_LENGTH} />
        <p className="small">
          Não inclua telefone, endereço, nome de técnico ou documentos. O reparo é revisado antes de aparecer junto do
          seu relato publicado.
        </p>
        <div className="form-actions">
          <button className="button button-primary" type="submit">
            {busy ? 'Enviando…' : 'Enviar para revisão'}
          </button>
          <button className="text-link" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      </fieldset>
      <p role="status" className="form-message">
        {message}
      </p>
      {expired && <SessionExpired />}
    </form>
  );
}

export function WithdrawRepairButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  return (
    <span>
      <button
        className="text-link"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setExpired(false);
          try {
            setMessage(await postJson('/api/v1/repairs/withdraw', { id }));
            router.refresh();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Não foi possível retirar.');
            setExpired(needsLogin(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        Retirar reparo
      </button>
      <span role="status" className="form-message">
        {message}
      </span>
      {expired && <SessionExpired />}
    </span>
  );
}
