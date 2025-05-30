import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/financial';

const { getProjectUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const reportTitle = 'Weekly Financial Report';
  const projectUnits = await getProjectUnits();

  return `${reportTitle}\n${JSON.stringify(projectUnits, null, 2)}`;
}
