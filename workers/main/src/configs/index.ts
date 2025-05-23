import { redmineDatabaseSchema } from './redmineDatabase';
import { temporalSchema } from './temporal';
import { workerSchema } from './worker';

export const validationResult = temporalSchema
  .merge(workerSchema)
  .merge(redmineDatabaseSchema)
  .safeParse(process.env);
