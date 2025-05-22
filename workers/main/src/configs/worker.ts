import { WorkerOptions } from '@temporalio/worker';
import path from 'path';
import { z } from 'zod';

export const workerConfig: WorkerOptions = {
  taskQueue: 'main-queue',
  workflowsPath: path.join(__dirname, '../workflows'),
};

export const workerSchema = z.object({
  TEMPORAL_ADDRESS: z.string().default('temporal:7233'),
});
