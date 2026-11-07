// Constantes sem dependências, compartilhadas pelos módulos do core sem ciclo de importação.
export const MAX_REVIEW_LENGTH = 2000;
export const functioningStatuses = ['working', 'with_problem', 'not_working'] as const;
export type FunctioningStatus = (typeof functioningStatuses)[number];
