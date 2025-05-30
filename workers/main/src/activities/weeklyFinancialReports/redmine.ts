import { RedmineRepository } from '../../common/Redmine';
import { RedminePool } from '../../common/RedminePool';
import type { ProjectUnit } from '../../common/types';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import type { FinancialData } from './redmine.types';

const redminePool = new RedminePool(redmineDatabaseConfig);
const redmineRepo = new RedmineRepository(redminePool);

export const getProjectUnits = async (): Promise<ProjectUnit[]> =>
  redmineRepo.getProjectUnits();

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
