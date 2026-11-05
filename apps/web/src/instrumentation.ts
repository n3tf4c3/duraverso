export async function register() {
  if (process.env.VERCEL_ENV) {
    throw new Error('O Duraverso ainda está em preparação local. Publicação não habilitada.');
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { preflight } = await import('./server/preflight');
    await preflight();
  }
}
