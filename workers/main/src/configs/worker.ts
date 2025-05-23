import { WorkerOptions } from '@temporalio/worker';
import { z } from 'zod';

export const workerConfig: WorkerOptions = {
  taskQueue: 'main-queue',
};

export const workerSchema = z.object({
  WORKFLOWS_PATH: z.string().optional(),
});
