import { readServerEnv } from '@/lib/env';
import { database } from './database';
import { enforceLimit } from './limits';
export async function preflight() {
  try {
    if (readServerEnv().DURAVERSO_MODE !== 'connected') return;
    const [rows] = await Promise.all([
      database().query<{ ready: boolean }>(`SELECT to_regprocedure('duraverso_submit_review(uuid,integer,uuid,jsonb)') IS NOT NULL
        AND to_regprocedure('duraverso_moderate_review(uuid,integer,uuid,review_status,text)') IS NOT NULL
        AND to_regprocedure('duraverso_withdraw_review(uuid,integer,uuid)') IS NOT NULL
        AND to_regprocedure('duraverso_catalog_admin_read(uuid,integer)') IS NOT NULL
        AND to_regprocedure('duraverso_decide_catalog(uuid,integer,jsonb)') IS NOT NULL AS ready`),
      enforceLimit('auth', 'preflight'),
    ]);
    if (!rows[0]?.ready) throw new Error('schema_missing');
  } catch { throw new Error('Modo conectado indisponível: confira a configuração, as migrações e o limitador compartilhado. Nenhuma credencial é exibida.'); }
}
