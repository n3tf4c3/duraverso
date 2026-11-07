import { currentActor } from '@/auth';
import { isConnected, readServerEnv } from '@/lib/env';
import { enforceLimit } from './limits';
import type { MutationDependencies } from './http';
export const mutationDependencies: MutationDependencies = {
  enabled: isConnected,
  origin: () => readServerEnv().APP_ORIGIN,
  actor: currentActor,
  limit: (actor) => enforceLimit('write', actor.id),
};
