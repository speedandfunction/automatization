import type { ProjectUnit } from '../../common/types';

export interface IRedmineRepository {
  getProjectUnits(): Promise<ProjectUnit[]>;
}
