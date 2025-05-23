import { temporalSchema } from './temporal';
import { workerSchema } from './worker';

export const validationResult = temporalSchema
  .merge(workerSchema)
  .safeParse(process.env);
