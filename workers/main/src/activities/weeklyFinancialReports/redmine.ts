import { Redmine } from '../../common/Redmine';
import type { ProjectUnit } from '../../common/types';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import type { FinancialData } from './redmine.types';

const redmine = new Redmine(redmineDatabaseConfig);

export const getProjectUnits = async (): Promise<ProjectUnit[]> => {
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
