import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getTargetUnits, getFinAppData } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const targetUnits = await getTargetUnits();
  const finData = await getFinAppData(targetUnits.fileLink);

  return finData.fileLink;
}
