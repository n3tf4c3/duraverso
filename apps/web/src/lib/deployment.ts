/** A Vercel pode servir o catálogo, mas ainda não pode abrir contas ou contribuições. */
export function assertDeploymentMode(env: Record<string, string | undefined> = process.env) {
  if (!env.VERCEL_ENV && env.VERCEL !== '1') return;
  const mode = env.DURAVERSO_MODE ?? 'preview';
  if (mode !== 'preview') {
    throw new Error(
      'A Vercel permite somente DURAVERSO_MODE=preview nesta etapa. Contas e contribuições ainda não foram liberadas para publicação.',
    );
  }
}
