import { TargetUnit } from '../../common/types';
import { ITargetUnitRepository } from './ITargetUnitRepository';

export class TargetUnitService {
  constructor(private repo: ITargetUnitRepository) {}

  async getProjectUnits(): Promise<TargetUnit[]> {
    return this.repo.getProjectUnits();
  }
}
