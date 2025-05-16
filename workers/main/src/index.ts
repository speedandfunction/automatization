import { Worker, NativeConnection } from '@temporalio/worker';
import * as path from 'path';
import { readdirSync } from 'fs';
import { Connection, ScheduleClient } from '@temporalio/client';

const workflowsPath = path.join(__dirname, 'workflows');
const activitiesPath = path.join(__dirname, 'activities');

const activityModules = readdirSync(activitiesPath)
  .filter((f: string) => f.endsWith('.ts') || f.endsWith('.js') && !f.endsWith('.test.ts') && !f.endsWith('.test.js'))
  .map((f: string) => require(path.join(activitiesPath, f)));

const activities = Object.assign({}, ...activityModules);

const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';

/**
 * Entry point for the Temporal worker service.
 *
 * Loads workflow and activity modules, connects to the Temporal server, ensures a schedule exists,
 * and starts the worker to process workflows and activities from the task queue.
 */

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
