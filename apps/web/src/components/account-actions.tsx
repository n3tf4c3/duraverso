'use client';
import { useState, type FormEvent } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export async function postJson(path: string, body: unknown): Promise<string> {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível concluir. Tente novamente.');
  return typeof data.message === 'string' ? data.message : 'Alteração salva.';
}
export function LoginButton({ returnTo = '/conta' }: { returnTo?: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  return <><button className="button button-google" disabled={busy} onClick={async () => {
    setBusy(true); setMessage('');
    try { await signIn('google', { redirectTo: returnTo }); } catch { setMessage('Não foi possível iniciar o login. Tente novamente.'); setBusy(false); }
  }}>{busy ? 'Abrindo Google…' : 'Entrar com Google'}</button><p role="status" className="form-message">{message}</p></>;
}
export function AccountActions({ displayName }: { displayName: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try { setMessage(await postJson('/api/v1/account/profile', { displayName: form.get('displayName') })); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); } finally { setBusy(false); }
  }
  async function leave(everywhere: boolean) {
    setBusy(true); setMessage('');
    try { if (everywhere) await postJson('/api/v1/account/sessions', {}); await signOut({ redirectTo: '/conta' }); }
    catch { setMessage('Não foi possível encerrar a sessão. Tente novamente.'); setBusy(false); }
  }
  return <section className="info-panel"><h2>Seu perfil público</h2><form className="review-form" onSubmit={save}>
    <label htmlFor="display-name">Nome que aparece nos seus relatos</label><input id="display-name" name="displayName" defaultValue={displayName} required minLength={2} maxLength={80} autoComplete="nickname" />
    <p className="small">Use um apelido. O nome e a foto da sua conta Google não são copiados para o perfil público. Alterar este nome atualiza também os relatos já publicados.</p>
    <button disabled={busy} className="button button-primary" type="submit">Salvar nome</button></form>
    <div className="form-actions"><button disabled={busy} className="button button-outline" onClick={() => leave(false)}>Sair desta conta</button><button disabled={busy} className="button button-outline" onClick={() => leave(true)}>Sair de todos os dispositivos</button></div><p role="status" className="form-message">{message}</p></section>;
}
export function WithdrawButton({ id }: { id: string }) {
  const router = useRouter(); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  return <div>{!confirm ? <button className="text-link" onClick={() => setConfirm(true)}>Retirar avaliação</button> : <><p className="small">O relato deixará de aparecer e de contar na média. A retirada encerra a participação neste modelo nesta etapa.</p><div className="form-actions"><button className="button button-outline" disabled={busy} onClick={async () => {
    setBusy(true); try { setMessage(await postJson('/api/v1/reviews/withdraw', { id })); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível retirar.'); } finally { setBusy(false); }
  }}>Confirmar retirada</button><button className="text-link" disabled={busy} onClick={() => setConfirm(false)}>Cancelar</button></div></>}<p role="status" className="form-message">{message}</p></div>;
}
