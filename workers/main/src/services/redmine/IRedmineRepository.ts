import { ProjectUnit } from '../../common/types';

export interface IRedmineRepository {
  getProjectUnits(): Promise<ProjectUnit[]>;
}
