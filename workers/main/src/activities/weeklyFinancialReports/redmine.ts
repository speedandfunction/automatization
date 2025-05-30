import { RedminePool } from '../../common/RedminePool';
import { redmineDatabaseConfig } from '../../configs/redmineDatabase';
import { RedmineRepository } from '../../services/redmine/RedmineRepository';
import { RedmineService } from '../../services/redmine/RedmineService';

const repo = new RedmineRepository(new RedminePool(redmineDatabaseConfig));
const service = new RedmineService(repo);

export const getProjectUnits = async () => service.getProjectUnits();
