import type { Client, PoolClient } from 'pg';
import { productCategory, reconcileCatalog, type StoredCatalog } from '@duraverso/core';

// Aceita apenas uma sessão dedicada. Não usar pool.query nem Neon HTTP aqui.
type Session = Client | PoolClient;
export async function importCatalog(client: Session, products: unknown, evidence: unknown, apply = false) {
  // Validação completa antes de iniciar qualquer transação.
  reconcileCatalog(products, evidence, { products: [], variants: [], gtins: [], evidence: [] });
  await client.query(apply ? 'BEGIN ISOLATION LEVEL READ COMMITTED' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query('SET LOCAL search_path = public, pg_catalog');
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    if (apply) {
      // Mesma chave do migrador; liberada automaticamente por COMMIT/ROLLBACK.
      await client.query('SELECT pg_advisory_xact_lock($1)', [7340821]);
      // Protege também contra escritores que não conhecem o advisory lock.
      await client.query('LOCK TABLE products, variants, gtins, catalog_variant_evidence IN SHARE ROW EXCLUSIVE MODE');
    }
    const stored: StoredCatalog = {
      products: (await client.query(`SELECT id,slug,brand,model,category,capacity_kg::float AS "capacityKg",
        capacity_liters::float AS "capacityLiters",burner_count AS "burnerCount",
        place_settings AS "placeSettings",power_watts::float AS "powerWatts",source_url AS "sourceUrl",
        to_char(source_checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS "sourceCheckedAt" FROM products`)).rows.map((row) => ({
          ...row, capacityKg: row.capacityKg ?? undefined, capacityLiters: row.capacityLiters ?? undefined, burnerCount: row.burnerCount ?? undefined,
          placeSettings: row.placeSettings ?? undefined, powerWatts: row.powerWatts ?? undefined,
        })),
      variants: (await client.query('SELECT id,product_id AS "productId",manufacturer_code AS "manufacturerCode",voltage,code_kind AS "codeKind" FROM variants')).rows,
      gtins: (await client.query('SELECT code,variant_id AS "variantId",source_url AS "sourceUrl" FROM gtins')).rows,
      evidence: (await client.query(`SELECT gtin_code AS "gtinCode",voltage_source_url AS "voltageSourceUrl",
        to_char(checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS "checkedAt",note FROM catalog_variant_evidence`)).rows,
    };
    const plan = reconcileCatalog(products, evidence, stored);
    const report = {
      mode: apply ? 'apply' as const : 'dry_run' as const,
      applied: false,
      insertions: { products: plan.productsToInsert.length, variants: plan.variantsToInsert.length,
        gtins: plan.gtinsToInsert.length, evidence: plan.evidenceToInsert.length },
      conflicts: plan.conflicts,
    };
    if (!apply || plan.conflicts.length) {
      await client.query('ROLLBACK');
      return report;
    }
    const productIds = new Map(stored.products.map((product) => [product.slug, product.id]));
    for (const product of plan.productsToInsert) {
      const result = await client.query(`INSERT INTO products(slug,brand,model,capacity_kg,source_url,source_checked_at,verified,category,capacity_liters,burner_count,place_settings,power_watts)
        VALUES($1,$2,$3,$4,$5,$6,false,$7,$8,$9,$10,$11) RETURNING id`, [product.slug, product.brand, product.model,
        product.capacityKg ?? null, product.sourceUrl, `${product.sourceCheckedAt}T00:00:00Z`,
        productCategory(product), product.capacityLiters ?? null, product.burnerCount ?? null, product.placeSettings ?? null, product.powerWatts ?? null]);
      productIds.set(product.slug, result.rows[0].id);
    }
    const key = (productId: string, code: string) => JSON.stringify([productId, code]);
    const variantIds = new Map(stored.variants.map((variant) => [key(variant.productId, variant.manufacturerCode), variant.id]));
    for (const variant of plan.variantsToInsert) {
      const productId = productIds.get(variant.productSlug)!;
      const result = await client.query(`INSERT INTO variants(product_id,manufacturer_code,voltage,code_kind,verified)
        VALUES($1,$2,$3,$4,false) RETURNING id`, [productId, variant.manufacturerCode, variant.voltage, variant.codeKind]);
      variantIds.set(key(productId, variant.manufacturerCode), result.rows[0].id);
    }
    for (const variant of plan.gtinsToInsert) {
      const variantId = variantIds.get(key(productIds.get(variant.productSlug)!, variant.manufacturerCode))!;
      await client.query('INSERT INTO gtins(code,variant_id,source_url) VALUES($1,$2,$3)', [variant.gtin, variantId, variant.sourceUrl]);
    }
    for (const variant of plan.evidenceToInsert) {
      await client.query(`INSERT INTO catalog_variant_evidence(gtin_code,voltage_source_url,checked_at,note)
        VALUES($1,$2,$3,$4)`, [variant.gtin, variant.voltageSourceUrl, `${variant.checkedAt}T00:00:00Z`, variant.note]);
    }
    await client.query('COMMIT');
    return { ...report, applied: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
