import { RedminePool } from '../../common/RedminePool';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import { RedmineRepository } from '../../services/redmine/RedmineRepository';
import { RedmineService } from '../../services/redmine/RedmineService';

export function createRedmineService() {
  const repo = new RedmineRepository(new RedminePool(redmineDatabaseConfig));

  return new RedmineService(repo);
}

export const getProjectUnits = async (service: RedmineService) =>
  service.getProjectUnits();
