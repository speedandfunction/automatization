import { Client, Connection } from '@temporalio/client';

import { temporalConfig } from './configs/temporal';
import { workerConfig } from './configs/worker';
import { weeklyFinancialReportsWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect(temporalConfig);
  const client = new Client({ connection });

  const handle = await client.workflow.start(weeklyFinancialReportsWorkflow, {
    ...workerConfig,
    workflowId: 'weekly-financial-report-' + Date.now(),
  });

  try {
    await handle.result();
  } catch (err) {
    console.error('Workflow failed:', err);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
