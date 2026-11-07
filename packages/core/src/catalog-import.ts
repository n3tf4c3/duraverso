import {
  prepareCatalog,
  productCategory,
  productMeasurementFields,
  type CatalogVariantEvidence,
  type Product,
} from './index';

export type StoredCatalog = {
  products: (Pick<
    Product,
    | 'slug'
    | 'brand'
    | 'model'
    | 'category'
    | 'capacityKg'
    | 'capacityLiters'
    | 'burnerCount'
    | 'placeSettings'
    | 'powerWatts'
    | 'coolingCapacityBtuH'
    | 'sourceUrl'
    | 'sourceCheckedAt'
  > & { id: string })[];
  variants: { id: string; productId: string; manufacturerCode: string; voltage: number; codeKind: string | null }[];
  gtins: { code: string; variantId: string; sourceUrl: string }[];
  evidence: { gtinCode: string; voltageSourceUrl: string; checkedAt: string; note: string }[];
};
export type CatalogImportConflict = { entity: 'product' | 'variant' | 'gtin' | 'evidence'; key: string };

// Comparação pura e conservadora: nenhum registro existente será atualizado ou removido.
// As chaves dos conflitos vêm do plano local, sem expor conteúdo arbitrário do banco.
export function reconcileCatalog(productsInput: unknown, evidenceInput: unknown, stored: StoredCatalog) {
  const plan = prepareCatalog(productsInput, evidenceInput);
  if (!plan.selectedCatalogCovered) throw new Error('O catálogo selecionado ainda tem lacunas de evidência.');
  const conflicts: CatalogImportConflict[] = [];
  const productsToInsert: Product[] = [];
  const variantsToInsert: CatalogVariantEvidence[] = [];
  const gtinsToInsert: CatalogVariantEvidence[] = [];
  const evidenceToInsert: CatalogVariantEvidence[] = [];
  for (const product of plan.products) {
    const row = stored.products.find((entry) => entry.slug === product.slug);
    const sameName = stored.products.find((entry) => entry.brand === product.brand && entry.model === product.model);
    if (
      (sameName && sameName.slug !== product.slug) ||
      (row &&
        (row.brand !== product.brand ||
          row.model !== product.model ||
          productCategory(row) !== productCategory(product) ||
          productMeasurementFields.some((field) => row[field] !== product[field]) ||
          row.sourceUrl !== product.sourceUrl ||
          row.sourceCheckedAt !== product.sourceCheckedAt))
    ) {
      conflicts.push({ entity: 'product', key: product.slug });
    } else if (!row) productsToInsert.push(product);
  }
  for (const variant of plan.variants) {
    const product = stored.products.find((entry) => entry.slug === variant.productSlug);
    const matches = stored.variants.filter(
      (entry) => entry.productId === product?.id && entry.manufacturerCode === variant.manufacturerCode,
    );
    const row = matches[0];
    if (matches.length > 1 || (row && (row.voltage !== variant.voltage || row.codeKind !== variant.codeKind))) {
      conflicts.push({ entity: 'variant', key: variant.gtin });
    } else if (!row) variantsToInsert.push(variant);

    const gtin = stored.gtins.find((entry) => entry.code === variant.gtin);
    if (gtin && (gtin.variantId !== row?.id || gtin.sourceUrl !== variant.sourceUrl)) {
      conflicts.push({ entity: 'gtin', key: variant.gtin });
    } else if (!gtin) gtinsToInsert.push(variant);
    const evidence = stored.evidence.find((entry) => entry.gtinCode === variant.gtin);
    if (
      evidence &&
      (evidence.voltageSourceUrl !== variant.voltageSourceUrl ||
        evidence.checkedAt !== variant.checkedAt ||
        evidence.note !== variant.note)
    ) {
      conflicts.push({ entity: 'evidence', key: variant.gtin });
    } else if (!evidence) evidenceToInsert.push(variant);
  }
  return { productsToInsert, variantsToInsert, gtinsToInsert, evidenceToInsert, conflicts };
}
