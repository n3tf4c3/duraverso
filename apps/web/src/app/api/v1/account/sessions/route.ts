import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
export const POST = mutation(mutationDependencies, async (actor) => {
  await database().query('UPDATE users SET session_version=session_version+1 WHERE id=$1 AND session_version=$2 AND disabled_at IS NULL', [actor.id, actor.sessionVersion]);
  return { message: 'Sessões encerradas.' };
});
