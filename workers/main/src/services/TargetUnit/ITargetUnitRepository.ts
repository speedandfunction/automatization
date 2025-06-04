import { ProjectUnit } from '../../common/types';

export interface ITargetUnitRepository {
  getProjectUnits(): Promise<ProjectUnit[]>;
}
