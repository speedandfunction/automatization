import { TargetUnit } from '../../common/types';

export interface ITargetUnitRepository {
  getTargetUnits(): Promise<TargetUnit[]>;
}
