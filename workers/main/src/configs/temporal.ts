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
 * - Schedule ID: 'weekly-financial-report-schedule'
 * - Cron Expression: '0 13 * * 2' (Every Tuesday at 1 PM)
 * - Timezone: 'America/New_York' (automatically handles EST/EDT transitions)
 * - Workflow: weeklyFinancialReportsWorkflow
 * - Task Queue: 'main-queue'
 * - Overlap Policy: SKIP (prevents concurrent runs)
 * - Catchup Window: 1 day (runs missed schedules within 24 hours)
 * 
 * The schedule is automatically created/verified when the worker starts.
 * See src/configs/schedules.ts for implementation details.
 */
