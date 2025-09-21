import { Pool } from 'mysql2/promise';

import { TargetUnitRepositoryError } from '../../common/errors';
import { TargetUnit } from '../../common/types';
import { ITargetUnitRepository } from './ITargetUnitRepository';
import { TARGET_UNITS_QUERY } from './queries';
import { TargetUnitRow } from './types';

export class TargetUnitRepository implements ITargetUnitRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  private mapRowToTargetUnit({
    group_id,
    group_name,
    project_id,
    project_name,
    user_id,
    username,
    spent_on,
    project_hours,
    total_hours,
  }: TargetUnitRow): TargetUnit {
    // Defensive parsing for numeric values to handle NULL/string values from DB
    const parseNumericValue = (
      value: number | string | undefined | null,
    ): number => {
      if (value === null || value === undefined) return 0;
      const parsed = parseFloat(String(value));

      return isNaN(parsed) ? 0 : parsed;
    };

    return {
      group_id: Number(group_id),
      group_name: String(group_name),
      project_id: Number(project_id),
      project_name: String(project_name),
      user_id: Number(user_id),
      username: String(username),
      spent_on: String(spent_on),
      project_hours: parseNumericValue(project_hours),
      total_hours: parseNumericValue(total_hours),
    };
  }

  async getTargetUnits(): Promise<TargetUnit[]> {
    try {
      const [rows] = await this.pool.query<TargetUnitRow[]>(TARGET_UNITS_QUERY);

      if (!Array.isArray(rows)) {
        throw new TargetUnitRepositoryError('Query did not return an array');
      }

      return rows.map((row) => this.mapRowToTargetUnit(row));
    } catch (error) {
      throw new TargetUnitRepositoryError(
        `TargetUnitRepository.getTargetUnits failed: ${(error as Error).message}`,
      );
    }
  }
}
