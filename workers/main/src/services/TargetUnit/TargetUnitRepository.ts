import { Pool } from 'mysql2/promise';

import { TargetUnitRepositoryError } from '../../common/errors';
import { GroupName, TargetUnit } from '../../common/types';
import { ITargetUnitRepository } from './ITargetUnitRepository';
import { TARGET_UNITS_QUERY } from './queries';
import { TargetUnitRow } from './types';

export class TargetUnitRepository implements ITargetUnitRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private static mapRowToTargetUnit = ({
    group_id,
    group_name,
    project_id,
    project_name,
    user_id,
    username,
    spent_on,
    total_hours,
  }: TargetUnitRow): TargetUnit => ({
    group_id: Number(group_id),
    group_name: String(group_name),
    project_id: Number(project_id),
    project_name: String(project_name),
    user_id: Number(user_id),
    username: String(username),
    spent_on: String(spent_on),
    total_hours: Number(total_hours),
  });

  async getTargetUnits(groupName: GroupName): Promise<TargetUnit[]> {
    try {
      const [rows] = await this.pool.query<TargetUnitRow[]>(
        TARGET_UNITS_QUERY,
        [groupName],
      );

      if (!Array.isArray(rows)) {
        throw new TargetUnitRepositoryError('Query did not return an array');
      }

      return rows.map(TargetUnitRepository.mapRowToTargetUnit);
    } catch (error) {
      throw new TargetUnitRepositoryError(
        `TargetUnitRepository.getTargetUnits failed: ${(error as Error).message}`,
      );
    }
  }
}
