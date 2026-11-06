import { prepareCatalog } from '@duraverso/core';
import { catalog } from './catalog';
import { catalogVariantEvidence } from './catalog-variants';

// Sem importar env, cliente de banco ou runtime conectado.
export function catalogPlan() {
  return prepareCatalog(catalog, catalogVariantEvidence);
}
