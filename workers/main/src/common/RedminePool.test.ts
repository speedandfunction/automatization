import type { PoolOptions } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RedminePool } from './RedminePool';

vi.mock('mysql2/promise', () => {
  const poolMock = {
    end: vi.fn().mockResolvedValue(undefined),
  };

  return {
    createPool: vi.fn(() => poolMock),
    Pool: class {},
  };
});

interface PoolMock {
  end: Mock;
}

describe('RedminePool', () => {
  const credentials: PoolOptions = {
    host: 'localhost',
    user: 'root',
    database: 'test',
  };
  let poolInstance: RedminePool;
  let poolMock: PoolMock;

  beforeEach(() => {
    poolInstance = new RedminePool(credentials);
    poolMock = (mysql.createPool as unknown as Mock).mock.results[0]
      .value as PoolMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a pool on construction', () => {
    expect(mysql.createPool).toHaveBeenCalledWith(credentials);
    expect(poolInstance.getPool()).toBe(poolMock);
  });

  it('should recreate the pool if pool is null', () => {
    (poolInstance as unknown as { pool: PoolMock | null }).pool = null;
    const pool = poolInstance.getPool();

    expect(mysql.createPool).toHaveBeenCalledTimes(2);
    expect(pool).toBe(poolMock);
  });

  it('should recreate the pool if poolEnded is true', () => {
    (poolInstance as unknown as { poolEnded: boolean }).poolEnded = true;
    const pool = poolInstance.getPool();

    expect(mysql.createPool).toHaveBeenCalledTimes(2);
    expect(pool).toBe(poolMock);
  });

  it('should end the pool and set poolEnded to true', async () => {
    await poolInstance.endPool();
    expect(poolMock.end).toHaveBeenCalled();
    expect((poolInstance as unknown as { poolEnded: boolean }).poolEnded).toBe(
      true,
    );
  });

  it('should not end the pool if already ended', async () => {
    (poolInstance as unknown as { poolEnded: boolean }).poolEnded = true;
    await poolInstance.endPool();
    expect(poolMock.end).not.toHaveBeenCalled();
  });

  it('should handle pool creation errors gracefully', () => {
    (mysql.createPool as Mock).mockImplementationOnce(() => {
      throw new Error('Connection failed');
    });
    expect(() => new RedminePool(credentials)).toThrow('Connection failed');
  });

  it('should handle pool.end() errors gracefully', async () => {
    poolMock.end.mockRejectedValueOnce(new Error('End failed'));
    await expect(poolInstance.endPool()).rejects.toThrow('End failed');
    expect((poolInstance as unknown as { poolEnded: boolean }).poolEnded).toBe(
      true,
    );
  });
});
