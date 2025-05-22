import { z } from 'zod';

import { temporalSchema } from './temporal';
import { workerSchema } from './worker';

export const validationResult = z
  .object({
    ...temporalSchema.shape,
    ...workerSchema.shape,
  })
  .safeParse(process.env);
