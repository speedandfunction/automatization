import { mongoDatabaseSchema } from './mongoDatabase';
import { qboSchema } from './qbo';
import { redmineDatabaseSchema } from './redmineDatabase';
import { slackSchema } from './slack';
import { temporalSchema } from './temporal';
import { workerSchema } from './worker';

export const validationResult = temporalSchema
  .merge(workerSchema)
  .merge(slackSchema)
  .merge(redmineDatabaseSchema)
  .merge(mongoDatabaseSchema)
  .merge(qboSchema)
  .safeParse(process.env);
