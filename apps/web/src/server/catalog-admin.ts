import { z } from 'zod';
import { adminCatalogProductSchema, catalogActivationIssues, catalogDecisionSchema, type Actor } from '@duraverso/core';
import type { Database } from './database';
import { ServiceError, serviceError } from './errors';

const entrySchema = z.object({
  product: adminCatalogProductSchema,
  token: z.string().regex(/^[a-f0-9]{32}$/),
  history: z.array(
    z.object({
      id: z.uuid(),
      administratorId: z.uuid(),
      administrator: z.string(),
      variantId: z.uuid().nullable(),
      beforeVerified: z.boolean(),
      afterVerified: z.boolean(),
      reason: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export class CatalogAdminService {
  constructor(private db: Database) {}
  async read(actor: Actor) {
    try {
      const rows = await this.db.query<{ data: unknown }>(
        'SELECT duraverso_catalog_admin_read($1::uuid,$2::integer) AS data',
        [actor.id, actor.sessionVersion],
      );
      return z.array(entrySchema).parse(rows[0]?.data);
    } catch (error) {
      throw serviceError(error);
    }
  }
  async decide(actor: Actor, input: unknown) {
    const parsed = catalogDecisionSchema.safeParse(input);
    if (!parsed.success) throw new ServiceError(422, 'Confira a decisão, o motivo e a confirmação das evidências.');
    try {
      if (parsed.data.verified) {
        const entry = (await this.read(actor)).find((item) => item.product.id === parsed.data.productId);
        if (!entry) throw new ServiceError(404, 'Item do catálogo não encontrado.');
        if (entry.token !== parsed.data.expectedToken) throw serviceError(new Error('catalog_changed'));
        const issues = catalogActivationIssues(entry.product, parsed.data.variantId);
        if (issues.length) throw new ServiceError(422, issues.join(' '));
      }
      // O SQL confere novamente sessão/papel/token sob lock; a leitura acima não concede autorização.
      await this.db.query('SELECT duraverso_decide_catalog($1::uuid,$2::integer,$3::jsonb)', [
        actor.id,
        actor.sessionVersion,
        JSON.stringify(parsed.data),
      ]);
      return { message: 'Decisão registrada no histórico do catálogo.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
}
