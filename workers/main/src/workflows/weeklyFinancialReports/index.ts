import { proxyActivities } from '@temporalio/workflow';

import type * as activities from '../../activities/weeklyFinancialReports';

const { getProjectUnits, fetchFinancialData } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 minutes',
});

export const weeklyFinancialReportsWorkflow = async (): Promise<string> => {
  try {
    const reportTitle = 'Weekly Financial Report';
    const projectUnits = await getProjectUnits();

    const data = await fetchFinancialData();
    const report = `Period: ${reportTitle}
Contract Type: ${data.contractType}
Revenue: $${data.revenue.toLocaleString()}
COGS: $${data.cogs.toLocaleString()}
Margin: $${data.margin.toLocaleString()}
Marginality: ${data.marginality}%\n\nEffective Revenue (last 4 months): $${data.effectiveRevenue.toLocaleString()}
Effective Margin: $${data.effectiveMargin.toLocaleString()}
Effective Marginality: ${data.effectiveMarginality}%`;

    return `${report}\n${JSON.stringify(projectUnits, null, 2)}`;
  } catch (error) {
    console.error('Weekly Financial Reports', error);
    throw error;
  }
};
