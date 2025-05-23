import { NativeConnectionOptions } from '@temporalio/worker';
import { z } from 'zod';

const DEFAULT_TEMPORAL_ADDRESS = 'temporal:7233';

export const temporalConfig: NativeConnectionOptions = {
  address: process.env.TEMPORAL_ADDRESS || DEFAULT_TEMPORAL_ADDRESS,
};

export const temporalSchema = z.object({
  TEMPORAL_ADDRESS: z.string().default(DEFAULT_TEMPORAL_ADDRESS),
});
