'use client';
import { useState, type FormEvent } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { needsLogin, postJson } from '@/lib/api-client';

/** Sessão encerrada durante o uso: oferece novo login sem limpar o formulário. */
export function SessionExpired() {
  const pathname = usePathname();
  return (
    <div className="inline-notice" role="alert">
      <p>
        Sua sessão terminou. Entre novamente para continuar. O que você preencheu continua nesta tela até você sair
        dela; copie o texto antes de entrar se quiser reaproveitá-lo.
      </p>
      <LoginButton returnTo={pathname || '/conta'} />
    </div>
  );
}
export function LoginButton({ returnTo = '/conta' }: { returnTo?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <>
      <button
        className="button button-google"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage('');
          try {
            await signIn('google', { redirectTo: returnTo });
          } catch {
            setMessage('Não foi possível iniciar o login. Tente novamente.');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Abrindo Google…' : 'Entrar com Google'}
      </button>
      <p role="status" className="form-message">
        {message}
      </p>
    </>
  );
}
export function AccountActions({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    setExpired(false);
    try {
      setMessage(await postJson('/api/v1/account/profile', { displayName: form.get('displayName') }));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.');
      setExpired(needsLogin(error));
    } finally {
      setBusy(false);
    }
  }
  async function leave(everywhere: boolean) {
    setBusy(true);
    setMessage('');
    setExpired(false);
    try {
      if (everywhere) await postJson('/api/v1/account/sessions', {});
      await signOut({ redirectTo: '/conta' });
    } catch (error) {
      setMessage(
        needsLogin(error) ? 'Esta sessão já tinha terminado.' : 'Não foi possível encerrar a sessão. Tente novamente.',
      );
      setExpired(needsLogin(error));
      setBusy(false);
    }
  }
  return (
    <section className="info-panel">
      <h2>Seu perfil público</h2>
      <form className="review-form" onSubmit={save}>
        <label htmlFor="display-name">Nome que aparece nos seus relatos</label>
        <input
          id="display-name"
          name="displayName"
          defaultValue={displayName}
          required
          minLength={2}
          maxLength={80}
          autoComplete="nickname"
        />
        <p className="small">
          Use um apelido. O nome e a foto da sua conta Google não são copiados para o perfil público. Alterar este nome
          atualiza também os relatos já publicados.
        </p>
        <button disabled={busy} className="button button-primary" type="submit">
          Salvar nome
        </button>
      </form>
      <div className="form-actions">
        <button disabled={busy} className="button button-outline" onClick={() => leave(false)}>
          Sair desta conta
        </button>
        <button disabled={busy} className="button button-outline" onClick={() => leave(true)}>
          Sair de todos os dispositivos
        </button>
      </div>
      <p role="status" className="form-message">
        {message}
      </p>
      {expired && <SessionExpired />}
    </section>
  );
}
export function WithdrawButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [expired, setExpired] = useState(false);
  return (
    <div>
      {!confirm ? (
        <button className="text-link" onClick={() => setConfirm(true)}>
          Retirar avaliação
        </button>
      ) : (
        <>
          <p className="small">
            O relato deixará de aparecer e de contar na média. A retirada encerra a participação neste modelo nesta
            etapa.
          </p>
          <div className="form-actions">
            <button
              className="button button-outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setExpired(false);
                try {
                  setMessage(await postJson('/api/v1/reviews/withdraw', { id }));
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Não foi possível retirar.');
                  setExpired(needsLogin(error));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirmar retirada
            </button>
            <button className="text-link" disabled={busy} onClick={() => setConfirm(false)}>
              Cancelar
            </button>
          </div>
        </>
      )}
      <p role="status" className="form-message">
        {message}
      </p>
      {expired && <SessionExpired />}
    </div>
  );
}
