import { Worker, NativeConnection } from '@temporalio/worker';
import * as path from 'path';
import { readdirSync } from 'fs';
import { Connection } from '@temporalio/client';
import * as activities from './activities';
import { createScheduleIfNotExists } from './utils/schedule';

const workflowsPath = path.join(__dirname, 'workflows');
const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';

/**
 * Main function to initialize Temporal connection, ensure schedule, and start the worker.
 *
 * Loads workflow and activity modules, connects to Temporal, ensures the schedule exists,
 * and starts the worker to process jobs from the task queue.
 *
 * @returns {Promise<void>} Resolves when the worker is running.
 */
async function run() {
  const connection = await Connection.connect({ address });

  await createScheduleIfNotExists(connection);

  await Worker.create({
    workflowsPath,
    activities,
    taskQueue: 'main-queue',
  }).then(worker => worker.run());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
