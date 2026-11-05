import { profileInputSchema } from '@duraverso/core';
import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
import { ServiceError } from '@/server/errors';
export const POST = mutation(mutationDependencies, async (actor, input) => {
  const parsed = profileInputSchema.safeParse(input); if (!parsed.success) throw new ServiceError(422, 'Use um nome público entre 2 e 80 caracteres.');
  const updated = await database().query('UPDATE users SET display_name=$3 WHERE id=$1 AND session_version=$2 AND disabled_at IS NULL RETURNING id', [actor.id, actor.sessionVersion, parsed.data.displayName]);
  if (!updated.length) throw new ServiceError(401, 'Entre novamente.');
  return { message: 'Nome público atualizado.' };
});
