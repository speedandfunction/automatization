import { Pool } from 'mysql2/promise';

import { RedminePool } from '../../common/RedminePool';
import { ProjectUnit } from '../../common/types';
import { IRedmineRepository } from './IRedmineRepository';

export class RedmineRepository implements IRedmineRepository {
  private pool: Pool;

  constructor(redminePool: RedminePool) {
    this.pool = redminePool.getPool();
  }

  private getProjectUnitsQuery() {
    return `SELECT
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
  }

  async getProjectUnits(): Promise<ProjectUnit[]> {
    const query = this.getProjectUnitsQuery();
    const [rows] = await this.pool.execute(query);

    return rows as ProjectUnit[];
  }
}
