import { ProjectUnit } from '../../common/types';

export function formatFinancialReport(units: ProjectUnit[]) {
  const reportTitle = 'Weekly Financial Report';

  return `${reportTitle}\n${JSON.stringify(units, null, 2)}`;
}
