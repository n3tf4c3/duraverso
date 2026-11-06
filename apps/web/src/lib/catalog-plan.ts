import { prepareCatalog } from '@duraverso/core';
import { catalog, washingMachineCatalog } from './catalog';
import { catalogVariantEvidence } from './catalog-variants';

// Sem importar env, cliente de banco ou runtime conectado.
// O lote de importação permanece explícito: só as lavadoras têm variantes documentadas.
// A consulta completa expõe as lacunas das novas categorias sem inferir identidades.
export function catalogPlan(scope: 'prepared' | 'all' = 'prepared') {
  return prepareCatalog(scope === 'all' ? catalog : washingMachineCatalog, catalogVariantEvidence);
}
