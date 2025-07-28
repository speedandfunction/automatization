import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getTargetUnits, fetchFinancialAppData, sendReportToSlack } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 minutes',
  });

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const targetUnits = await getTargetUnits();
  const finData = await fetchFinancialAppData(targetUnits.fileLink);

  return await sendReportToSlack(targetUnits.fileLink, finData.fileLink);
}
