import { Pool, RowDataPacket } from 'mysql2/promise';

import { ProjectUnit } from '../../common/types';
import { IRedmineRepository } from './IRedmineRepository';

interface ProjectUnitRow extends RowDataPacket {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  user_id: number;
  username: string;
  spent_on: string;
  total_hours: number;
}

const PROJECT_UNITS_QUERY = `SELECT
  group_id,
  group_name,
  project_id,
  project_name,
  user_id,
  username,
  spent_on,
  SUM(total_hours) AS total_hours
FROM (
  SELECT
    g.id AS group_id,
    g.lastname AS group_name,
    p.id AS project_id,
    p.name AS project_name,
    te.user_id AS user_id,
    CONCAT(u.firstname, ' ', u.lastname) AS username,
    te.spent_on AS spent_on,
    te.hours AS total_hours
  FROM users AS g
  JOIN members AS m ON m.user_id = g.id
  JOIN projects AS p ON p.id = m.project_id
  JOIN time_entries te ON te.project_id = p.id
  JOIN users AS u ON u.id = te.user_id
  WHERE te.spent_on >= CURDATE() - INTERVAL 7 DAY
) t
GROUP BY group_id, group_name, project_id, project_name, user_id, username, spent_on
ORDER BY group_name ASC, project_name ASC, username ASC, spent_on ASC`;

export interface IPoolProvider {
  getPool(): Pool;
}

export class RedmineRepository implements IRedmineRepository {
  private readonly pool: Pool;

  constructor(poolProvider: IPoolProvider) {
    this.pool = poolProvider.getPool();
  }

  async getProjectUnits(): Promise<ProjectUnit[]> {
    try {
      const [rows] =
        await this.pool.query<ProjectUnitRow[]>(PROJECT_UNITS_QUERY);

      if (!Array.isArray(rows)) {
        throw new Error('Query did not return an array');
      }

      return rows.map((row) => ({
        group_id: Number(row.group_id),
        group_name: String(row.group_name),
        project_id: Number(row.project_id),
        project_name: String(row.project_name),
        user_id: Number(row.user_id),
        username: String(row.username),
        spent_on: String(row.spent_on),
        total_hours: Number(row.total_hours),
      }));
    } catch (error) {
      throw new Error(
        `RedmineRepository.getProjectUnits failed: ${(error as Error).message}`,
      );
    }
  }
}
