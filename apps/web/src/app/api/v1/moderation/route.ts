import { mutation } from '@/server/http';
import { mutationDependencies } from '@/server/runtime';
import { database } from '@/server/database';
import { ReviewService } from '@/server/reviews';
export const POST = mutation(mutationDependencies, (actor, input) => new ReviewService(database()).moderate(actor, input));
