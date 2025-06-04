import { Pool } from 'mysql2/promise';

import { ProjectUnit } from '../../common/types';
import { IRedmineRepository } from './IRedmineRepository';
import { PROJECT_UNITS_QUERY } from './queries';
import { IPoolProvider, ProjectUnitRow } from './types';

export class RedmineRepositoryError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'RedmineRepositoryError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RedmineRepositoryError);
    }
  }
}

export class RedmineRepository implements IRedmineRepository {
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
    }: ProjectUnitRow,
  ): ProjectUnit {
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

  async getProjectUnits(): Promise<ProjectUnit[]> {
    try {
      const [rows] =
        await this.pool.query<ProjectUnitRow[]>(PROJECT_UNITS_QUERY);

      if (!Array.isArray(rows)) {
        throw new RedmineRepositoryError('Query did not return an array');
      }

      return rows.map(RedmineRepository.mapRowToProjectUnit);
    } catch (error) {
      console.error('RedmineRepository.getProjectUnits error:', error);
      throw new RedmineRepositoryError(
        `RedmineRepository.getProjectUnits failed: ${(error as Error).message}`,
        error,
      );
    }
  }
}
