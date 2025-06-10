import { GroupName, TargetUnit } from '../../common/types';

export interface ITargetUnitRepository {
  getTargetUnits(groupName: GroupName): Promise<TargetUnit[]>;
}
