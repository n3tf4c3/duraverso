import { readServerEnv } from '@/lib/env';
import { database } from './database';
import { enforceLimit } from './limits';
export const connectedSchemaReadinessSql = `SELECT to_regprocedure('duraverso_submit_review(uuid,integer,uuid,jsonb)') IS NOT NULL
  AND to_regprocedure('duraverso_moderate_review(uuid,integer,uuid,review_status,text)') IS NOT NULL
  AND to_regprocedure('duraverso_withdraw_review(uuid,integer,uuid)') IS NOT NULL
  AND to_regprocedure('duraverso_catalog_admin_read(uuid,integer)') IS NOT NULL
  AND to_regprocedure('duraverso_decide_catalog(uuid,integer,jsonb)') IS NOT NULL
  AND to_regprocedure('duraverso_catalog_categories_version()') IS NOT NULL
  AND duraverso_catalog_categories_version() >= 5
  AND (SELECT count(*)=6 FROM pg_attribute WHERE attrelid=to_regclass('public.products')
    AND attname IN ('category','capacity_liters','burner_count','place_settings','power_watts','cooling_capacity_btu_h') AND NOT attisdropped)
  AND (SELECT count(*)=8 FROM pg_constraint WHERE conrelid=to_regclass('public.products') AND convalidated
    AND conname IN ('capacity_positive','product_category_supported','capacity_liters_positive','burner_count_positive',
      'place_settings_positive','power_watts_positive','cooling_capacity_btu_h_positive','product_category_measures')) AS ready`;
export async function preflight() {
  try {
    if (readServerEnv().DURAVERSO_MODE !== 'connected') return;
    const [rows] = await Promise.all([
      database().query<{ ready: boolean }>(connectedSchemaReadinessSql),
      enforceLimit('auth', 'preflight'),
    ]);
    if (!rows[0]?.ready) throw new Error('schema_missing');
  } catch {
    throw new Error(
      'Modo conectado indisponível: confira a configuração, as migrações e o limitador compartilhado. Nenhuma credencial é exibida.',
    );
  }
}
