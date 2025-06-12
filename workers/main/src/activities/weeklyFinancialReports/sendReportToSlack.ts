import { AppError } from '../../common/errors';
import { readJsonFile } from '../../common/fileUtils';
import { TargetUnit } from '../../common/types';
import { FinancialsAppData } from '../../services/FinApp';
import { SlackService } from '../../services/SlackService';
import { WeeklyFinancialReportRepository } from '../../services/WeeklyFinancialReport';

export const sendReportToSlack = async (
  targetUnitsFileLink: string,
  financialAppDataFileLink: string,
): Promise<string> => {
  try {
    const [targetUnits, { employees, projects }] = await Promise.all([
      readJsonFile<TargetUnit[]>(targetUnitsFileLink),
      readJsonFile<FinancialsAppData>(financialAppDataFileLink),
    ]);
    const weeklyFinancialReportRepository =
      new WeeklyFinancialReportRepository();
    const { details, summary } =
      await weeklyFinancialReportRepository.generateReport({
        targetUnits,
        employees,
        projects,
      });
    const slackService = new SlackService();
    const message = await slackService.postMessage(summary);

    await slackService.postMessage(details, message.ts);

    return 'Report sent to Slack';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    throw new AppError('Failed to send report to Slack', message);
  }
};
