import { ProjectUnit } from '../../common/types';
import { ITargetUnitRepository } from './ITargetUnitRepository';

export class TargetUnitService {
  constructor(private repo: ITargetUnitRepository) {}

  async getProjectUnits(): Promise<ProjectUnit[]> {
    return this.repo.getProjectUnits();
  }
}
