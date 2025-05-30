import * as mysql from 'mysql2/promise';
import { Pool, PoolOptions } from 'mysql2/promise';

export class RedminePool {
  private pool: Pool | null = null;
  private credentials: PoolOptions;
  private poolEnded = false;

  constructor(credentials: PoolOptions) {
    this.credentials = credentials;
    this.createPool();
  }

  private createPool() {
    this.pool = mysql.createPool(this.credentials);
    this.poolEnded = false;
  }

  public getPool(): Pool {
    if (!this.pool || this.poolEnded) {
      this.createPool();
    }

    return this.pool!;
  }

  async endPool() {
    if (this.pool && !this.poolEnded) {
      await this.pool.end();
      this.poolEnded = true;
    }
  }
}
