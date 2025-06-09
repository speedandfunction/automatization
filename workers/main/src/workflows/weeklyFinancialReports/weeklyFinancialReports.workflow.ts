import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getTargetUnits, fetchFinancialAppData } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const targetUnits = await getTargetUnits();
  const finData = await fetchFinancialAppData(targetUnits.fileLink);

  return finData.fileLink;
}
