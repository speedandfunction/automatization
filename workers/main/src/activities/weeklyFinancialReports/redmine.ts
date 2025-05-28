import { Redmine } from '../../common/Redmine';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import type { FinancialData, ProjectUnit } from './redmine.types';

export const getProjectUnits = async (): Promise<ProjectUnit[]> => {
  const redmine = new Redmine(redmineDatabaseConfig);

  return redmine.getProjectUnits();
};

export async function fetchFinancialData(
  period: string = 'current',
): Promise<FinancialData> {
  return {
    period: period,
    contractType: 'T&M',
    revenue: 120000,
    cogs: 80000,
    margin: 40000,
    marginality: 33.3,
    effectiveRevenue: 110000,
    effectiveMargin: 35000,
    effectiveMarginality: 31.8,
  };
}
