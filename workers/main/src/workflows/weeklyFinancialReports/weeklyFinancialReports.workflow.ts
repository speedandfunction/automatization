import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';
import { GroupName } from '../../common/types';

const { getTargetUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(
  groupName: GroupName,
): Promise<string> {
  const targetUnits = await getTargetUnits(groupName);

  return targetUnits.fileLink;
}
