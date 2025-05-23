import { WorkerOptions } from '@temporalio/worker';
import path from 'path';
import { z } from 'zod';

export const workerConfig: WorkerOptions = {
  taskQueue: 'main-queue',
  workflowsPath:
    process.env.WORKFLOWS_PATH || path.join(__dirname, '../workflows'),
};

export const workerSchema = z.object({
  WORKFLOWS_PATH: z.string().optional(),
});
