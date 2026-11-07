import { z } from 'zod';
import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
import { RepairService } from '@/server/repairs';
import { ServiceError } from '@/server/errors';
export const POST = mutation(mutationDependencies, (actor, input) => {
  const parsed = z.strictObject({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) throw new ServiceError(422, 'Identificador inválido.');
  return new RepairService(database()).withdraw(actor, parsed.data.id);
});
