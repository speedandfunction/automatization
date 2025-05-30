import { RedmineRepository } from '../../common/Redmine';
import { RedminePool } from '../../common/RedminePool';
import type { ProjectUnit } from '../../common/types';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';

const redminePool = new RedminePool(redmineDatabaseConfig);
const redmineRepo = new RedmineRepository(redminePool);

export const getProjectUnits = async (): Promise<ProjectUnit[]> =>
  redmineRepo.getProjectUnits();
