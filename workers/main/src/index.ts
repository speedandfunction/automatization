import { Worker, NativeConnection } from '@temporalio/worker';
import * as path from 'path';
import { readdirSync } from 'fs';
import { Connection, ScheduleClient } from '@temporalio/client';

const workflowsPath = path.join(__dirname, 'workflows');
const activitiesPath = path.join(__dirname, 'activities');

// Dynamically import all workflows
const workflowModules = readdirSync(workflowsPath)
  .filter((f: string) => f.endsWith('.ts') || f.endsWith('.js'))
  .map((f: string) => require(path.join(workflowsPath, f)));

// Dynamically import all activities
const activityModules = readdirSync(activitiesPath)
  .filter((f: string) => f.endsWith('.ts') || f.endsWith('.js'))
  .map((f: string) => require(path.join(activitiesPath, f)));

const activities = Object.assign({}, ...activityModules);

const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';

async function createScheduleIfNotExists(connection: Connection) {
  const scheduleClient = new ScheduleClient({ connection });
  try {
    await scheduleClient.getHandle('example-workflow-hourly').describe();
    console.log('Schedule already exists');
  } catch (err: any) {
    if (err?.message?.includes('workflow not found')) {
      console.log('Create Schedule example-workflow-hourly');
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
      console.log('Schedule created');
    } else {
      throw err;
    }
  }
}

async function run() {
  const connection = await Connection.connect({ address });

  await createScheduleIfNotExists(connection);

  await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'main-queue',
  }).then(worker => worker.run());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 