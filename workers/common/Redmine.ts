import * as mysql from 'mysql2/promise';
import { PoolOptions, Pool, RowDataPacket } from 'mysql2/promise';

export interface ProjectUnit {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
}

export class Redmine {
  private pool: Pool;
  private credentials: PoolOptions;

  constructor(credentials: PoolOptions) {
    this.credentials = credentials;
    this.pool = mysql.createPool(this.credentials);
  }

  private ensureConnection() {
    if (!this?.pool) this.pool = mysql.createPool(this.credentials);
  }

  /**
   * Fetches groups (optionally filtered by name or id) with their associated projects from Redmine DB.
   * Only groups with at least one project membership are returned.
   * Uses a persistent connection pool.
   *
   * @param {Object} [options] - Optional filter options
   * @param {string} [options.groupName] - Group name to filter by
   * @param {number} [options.groupId] - Group id to filter by
   * @returns {Promise<ProjectUnit[]>} Array of group-project associations
   */
  async getProjectUnits(options?: { unitName?: string; unitId?: number }): Promise<ProjectUnit[]> {
    this.ensureConnection();

    let whereClause = "g.type = 'Group'";
    const params: (string | number)[] = [];

    if (options?.unitId) {
      whereClause += ' AND g.id = ?';
      params.push(options.unitId);
    } else if (options?.unitName) {
      whereClause += ' AND g.lastname = ?';
      params.push(options.unitName);
    }

    const query = `SELECT
         g.id AS group_id,
         g.lastname AS group_name,
         p.id AS project_id,
         p.name AS project_name
       FROM users AS g
       JOIN members AS m ON m.user_id = g.id
       JOIN projects AS p ON p.id = m.project_id
       WHERE ${whereClause}`;

    console.log(query);
    console.log(params);

    

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    return rows as ProjectUnit[];
  }

  /** Expose the Pool Connection */
  get connection() {
    return this.pool;
  }
}