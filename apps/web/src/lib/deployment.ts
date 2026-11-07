/**
 * Na Vercel, a prévia pública e todo deploy de preview ficam em DURAVERSO_MODE=preview.
 * O modo conectado só roda na produção do projeto do piloto, marcada explicitamente
 * com DURAVERSO_CONNECTED_HOST=vercel-pilot; o preflight ainda confere banco e schema.
 */
export function assertDeploymentMode(env: Record<string, string | undefined> = process.env) {
  if (!env.VERCEL_ENV && env.VERCEL !== '1') return;
  const mode = env.DURAVERSO_MODE ?? 'preview';
  if (mode === 'preview') return;
  if (mode === 'connected' && env.VERCEL_ENV === 'production' && env.DURAVERSO_CONNECTED_HOST === 'vercel-pilot')
    return;
  throw new Error(
    'Na Vercel, o modo conectado só roda na produção do projeto do piloto (DURAVERSO_CONNECTED_HOST=vercel-pilot). Os demais ambientes usam DURAVERSO_MODE=preview.',
  );
}
