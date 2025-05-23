import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getProjectUnits, fetchFinancialData } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 minutes',
});

export async function weeklyFinancialReportsWorkflow({
  period = 'current',
}: { period?: string } = {}): Promise<string> {
  try {
    const reportTitle = 'Weekly Financial Report';
    const projectUnits = await getProjectUnits();

    const data = await fetchFinancialData(period);
    const report = `Period: ${data.period}
Contract Type: ${data.contractType}
Revenue: $${data.revenue.toLocaleString()}
COGS: $${data.cogs.toLocaleString()}
Margin: $${data.margin.toLocaleString()}
Marginality: ${data.marginality}%\n\nEffective Revenue (last 4 months): $${data.effectiveRevenue.toLocaleString()}
Effective Margin: $${data.effectiveMargin.toLocaleString()}
Effective Marginality: ${data.effectiveMarginality}%`;

    console.log(JSON.stringify(projectUnits, null, 2));

    // return `${reportTitle}\n${report}`;
    return JSON.stringify(projectUnits, null, 2);
  } catch (error) {
    console.error('Weekly Financial Reports', error);
    throw error;
  }
}
