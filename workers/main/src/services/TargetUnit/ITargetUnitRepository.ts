import { TargetUnit } from '../../common/types';

export interface ITargetUnitRepository {
  getTargetUnits(groupName: string): Promise<TargetUnit[]>;
}
