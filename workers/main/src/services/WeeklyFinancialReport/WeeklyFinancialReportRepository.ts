import { formatCurrency, getRateByDate } from '../../common/formatUtils';
import {
  GenerateReportInput,
  IWeeklyFinancialReportRepository,
} from './IWeeklyFinancialReportRepository';

function composeWeeklyReportTitle(currentDate: Date): string {
  const periodStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - ((currentDate.getDay() + 6) % 7) - 7,
  )
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - ((currentDate.getDay() + 6) % 7) - 1,
  )
    .toISOString()
    .slice(0, 10);

  return `*Weekly Financial Summary for Target Units* (${periodStart} - ${periodEnd})`;
}

export class WeeklyFinancialReportRepository
  implements IWeeklyFinancialReportRepository
{
  async generateReport({
    targetUnits,
    employees,
    projects,
  }: GenerateReportInput) {
    const currentDate = new Date();
    const reportTitle = composeWeeklyReportTitle(currentDate);

    const processedGroupIds = new Set<number>();
    let reportDetails = ``;
    let totalReportedHours = 0;
    const currentQuarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;

    const highMarginalityGroups: string[] = [];
    const mediumMarginalityGroups: string[] = [];
    const lowMarginalityGroups: string[] = [];

    for (const targetUnit of targetUnits) {
      if (!processedGroupIds.has(targetUnit.group_id)) {
        processedGroupIds.add(targetUnit.group_id);
        const groupUnits = targetUnits.filter(
          (unit) => unit.group_id === targetUnit.group_id,
        );
        const groupTotalHours = groupUnits.reduce(
          (sum, unit) => sum + unit.total_hours,
          0,
        );

        let groupTotalCogs = 0;
        let groupTotalRevenue = 0;

        for (const unit of groupUnits) {
          const employee = employees.find((e) => e.redmine_id === unit.user_id);
          const project = projects.find(
            (p) => p.redmine_id === unit.project_id,
          );
          const date = unit.spent_on;
          const employeeRate =
            getRateByDate(employee?.history?.rate, date) || 0;
          const projectRate = getRateByDate(project?.history?.rate, date) || 0;

          groupTotalCogs += employeeRate * unit.total_hours;
          groupTotalRevenue += projectRate * unit.total_hours;
        }

        const groupMarginAmount = groupTotalRevenue - groupTotalCogs;
        const groupMarginalityPercent =
          groupTotalRevenue > 0
            ? (groupMarginAmount / groupTotalRevenue) * 100
            : 0;

        let marginalityIndicator = '';

        if (groupMarginalityPercent >= 55) {
          marginalityIndicator = ':arrowup:';
          highMarginalityGroups.push(targetUnit.group_name);
        } else if (groupMarginalityPercent >= 45) {
          marginalityIndicator = ':large_yellow_circle:';
          mediumMarginalityGroups.push(targetUnit.group_name);
        } else {
          marginalityIndicator = ':arrowdown:';
          lowMarginalityGroups.push(targetUnit.group_name);
        }

        reportDetails += `${marginalityIndicator} *${targetUnit.group_name}* (${groupTotalHours}h)\n`;
        reportDetails += `*Period*: ${currentQuarter}\n`;
        reportDetails += `*Revenue*: ${formatCurrency(groupTotalRevenue)}\n`;
        reportDetails += `*COGS*: ${formatCurrency(groupTotalCogs)}\n`;
        reportDetails += `*Margin*: ${formatCurrency(groupMarginAmount)}\n`;
        reportDetails += `*Marginality*: ${groupMarginalityPercent.toFixed(0)}%\n\n`;
        totalReportedHours += groupTotalHours;
      }
    }
    reportDetails += '\n*Total hours*: ' + totalReportedHours + 'h\n\n';
    reportDetails += '*Notes:*\n';
    reportDetails += '1. *Contract Type* is not implemented\n';
    reportDetails += '2. *Effective Revenue* is not implemented\n';
    reportDetails += '3. *Dept Tech* hours are not implemented\n\n';
    reportDetails +=
      '*Legend*: Marginality :arrowup: ≥55%   :large_yellow_circle: 45-54%  :arrowdown: <45%';

    let reportSummary = `${reportTitle}\n`;

    reportSummary += '________________________________\n';
    reportSummary += ':arrowup: *Marginality is 55% or higher*:\n';
    if (highMarginalityGroups.length) {
      reportSummary += highMarginalityGroups.join('\n') + '\n';
    }
    reportSummary += '__________________________________\n';
    reportSummary +=
      ' :large_yellow_circle:  *Marginality is between 45-55%*:\n';
    if (mediumMarginalityGroups.length) {
      reportSummary += mediumMarginalityGroups.join('\n') + '\n';
    }
    reportSummary += '__________________________________\n';
    reportSummary += ':arrowdown: *Marginality is under 45%*:\n';
    if (lowMarginalityGroups.length) {
      reportSummary += lowMarginalityGroups.join('\n') + '\n';
    }
    reportSummary += ' -------------------------------------------\n';
    reportSummary += 'The specific figures will be available in the thread';

    return {
      details: reportDetails,
      summary: reportSummary,
    };
  }
}
