import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/financial';
import { formatFinancialReport } from './FinancialReportFormatter';

const { getProjectUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  const projectUnits = await getProjectUnits();

  return formatFinancialReport(projectUnits);
}
