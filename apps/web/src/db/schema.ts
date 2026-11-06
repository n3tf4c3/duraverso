import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid, varchar, boolean, numeric } from 'drizzle-orm/pg-core';
import { MAX_REVIEW_LENGTH, reviewStatuses, functioningStatuses } from '@duraverso/core';

export const roleEnum = pgEnum('account_role', ['member', 'moderator', 'admin']);
export const reviewStatusEnum = pgEnum('review_status', reviewStatuses);
export const functioningEnum = pgEnum('functioning_status', functioningStatuses);
export const buyAgainEnum = pgEnum('buy_again', ['yes', 'no', 'unsure']);
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// Operações atômicas e autorização também são verificadas nas funções SQL versionadas.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(), googleSubject: varchar('google_subject', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 80 }).notNull(), role: roleEnum('role').notNull().default('member'),
  sessionVersion: integer('session_version').notNull().default(0), disabledAt: timestamp('disabled_at', { withTimezone: true }), createdAt: createdAt(),
});
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(), slug: varchar('slug', { length: 120 }).notNull().unique(),
  brand: varchar('brand', { length: 80 }).notNull(), model: varchar('model', { length: 80 }).notNull(),
  category: varchar('category', { length: 30 }).notNull().default('washing_machine'),
  capacityKg: numeric('capacity_kg', { precision: 4, scale: 1 }),
  capacityLiters: numeric('capacity_liters', { precision: 6, scale: 1 }), burnerCount: integer('burner_count'),
  sourceUrl: text('source_url').notNull(),
  sourceCheckedAt: timestamp('source_checked_at', { withTimezone: true }).notNull(), verified: boolean('verified').notNull().default(false),
  catalogRevision: integer('catalog_revision').notNull().default(0),
}, (t) => [unique('product_brand_model_unique').on(t.brand, t.model), check('capacity_positive', sql`${t.capacityKg} > 0`),
  check('product_category_supported', sql`${t.category} IN ('washing_machine', 'refrigerator', 'microwave', 'stove')`),
  check('capacity_liters_positive', sql`${t.capacityLiters} > 0`), check('burner_count_positive', sql`${t.burnerCount} > 0`),
  check('product_category_measures', sql`(
    (${t.category} = 'washing_machine' AND ${t.capacityKg} IS NOT NULL AND ${t.capacityLiters} IS NULL AND ${t.burnerCount} IS NULL) OR
    (${t.category} IN ('refrigerator', 'microwave') AND ${t.capacityKg} IS NULL AND ${t.burnerCount} IS NULL) OR
    (${t.category} = 'stove' AND ${t.capacityKg} IS NULL AND ${t.capacityLiters} IS NULL)
  )`),
]);
export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(), productId: uuid('product_id').notNull().references(() => products.id),
  manufacturerCode: varchar('manufacturer_code', { length: 100 }).notNull(), voltage: integer('voltage').notNull(),
  // NULL preserva registros anteriores sem presumir a natureza do identificador.
  codeKind: varchar('code_kind', { length: 30 }),
  verified: boolean('verified').notNull().default(false),
}, (t) => [unique('variant_product_identity').on(t.id, t.productId), unique('variant_manufacturer_voltage').on(t.productId, t.manufacturerCode, t.voltage), check('voltage_supported', sql`${t.voltage} IN (127, 220)`), check('variant_code_kind_supported', sql`${t.codeKind} IS NULL OR ${t.codeKind} IN ('manufacturer_reference', 'catalog_reference')`)]);
export const gtins = pgTable('gtins', {
  code: varchar('code', { length: 14 }).primaryKey(), variantId: uuid('variant_id').notNull().references(() => variants.id),
  sourceUrl: text('source_url').notNull(),
}, (t) => [check('gtin_format', sql`${t.code} ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$'`)]);
export const catalogVariantEvidence = pgTable('catalog_variant_evidence', {
  gtinCode: varchar('gtin_code', { length: 14 }).primaryKey().references(() => gtins.code),
  voltageSourceUrl: text('voltage_source_url').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull(),
  note: text('note').notNull(), createdAt: createdAt(),
}, (t) => [check('catalog_evidence_note_required', sql`length(trim(${t.note})) > 0`)]);
export const catalogDecisions = pgTable('catalog_decisions', {
  id: uuid('id').primaryKey().defaultRandom(), administratorId: uuid('administrator_id').notNull().references(() => users.id),
  productId: uuid('product_id').notNull().references(() => products.id), variantId: uuid('variant_id'),
  beforeVerified: boolean('before_verified').notNull(), afterVerified: boolean('after_verified').notNull(),
  reason: varchar('reason', { length: MAX_REVIEW_LENGTH }).notNull(), snapshot: jsonb('snapshot').notNull(), createdAt: createdAt(),
}, (t) => [foreignKey({ columns: [t.variantId, t.productId], foreignColumns: [variants.id, variants.productId] }),
  check('catalog_decision_reason_required', sql`length(trim(${t.reason})) > 0`),
  check('catalog_decision_changes_state', sql`${t.beforeVerified} <> ${t.afterVerified}`)]);
export const ownerships = pgTable('ownerships', {
  id: uuid('id').primaryKey().defaultRandom(), ownerId: uuid('owner_id').notNull().references(() => users.id),
  productId: uuid('product_id').notNull().references(() => products.id), variantId: uuid('variant_id').notNull(),
  startedUsing: varchar('started_using', { length: 7 }).notNull(), acquiredUsed: boolean('acquired_used').notNull(),
  functioning: functioningEnum('functioning').notNull(), lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }), createdAt: createdAt(),
}, (t) => [unique('owner_one_model').on(t.ownerId, t.productId), foreignKey({ columns: [t.variantId, t.productId], foreignColumns: [variants.id, variants.productId] }), check('ownership_month_format', sql`${t.startedUsing} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`)]);
function reviewFields() {
  return {
    rating: integer('rating').notNull(), buyAgain: buyAgainEnum('buy_again').notNull(), hadRepair: boolean('had_repair').notNull(),
    comment: varchar('comment', { length: MAX_REVIEW_LENGTH }).notNull().default(''), status: reviewStatusEnum('status').notNull().default('pending'),
  };
}
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(), ownershipId: uuid('ownership_id').notNull().unique().references(() => ownerships.id),
  ...reviewFields(), updatedAt: updatedAt(), createdAt: createdAt(),
}, (t) => [check('review_rating_range', sql`${t.rating} BETWEEN 1 AND 5`)]);
// Alterações em análise não substituem a avaliação canônica publicada até aprovação.
export const reviewRevisions = pgTable('review_revisions', {
  id: uuid('id').primaryKey().defaultRandom(), reviewId: uuid('review_id').notNull().references(() => reviews.id),
  submissionId: uuid('submission_id').unique(),
  startedUsing: varchar('started_using', { length: 7 }), acquiredUsed: boolean('acquired_used'), functioning: functioningEnum('functioning'),
  ...reviewFields(), createdAt: createdAt(),
}, (t) => [check('revision_rating_range', sql`${t.rating} BETWEEN 1 AND 5`), check('revision_month_format', sql`${t.startedUsing} IS NULL OR ${t.startedUsing} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`)]);
export const repairs = pgTable('repairs', {
  id: uuid('id').primaryKey().defaultRandom(), ownershipId: uuid('ownership_id').notNull().references(() => ownerships.id),
  occurredMonth: varchar('occurred_month', { length: 7 }).notNull(), symptom: varchar('symptom', { length: 500 }).notNull(),
  repaired: boolean('repaired').notNull(), resultingStatus: functioningEnum('resulting_status').notNull(),
  costCents: integer('cost_cents'), comment: varchar('comment', { length: MAX_REVIEW_LENGTH }).notNull().default(''),
  status: reviewStatusEnum('status').notNull().default('pending'), createdAt: createdAt(),
}, (t) => [check('repair_cost_nonnegative', sql`${t.costCents} IS NULL OR ${t.costCents} >= 0`), check('repair_month_format', sql`${t.occurredMonth} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`)]);
export const moderationActions = pgTable('moderation_actions', {
  id: uuid('id').primaryKey().defaultRandom(), moderatorId: uuid('moderator_id').notNull().references(() => users.id),
  targetType: varchar('target_type', { length: 30 }).notNull(), targetId: uuid('target_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), reason: varchar('reason', { length: 2000 }).notNull(), createdAt: createdAt(),
}, (t) => [check('moderation_reason_required', sql`length(trim(${t.reason})) > 0`)]);
