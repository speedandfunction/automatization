import { Pool } from 'mysql2/promise';

import { TargetUnit } from '../../common/types';
import { ITargetUnitRepository } from './ITargetUnitRepository';
import { PROJECT_UNITS_QUERY } from './queries';
import { IPoolProvider, TargetUnitRow } from './types';

export class TargetUnitRepositoryError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'TargetUnitRepositoryError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TargetUnitRepositoryError);
    }
  }
}

export class TargetUnitRepository implements ITargetUnitRepository {
  private readonly pool: Pool;

  constructor(poolProvider: IPoolProvider) {
    this.pool = poolProvider.getPool();
  }

  private static mapRowToProjectUnit(
    this: void,
    {
      group_id,
      group_name,
      project_id,
      project_name,
      user_id,
      username,
      spent_on,
      total_hours,
    }: TargetUnitRow,
  ): TargetUnit {
    return {
      group_id: Number(group_id),
      group_name: String(group_name),
      project_id: Number(project_id),
      project_name: String(project_name),
      user_id: Number(user_id),
      username: String(username),
      spent_on: String(spent_on),
      total_hours: Number(total_hours),
    };
  }

  async getProjectUnits(): Promise<TargetUnit[]> {
    try {
      const [rows] =
        await this.pool.query<TargetUnitRow[]>(PROJECT_UNITS_QUERY);

      if (!Array.isArray(rows)) {
        throw new TargetUnitRepositoryError('Query did not return an array');
      }

      return rows.map(TargetUnitRepository.mapRowToProjectUnit);
    } catch (error) {
      console.error('TargetUnitRepository.getProjectUnits error:', error);
      throw new TargetUnitRepositoryError(
        `TargetUnitRepository.getProjectUnits failed: ${(error as Error).message}`,
        error,
      );
    }
  }
}
