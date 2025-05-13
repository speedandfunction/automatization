import { Worker } from '@temporalio/worker';
import * as path from 'path';
import { readdirSync } from 'fs';
import { Connection } from '@temporalio/client';

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

async function run() {
  const connection = await Connection.connect({ address });

  await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'your-task-queue',
    connection,
  }).then(worker => worker.run());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 