import * as mysql from 'mysql2/promise';
import { Pool, PoolOptions } from 'mysql2/promise';

export class RedminePool {
  private pool: Pool | null = null;
  private credentials: PoolOptions;
  private poolEnded = false;

  constructor(credentials: PoolOptions) {
    this.credentials = credentials;
    try {
      this.createPool();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      throw new Error(`RedminePool initialization failed: ${errMsg}`);
    }
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
      try {
        await this.pool.end();
        this.poolEnded = true;
      } catch (error) {
        this.poolEnded = true;
        const errMsg = error instanceof Error ? error.message : String(error);

        throw new Error(`Failed to end MySQL connection pool: ${errMsg}`);
      }
    }
  }
}
