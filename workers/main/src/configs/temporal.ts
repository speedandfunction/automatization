import { NativeConnectionOptions } from '@temporalio/worker';
import { z } from 'zod';

const DEFAULT_TEMPORAL_ADDRESS = 'temporal:7233';

/**
 * Temporal connection configuration
 * Used by both workers and clients to connect to Temporal server
 */
export const temporalConfig: NativeConnectionOptions = {
  address: process.env.TEMPORAL_ADDRESS || DEFAULT_TEMPORAL_ADDRESS,
};

export const temporalSchema = z.object({
  TEMPORAL_ADDRESS: z.string().default(DEFAULT_TEMPORAL_ADDRESS),
});

/**
 * Schedule Configuration Documentation
 *
 * Weekly Financial Report Schedule:
 * The schedule is automatically created/verified when the worker starts.
 *
 * For schedule configuration details (schedule ID, cron expression, timezone, etc.),
 * see the exported `scheduleConfig` object in ./schedules.ts
 *
 * Implementation: ./schedules.ts
 */
