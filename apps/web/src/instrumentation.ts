import { assertDeploymentMode } from './lib/deployment';
export async function register() {
  assertDeploymentMode();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { preflight } = await import('./server/preflight');
    await preflight();
  }
}
