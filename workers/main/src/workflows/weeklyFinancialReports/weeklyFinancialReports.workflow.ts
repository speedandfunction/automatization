import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';
import { defaultGroupName } from './const';

const { getTargetUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(
  groupName: string = defaultGroupName,
): Promise<string> {
  const targetUnits = await getTargetUnits(groupName);

  return targetUnits.fileLink;
}
