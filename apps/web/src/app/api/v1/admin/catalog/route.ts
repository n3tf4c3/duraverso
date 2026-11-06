import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
import { CatalogAdminService } from '@/server/catalog-admin';

export const POST = mutation(mutationDependencies, (actor, input) => new CatalogAdminService(database()).decide(actor, input));
