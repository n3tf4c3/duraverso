import { z } from 'zod';
const optionalSecret = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional());
export const serverEnvSchema = z
  .object({
    DURAVERSO_MODE: z.enum(['preview', 'connected']).default('preview'),
    DATABASE_URL: optionalSecret,
    DATABASE_URL_DIRECT: optionalSecret,
    AUTH_SECRET: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(32).optional()),
    AUTH_GOOGLE_ID: optionalSecret,
    AUTH_GOOGLE_SECRET: optionalSecret,
    APP_ORIGIN: z.url().default('http://localhost:3107'),
    AUTH_URL: z.preprocess((value) => (value === '' ? undefined : value), z.url().optional()),
    // Somente Vercel: libera o modo conectado na produção do projeto do piloto (lib/deployment.ts).
    DURAVERSO_CONNECTED_HOST: z.enum(['vercel-pilot']).optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.AUTH_GOOGLE_ID) !== Boolean(value.AUTH_GOOGLE_SECRET))
      context.addIssue({ code: 'custom', message: 'Configuração Google incompleta.' });
    if (value.DURAVERSO_MODE === 'connected') {
      for (const key of ['DATABASE_URL', 'AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET', 'AUTH_URL'] as const) {
        if (!value[key])
          context.addIssue({ code: 'custom', path: [key], message: 'Configuração obrigatória no modo conectado.' });
      }
      if (value.AUTH_URL && value.AUTH_URL !== value.APP_ORIGIN)
        context.addIssue({ code: 'custom', message: 'AUTH_URL deve ser igual a APP_ORIGIN.' });
      const origin = URL.canParse(value.APP_ORIGIN) ? new URL(value.APP_ORIGIN) : null;
      if (origin && origin.origin !== value.APP_ORIGIN)
        context.addIssue({ code: 'custom', message: 'APP_ORIGIN deve conter apenas a origem, sem caminho.' });
      if (
        origin &&
        origin.protocol !== 'https:' &&
        !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))
      )
        context.addIssue({ code: 'custom', message: 'HTTP permitido somente em loopback.' });
      if (value.DATABASE_URL && !/^postgres(?:ql)?:\/\//.test(value.DATABASE_URL))
        context.addIssue({ code: 'custom', message: 'Conexão PostgreSQL inválida.' });
    }
  });
export function readServerEnv() {
  return serverEnvSchema.parse(process.env);
}
export function isConnected() {
  return readServerEnv().DURAVERSO_MODE === 'connected';
}
