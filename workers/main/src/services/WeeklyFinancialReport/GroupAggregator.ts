import type { TargetUnit } from '../../common/types';

export class GroupAggregator {
  static aggregateGroup(targetUnits: TargetUnit[], targetUnitId: number) {
    const groupUnits = targetUnits.filter(
      (targetUnit) => targetUnit.group_id === targetUnitId,
    );
    const groupTotalHours = groupUnits.reduce(
      (sum, unit) => sum + unit.total_hours,
      0,
    );

    return { groupUnits, groupTotalHours };
  }
}
