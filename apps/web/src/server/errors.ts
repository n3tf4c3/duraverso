export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function serviceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  const message = error instanceof Error ? error.message : '';
  if (message === 'actor_invalid') return new ServiceError(401, 'Entre novamente para continuar.');
  if (message === 'admin_required') return new ServiceError(403, 'Área restrita a administradores.');
  if (message === 'catalog_not_found') return new ServiceError(404, 'Item do catálogo não encontrado.');
  if (message === 'catalog_changed')
    return new ServiceError(409, 'O catálogo mudou. Atualize a página e confira as evidências novamente.');
  if (message === 'catalog_evidence_required')
    return new ServiceError(422, 'Confira a identidade, as fontes datadas e a liberação do modelo.');
  if (message === 'catalog_decision_invalid')
    return new ServiceError(422, 'Informe uma mudança de estado, seu motivo e a confirmação das evidências.');
  if (['moderator_required', 'own_review'].includes(message))
    return new ServiceError(403, 'Você não pode revisar esta contribuição.');
  if (message === 'review_not_found') return new ServiceError(404, 'Contribuição não encontrada.');
  if (['revision_not_pending', 'review_withdrawn', 'ownership_variant_conflict'].includes(message))
    return new ServiceError(409, 'A contribuição mudou. Atualize a página antes de continuar.');
  if (message === 'variant_unavailable')
    return new ServiceError(422, 'Esta variante ainda não está disponível para avaliação.');
  return new ServiceError(503, 'O serviço está temporariamente indisponível. Tente novamente.');
}
