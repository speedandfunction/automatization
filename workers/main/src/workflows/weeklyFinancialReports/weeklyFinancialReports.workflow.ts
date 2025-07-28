import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';
import { AppError } from '../../common/errors';
import { GroupName } from '../../common/types';
import { GroupNameEnum } from '../../configs/weeklyFinancialReport';

const {
  getTargetUnits,
  fetchFinancialAppData,
  sendReportToSlack,
  fetchQBOData,
  manageQBOTokens,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow(
  groupName: GroupName,
): Promise<string> {
  if (!(Object.values(GroupNameEnum) as GroupName[]).includes(groupName)) {
    throw new AppError(
      `Invalid groupName parameter: ${groupName}. Allowed values: "${Object.values(GroupNameEnum).join('", "')}"`,
      'weeklyFinancialReportsWorkflow',
    );
  }

  const targetUnits = await getTargetUnits(groupName);
  const finData = await fetchFinancialAppData(targetUnits.fileLink);
  const tokenResult = await manageQBOTokens();

  if (!tokenResult.success) {
    throw new AppError(
      `Failed to manage QBO tokens: ${tokenResult.message}`,
      'weeklyFinancialReportsWorkflow',
    );
  }

  // Если получили новый refresh token, логируем это
  if (tokenResult.newRefreshToken) {
    console.log('🔄 QBO refresh token updated during workflow execution');
  }

  // Шаг 4: Получаем данные QBO
  const qboData = await fetchQBOData(finData.fileLink);

  console.log('qboData', { qboData });

  if (1 !== 1 + 1) {
    return 'testQBO';
  }

  // Шаг 5: Отправляем отчет
  return await sendReportToSlack(targetUnits.fileLink, finData.fileLink);
}
