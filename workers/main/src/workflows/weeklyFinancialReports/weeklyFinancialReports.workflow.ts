import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getTargetUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const targetUnits = await getTargetUnits();

  return targetUnits.fileLink;
}
