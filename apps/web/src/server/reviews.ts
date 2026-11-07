import { z } from 'zod';
import {
  durabilitySummary,
  MIN_COMMUNITY_REVIEWS,
  moderationInputSchema,
  reviewSubmissionSchema,
  validateReview,
  type Actor,
  type ReviewInput,
} from '@duraverso/core';
import type { Database } from './database';
import { ServiceError, serviceError } from './errors';

export type Variant = { id: string; manufacturerCode: string; voltage: number };
export type ReviewRow = {
  id: string;
  revisionId: string | null;
  productSlug: string;
  brand: string;
  model: string;
  variantId: string;
  voltage: number;
  rating: number;
  comment: string;
  status: string;
  pendingStatus: string | null;
  reason: string | null;
  startedUsing: string;
  acquired: 'new' | 'used';
  functioning: ReviewInput['functioning'];
  hadRepair: boolean;
  buyAgain: ReviewInput['buyAgain'];
  displayName: string;
  updatedAt: string;
};
export class ReviewService {
  constructor(private db: Database) {}
  async variants(slug: string): Promise<Variant[]> {
    return this.db.query<Variant & Record<string, unknown>>(
      'SELECT v.id,v.manufacturer_code AS "manufacturerCode",v.voltage FROM variants v JOIN products p ON p.id=v.product_id WHERE p.slug=$1 AND p.verified AND v.verified ORDER BY v.voltage,v.manufacturer_code',
      [slug],
    );
  }
  async submit(actor: Actor, input: unknown) {
    const parsed = reviewSubmissionSchema.safeParse(input);
    if (!parsed.success || !validateReview(parsed.data.review).success)
      throw new ServiceError(422, 'Confira os campos da avaliação e a data de início de uso.');
    try {
      const rows = await this.db.query<{ id: string }>(
        'SELECT duraverso_submit_review($1::uuid,$2::integer,$3::uuid,$4::jsonb) AS id',
        [actor.id, actor.sessionVersion, parsed.data.submissionId, JSON.stringify(parsed.data.review)],
      );
      return { id: rows[0]!.id, message: 'Avaliação enviada para revisão.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  async moderate(actor: Actor, input: unknown) {
    const parsed = moderationInputSchema.safeParse(input);
    if (!parsed.success) throw new ServiceError(422, 'Informe a decisão e seu motivo.');
    try {
      await this.db.query(
        'SELECT duraverso_moderate_review($1::uuid,$2::integer,$3::uuid,$4::review_status,$5::text)',
        [actor.id, actor.sessionVersion, parsed.data.revisionId, parsed.data.decision, parsed.data.reason],
      );
      return { message: 'Decisão registrada.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  async withdraw(actor: Actor, id: string) {
    if (!z.uuid().safeParse(id).success) throw new ServiceError(422, 'Identificador inválido.');
    try {
      await this.db.query('SELECT duraverso_withdraw_review($1::uuid,$2::integer,$3::uuid)', [
        actor.id,
        actor.sessionVersion,
        id,
      ]);
      return { message: 'Avaliação retirada.' };
    } catch (error) {
      throw serviceError(error);
    }
  }
  async mine(actor: Actor): Promise<ReviewRow[]> {
    return this.db.query<ReviewRow & Record<string, unknown>>(
      `SELECT r.id,rv.id AS "revisionId",p.slug AS "productSlug",p.brand,p.model,v.id AS "variantId",v.voltage,
      COALESCE(rv.rating,r.rating) AS rating,COALESCE(rv.comment,r.comment) AS comment,r.status,rv.status AS "pendingStatus",a.reason,
      COALESCE(rv.started_using,o.started_using) AS "startedUsing",CASE WHEN COALESCE(rv.acquired_used,o.acquired_used) THEN 'used' ELSE 'new' END AS acquired,
      COALESCE(rv.functioning,o.functioning) AS functioning,COALESCE(rv.had_repair,r.had_repair) AS "hadRepair",COALESCE(rv.buy_again,r.buy_again) AS "buyAgain",u.display_name AS "displayName",r.updated_at::text AS "updatedAt"
      FROM reviews r JOIN ownerships o ON o.id=r.ownership_id JOIN users u ON u.id=o.owner_id JOIN variants v ON v.id=o.variant_id JOIN products p ON p.id=o.product_id
      LEFT JOIN LATERAL (SELECT * FROM review_revisions WHERE review_id=r.id ORDER BY created_at DESC,id DESC LIMIT 1) rv ON true
      LEFT JOIN LATERAL (SELECT reason FROM moderation_actions WHERE target_id=rv.id ORDER BY created_at DESC,id DESC LIMIT 1) a ON true
      WHERE o.owner_id=$1 AND u.session_version=$2 AND u.disabled_at IS NULL ORDER BY r.updated_at DESC LIMIT 100`,
      [actor.id, actor.sessionVersion],
    );
  }
  async queue(actor: Actor): Promise<ReviewRow[]> {
    if (!['admin', 'moderator'].includes(actor.role)) throw new ServiceError(403, 'Área restrita à moderação.');
    return this.db.query<ReviewRow & Record<string, unknown>>(
      `SELECT r.id,rv.id AS "revisionId",p.slug AS "productSlug",p.brand,p.model,v.id AS "variantId",v.voltage,
      rv.rating,rv.comment,r.status,rv.status AS "pendingStatus",NULL::text AS reason,rv.started_using AS "startedUsing",
      CASE WHEN rv.acquired_used THEN 'used' ELSE 'new' END AS acquired,rv.functioning,rv.had_repair AS "hadRepair",rv.buy_again AS "buyAgain",u.display_name AS "displayName",rv.created_at::text AS "updatedAt"
      FROM review_revisions rv JOIN reviews r ON r.id=rv.review_id JOIN ownerships o ON o.id=r.ownership_id JOIN users u ON u.id=o.owner_id JOIN products p ON p.id=o.product_id JOIN variants v ON v.id=o.variant_id
      WHERE rv.status='pending' AND r.status<>'withdrawn' AND o.owner_id<>$1 AND EXISTS(SELECT 1 FROM users WHERE id=$1 AND session_version=$2 AND disabled_at IS NULL AND role IN ('admin','moderator'))
      ORDER BY rv.created_at,rv.id LIMIT 100`,
      [actor.id, actor.sessionVersion],
    );
  }
  async published(slug: string, variantId: string) {
    // Dados públicos vêm somente da versão canônica aprovada. Nenhum ID de conta/Google é exposto.
    return this.db.query<{
      id: string;
      rating: number;
      comment: string;
      displayName: string;
      startedUsing: string;
      functioning: string;
      hadRepair: boolean;
      updatedAt: string;
    }>(
      `SELECT r.id,r.rating,r.comment,u.display_name AS "displayName",o.started_using AS "startedUsing",o.functioning,r.had_repair AS "hadRepair",r.updated_at::text AS "updatedAt"
      FROM reviews r JOIN ownerships o ON o.id=r.ownership_id JOIN users u ON u.id=o.owner_id JOIN variants v ON v.id=o.variant_id JOIN products p ON p.id=o.product_id
      WHERE p.slug=$1 AND v.id=$2::uuid AND p.verified AND v.verified AND r.status='published' AND u.disabled_at IS NULL ORDER BY r.updated_at DESC,r.id DESC LIMIT 50`,
      [slug, variantId],
    );
  }
  async summary(slug: string, variantId: string) {
    const rows = await this.db.query<{ count: number; average: number | null }>(
      `SELECT count(*)::integer AS count,CASE WHEN count(*) >= $3 THEN round(avg(r.rating),1)::float ELSE NULL END AS average
      FROM reviews r JOIN ownerships o ON o.id=r.ownership_id JOIN users u ON u.id=o.owner_id JOIN products p ON p.id=o.product_id JOIN variants v ON v.id=o.variant_id
      WHERE p.slug=$1 AND v.id=$2::uuid AND p.verified AND v.verified AND r.status='published' AND u.disabled_at IS NULL`,
      [slug, variantId, MIN_COMMUNITY_REVIEWS],
    );
    return rows[0] ?? { count: 0, average: null };
  }
  /** Mesma elegibilidade da média; o banco só agrupa linhas iguais e a regra fica no core. */
  async durability(slug: string, variantId: string) {
    const rows = await this.db.query<{
      startedUsing: string;
      confirmedMonth: string;
      functioning: ReviewInput['functioning'];
      hadRepair: boolean;
      count: number;
    }>(
      `SELECT o.started_using AS "startedUsing",to_char(o.last_confirmed_at AT TIME ZONE 'UTC','YYYY-MM') AS "confirmedMonth",
        o.functioning,r.had_repair AS "hadRepair",count(*)::integer AS count
      FROM reviews r JOIN ownerships o ON o.id=r.ownership_id JOIN users u ON u.id=o.owner_id JOIN products p ON p.id=o.product_id JOIN variants v ON v.id=o.variant_id
      WHERE p.slug=$1 AND v.id=$2::uuid AND p.verified AND v.verified AND r.status='published' AND u.disabled_at IS NULL
      GROUP BY 1,2,3,4`,
      [slug, variantId],
    );
    return durabilitySummary(rows);
  }
}
