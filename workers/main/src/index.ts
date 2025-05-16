import { Worker, NativeConnection } from '@temporalio/worker';
import * as path from 'path';
import { readdirSync } from 'fs';
import { Connection, ScheduleClient } from '@temporalio/client';
import * as activities from './activities';

const workflowsPath = path.join(__dirname, 'workflows');
const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';

/**
 * Ensures that a schedule with the given ID exists in Temporal. If it does not exist, creates it.
 *
 * @param {Connection} connection - The Temporal connection instance.
 * @returns {Promise<void>} Resolves when the schedule is verified or created.
 */
async function createScheduleIfNotExists(connection: Connection) {
  const scheduleClient = new ScheduleClient({ connection });
  try {
    await scheduleClient.getHandle('example-workflow-hourly').describe();
  } catch (err: any) {
    if (err?.name === 'NotFoundError' || err?.message?.includes('workflow not found')) {
      await scheduleClient.create({
        scheduleId: 'example-workflow-hourly',
        spec: { cronExpressions: ['0 * * * *'] },
        action: {
          type: 'startWorkflow',
          workflowType: 'exampleWorkflow',
          taskQueue: 'main-queue',
          workflowId: 'example-workflow-hourly',
          args: [],
        },
      });
    } else {
      throw err;
    }
  }
}

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
