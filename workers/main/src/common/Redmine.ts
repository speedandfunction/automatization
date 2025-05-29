import * as mysql from 'mysql2/promise';
import { Pool, PoolOptions, RowDataPacket } from 'mysql2/promise';

import { ProjectUnit } from './types';

export class Redmine {
  private pool: Pool;
  private credentials: PoolOptions;
  private poolEnded = false;

  constructor(credentials: PoolOptions) {
    this.credentials = credentials;
    this.pool = mysql.createPool(this.credentials);
  }

  private ensureConnection() {
    if (!this.pool || this.poolEnded) {
      this.pool = mysql.createPool(this.credentials);
      this.poolEnded = false;
    }
  }

  /** Call this when you want to end the pool */
  async endPool() {
    if (this.pool && !this.poolEnded) {
      await this.pool.end();
      this.poolEnded = true;
    }
  }

  private getProjectUnitsQuery(options?: {
    unitName?: string;
    unitId?: number;
  }): { query: string; params: (string | number)[] } {
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

    return { query, params };
  }

  async getProjectUnits(options?: {
    unitName?: string;
    unitId?: number;
  }): Promise<ProjectUnit[]> {
    this.ensureConnection();

    const { query, params } = this.getProjectUnitsQuery(options);
    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);

    return rows as ProjectUnit[];
  }

  /** Expose the Pool Connection */
  get connection() {
    return this.pool;
  }
}
