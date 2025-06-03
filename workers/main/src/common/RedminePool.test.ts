import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedminePool } from './RedminePool';
import type { PoolOptions } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import type { Mock } from 'vitest';

vi.mock('mysql2/promise', () => {
  const poolMock = {
    end: vi.fn().mockResolvedValue(undefined),
  };
  return {
    createPool: vi.fn(() => poolMock),
    Pool: class {},
  };
});

describe('RedminePool', () => {
  const credentials: PoolOptions = { host: 'localhost', user: 'root', database: 'test' };
  let poolInstance: RedminePool;
  let poolMock: any;

  beforeEach(() => {
    poolInstance = new RedminePool(credentials);
    poolMock = (mysql.createPool as unknown as Mock).mock.results[0].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a pool on construction', () => {
    expect(mysql.createPool).toHaveBeenCalledWith(credentials);
    expect(poolInstance.getPool()).toBe(poolMock);
  });

  it('should recreate the pool if pool is null', () => {
    (poolInstance as any).pool = null;
    const pool = poolInstance.getPool();
    expect(mysql.createPool).toHaveBeenCalledTimes(2);
    expect(pool).toBe(poolMock);
  });

  it('should recreate the pool if poolEnded is true', () => {
    (poolInstance as any).poolEnded = true;
    const pool = poolInstance.getPool();
    expect(mysql.createPool).toHaveBeenCalledTimes(2);
    expect(pool).toBe(poolMock);
  });

  it('should end the pool and set poolEnded to true', async () => {
    await poolInstance.endPool();
    expect(poolMock.end).toHaveBeenCalled();
    expect((poolInstance as any).poolEnded).toBe(true);
  });

  it('should not end the pool if already ended', async () => {
    (poolInstance as any).poolEnded = true;
    await poolInstance.endPool();
    expect(poolMock.end).not.toHaveBeenCalled();
  });
});
