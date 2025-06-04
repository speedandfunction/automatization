import { TargetUnit } from '../../common/types';

export interface ITargetUnitRepository {
  getProjectUnits(): Promise<TargetUnit[]>;
}
