import type { Actor } from '@duraverso/core';
import { ServiceError, serviceError } from './errors';

export type MutationDependencies = { enabled: () => boolean; origin: () => string; actor: () => Promise<Actor | null>; limit: (actor: Actor) => Promise<void> };
export function mutation(deps: MutationDependencies, operation: (actor: Actor, input: unknown) => Promise<unknown>) {
  return async (request: Request): Promise<Response> => {
    try {
      if (!deps.enabled()) throw new ServiceError(503, 'As contribuições ainda não foram abertas.');
      if (request.headers.get('origin') !== deps.origin()) throw new ServiceError(403, 'Origem da solicitação não permitida.');
      const actor = await deps.actor();
      if (!actor) throw new ServiceError(401, 'Entre com Google para continuar.');
      await deps.limit(actor);
      if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') throw new ServiceError(415, 'Envie dados no formato JSON.');
      const reader = request.body?.getReader();
      if (!reader) throw new ServiceError(400, 'Solicitação vazia.');
      const chunks: Uint8Array[] = []; let size = 0;
      try { while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 16384) { await reader.cancel(); throw new ServiceError(413, 'Solicitação muito grande.'); } chunks.push(value); } }
      finally { reader.releaseLock(); }
      let input: unknown;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ServiceError(400, 'Dados inválidos.'); }
      return Response.json(await operation(actor, input), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { const safe = serviceError(error); return Response.json({ error: safe.message }, { status: safe.status, headers: { 'Cache-Control': 'no-store', ...(safe.status === 429 ? { 'Retry-After': '60' } : {}) } }); }
  };
}
