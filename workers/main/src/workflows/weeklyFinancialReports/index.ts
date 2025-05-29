import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';
import { FinancialData } from '../../activities/weeklyFinancialReports';

const { getProjectUnits, fetchFinancialData } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 minutes',
});

export function generateReport(
  reportTitle: string,
  data: FinancialData,
): string {
  return (
    `Period: ${reportTitle}\n` +
    `Contract Type: ${data.contractType}\n` +
    `Revenue: $${data.revenue.toLocaleString()}\n` +
    `COGS: $${data.cogs.toLocaleString()}\n` +
    `Margin: $${data.margin.toLocaleString()}\n` +
    `Marginality: ${data.marginality}%\n` +
    `\n` +
    `Effective Revenue (last 4 months): $${data.effectiveRevenue.toLocaleString()}\n` +
    `Effective Margin: $${data.effectiveMargin.toLocaleString()}\n` +
    `Effective Marginality: ${data.effectiveMarginality}%\n`
  );
}

export async function weeklyFinancialReportsWorkflow(): Promise<string> {
  try {
    const reportTitle = 'Weekly Financial Report';
    const projectUnits = await getProjectUnits();
    const data = await fetchFinancialData();
    const report = generateReport(reportTitle, data);

    return `${report}\n${JSON.stringify(projectUnits, null, 2)}`;
  } catch (error) {
    console.error('Weekly Financial Reports', error);
    throw error;
  }
}
