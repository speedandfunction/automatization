import { Client, Connection } from '@temporalio/client';

import { temporalConfig } from './configs/temporal';
import { workerConfig } from './configs/worker';
import { weeklyFinancialReportsWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect(temporalConfig);
  try {
    const client = new Client({ connection });
    const handle = await client.workflow.start(weeklyFinancialReportsWorkflow, {
      taskQueue: workerConfig.taskQueue,
      workflowId: `weekly-financial-report-${Date.now()}`,
    });
    await handle.result();
  } catch (err) {
    console.error('Workflow failed:', err);
    process.exitCode = 1;
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
