import { z } from 'zod';
import {
  repairModerationSchema,
  repairSubmissionSchema,
  validateRepair,
  type Actor,
  type RepairInput,
} from '@duraverso/core';
import type { Database } from './database';
import { ServiceError, serviceError } from './errors';

export type RepairRow = {
  id: string;
  reviewId: string;
  occurredMonth: string;
  symptom: string;
  repaired: boolean;
  resultingStatus: RepairInput['resultingStatus'];
  costCents: number | null;
  comment: string;
  status: string;
  createdAt: string;
};
export type OwnRepairRow = RepairRow & { reason: string | null };
export type QueuedRepairRow = RepairRow & {
  brand: string;
  model: string;
  voltage: number;
  displayName: string;
  startedUsing: string;
};
const columns = `rp.id,r.id AS "reviewId",rp.occurred_month AS "occurredMonth",rp.symptom,rp.repaired,
  rp.resulting_status AS "resultingStatus",rp.cost_cents AS "costCents",rp.comment,rp.status,rp.created_at::text AS "createdAt"`;

export class RepairService {
  constructor(private db: Database) {}
  async submit(actor: Actor, input: unknown) {
    const parsed = repairSubmissionSchema.safeParse(input);
    if (!parsed.success || !validateRepair(parsed.data.repair).success)
      throw new ServiceError(422, 'Confira os campos do reparo e o mês em que aconteceu.');
    try {
      const rows = await this.db.query<{ id: string }>(
        'SELECT duraverso_submit_repair($1::uuid,$2::integer,$3::uuid,$4::jsonb) AS id',
        [actor.id, actor.sessionVersion, parsed.data.submissionId, JSON.stringify(parsed.data.repair)],
      );
      return { id: rows[0]!.id, message: 'Reparo enviado para revisão.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  async moderate(actor: Actor, input: unknown) {
    const parsed = repairModerationSchema.safeParse(input);
    if (!parsed.success) throw new ServiceError(422, 'Informe a decisão e seu motivo.');
    try {
      await this.db.query(
        'SELECT duraverso_moderate_repair($1::uuid,$2::integer,$3::uuid,$4::review_status,$5::text)',
        [actor.id, actor.sessionVersion, parsed.data.repairId, parsed.data.decision, parsed.data.reason],
      );
      return { message: 'Decisão registrada.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  async withdraw(actor: Actor, id: string) {
    if (!z.uuid().safeParse(id).success) throw new ServiceError(422, 'Identificador inválido.');
    try {
      await this.db.query('SELECT duraverso_withdraw_repair($1::uuid,$2::integer,$3::uuid)', [
        actor.id,
        actor.sessionVersion,
        id,
      ]);
      return { message: 'Reparo retirado.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  /** Somente reparos do próprio dono, com o motivo da última decisão. */
  async mine(actor: Actor): Promise<OwnRepairRow[]> {
    return this.db.query<OwnRepairRow & Record<string, unknown>>(
      `SELECT ${columns},a.reason
      FROM repairs rp JOIN ownerships o ON o.id=rp.ownership_id JOIN reviews r ON r.ownership_id=o.id JOIN users u ON u.id=o.owner_id
      LEFT JOIN LATERAL (SELECT reason FROM moderation_actions WHERE target_type='repair' AND target_id=rp.id
        ORDER BY created_at DESC,id DESC LIMIT 1) a ON true
      WHERE o.owner_id=$1 AND u.session_version=$2 AND u.disabled_at IS NULL AND rp.status<>'withdrawn'
      ORDER BY rp.occurred_month DESC,rp.created_at DESC LIMIT 200`,
      [actor.id, actor.sessionVersion],
    );
  }
  async queue(actor: Actor): Promise<QueuedRepairRow[]> {
    if (!['admin', 'moderator'].includes(actor.role)) throw new ServiceError(403, 'Área restrita à moderação.');
    return this.db.query<QueuedRepairRow & Record<string, unknown>>(
      `SELECT ${columns},p.brand,p.model,v.voltage,u.display_name AS "displayName",o.started_using AS "startedUsing"
      FROM repairs rp JOIN ownerships o ON o.id=rp.ownership_id JOIN reviews r ON r.ownership_id=o.id JOIN users u ON u.id=o.owner_id
      JOIN products p ON p.id=o.product_id JOIN variants v ON v.id=o.variant_id
      WHERE rp.status='pending' AND r.status<>'withdrawn' AND o.owner_id<>$1
        AND EXISTS(SELECT 1 FROM users WHERE id=$1 AND session_version=$2 AND disabled_at IS NULL AND role IN ('admin','moderator'))
      ORDER BY rp.created_at,rp.id LIMIT 100`,
      [actor.id, actor.sessionVersion],
    );
  }
  /** Público: reparos aprovados de relatos publicados. Nenhum identificador de conta. */
  async published(slug: string, variantId: string): Promise<RepairRow[]> {
    return this.db.query<RepairRow & Record<string, unknown>>(
      `SELECT ${columns}
      FROM repairs rp JOIN ownerships o ON o.id=rp.ownership_id JOIN reviews r ON r.ownership_id=o.id JOIN users u ON u.id=o.owner_id
      JOIN products p ON p.id=o.product_id JOIN variants v ON v.id=o.variant_id
      WHERE p.slug=$1 AND v.id=$2::uuid AND p.verified AND v.verified AND r.status='published' AND rp.status='published'
        AND u.disabled_at IS NULL
      ORDER BY rp.occurred_month DESC,rp.id DESC LIMIT 200`,
      [slug, variantId],
    );
  }
}
