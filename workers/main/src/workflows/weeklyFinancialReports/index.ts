import { logWorkflowError } from '../../../../common/utils';
import { fetchFinancialData } from '../../activities/fetchFinancialData';

export async function weeklyFinancialReportsWorkflow({
  period = 'current',
}: { period?: string } = {}): Promise<string> {
  try {
    const reportTitle = 'Weekly Financial Report';
    const data = await fetchFinancialData(period);
    const report = `Period: ${data.period}
Contract Type: ${data.contractType}
Revenue: $${data.revenue.toLocaleString()}
COGS: $${data.cogs.toLocaleString()}
Margin: $${data.margin.toLocaleString()}
Marginality: ${data.marginality}%\n\nEffective Revenue (last 4 months): $${data.effectiveRevenue.toLocaleString()}
Effective Margin: $${data.effectiveMargin.toLocaleString()}
Effective Marginality: ${data.effectiveMarginality}%`;

    return `${reportTitle}\n${report}`;
  } catch (error) {
    logWorkflowError('Weekly Financial Reports', error);
    throw error;
  }
}
