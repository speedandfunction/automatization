import { ProjectUnit } from '../../common/types';

export interface IProjectUnitRepository {
  getProjectUnits(): Promise<ProjectUnit[]>;
}
