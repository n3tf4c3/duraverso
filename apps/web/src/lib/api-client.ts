// Cliente das rotas de escrita. Preserva o status HTTP para que a interface
// distinga sessão encerrada (401) de permissão (403), limite (429) e falha de rede.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const fallbackError = 'Não foi possível concluir. Tente novamente.';

export async function postJson(path: string, body: unknown): Promise<string> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  // Respostas sem JSON (proxy, página de erro) não podem esconder o status.
  const data: unknown = await response.json().catch(() => ({}));
  const field = (name: 'error' | 'message') =>
    typeof data === 'object' && data !== null && typeof (data as Record<string, unknown>)[name] === 'string'
      ? ((data as Record<string, string>)[name] as string)
      : undefined;
  if (!response.ok) throw new ApiError(response.status, field('error') ?? fallbackError);
  return field('message') ?? 'Alteração salva.';
}

/** Somente 401 pede novo login; 403, 429 e erros de rede mantêm a sessão atual. */
export function needsLogin(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
