import type { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { isConnected, readServerEnv } from '@/lib/env';
import { enforceLimit } from '@/server/limits';
import { serviceError } from '@/server/errors';
async function handle(request: NextRequest) {
  if (!isConnected()) return Response.json({ error: 'Login ainda não configurado.' }, { status: 503 });
  if (request.method === 'POST' && request.headers.get('origin') !== readServerEnv().APP_ORIGIN)
    return Response.json({ error: 'Origem não permitida.' }, { status: 403 });
  try {
    // Limite global conservador para o piloto: não confiar em IP fornecido por cabeçalho.
    await enforceLimit('auth', 'global');
    return await (request.method === 'POST' ? handlers.POST(request) : handlers.GET(request));
  } catch (error) {
    const safe = serviceError(error);
    return Response.json({ error: safe.message }, { status: safe.status });
  }
}
export const GET = handle;
export const POST = handle;
