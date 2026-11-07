import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
import { RepairService } from '@/server/repairs';
export const POST = mutation(mutationDependencies, (actor, input) =>
  new RepairService(database()).moderate(actor, input),
);
