import { assertDeploymentMode } from '../lib/deployment';
assertDeploymentMode();
console.info('Nenhuma migration aplicada no build. Na Vercel, somente a prévia do catálogo está habilitada.');
