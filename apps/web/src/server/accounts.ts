import type { Actor } from '@duraverso/core';
import type { Database } from './database';
import { z } from 'zod';
export const verifiedGoogleProfile = z.object({ sub: z.string().min(1).max(255), email_verified: z.literal(true) });
export async function accountForGoogle(db: Database, profile: unknown): Promise<Actor> {
  const parsed = verifiedGoogleProfile.parse(profile);
  const rows = await db.query<Actor & Record<string, unknown>>(
    `INSERT INTO users(google_subject,display_name) VALUES($1,'Proprietário')
    ON CONFLICT(google_subject) DO UPDATE SET google_subject=EXCLUDED.google_subject WHERE users.disabled_at IS NULL
    RETURNING id,display_name AS "displayName",role,session_version AS "sessionVersion"`,
    [parsed.sub],
  );
  if (!rows[0]) throw new Error('actor_invalid');
  return rows[0];
}
export async function accountForSession(db: Database, id: string, version: number): Promise<Actor | null> {
  const rows = await db.query<Actor & Record<string, unknown>>(
    'SELECT id,display_name AS "displayName",role,session_version AS "sessionVersion" FROM users WHERE id=$1::uuid AND session_version=$2 AND disabled_at IS NULL',
    [id, version],
  );
  return rows[0] ?? null;
}
