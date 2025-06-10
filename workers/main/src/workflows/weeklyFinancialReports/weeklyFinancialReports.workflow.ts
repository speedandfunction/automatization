import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';
import { AppError } from '../../common/errors';
import { GroupName } from '../../common/types';
import { GroupNameEnum } from '../../configs/weeklyFinancialReport';

const { getTargetUnits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(
  groupName: GroupName,
): Promise<string> {
  if (!(Object.values(GroupNameEnum) as GroupName[]).includes(groupName)) {
    throw new AppError(
      `Invalid groupName: ${groupName}`,
      'weeklyFinancialReportsWorkflow',
    );
  }
  const targetUnits = await getTargetUnits(groupName);

  return targetUnits.fileLink;
}
