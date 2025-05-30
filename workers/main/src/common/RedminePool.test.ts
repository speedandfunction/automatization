import type { Pool } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RedminePool } from './RedminePool';

const mockPool: Partial<Pool> = {
  end: vi.fn().mockResolvedValue(undefined),
};

// Mock mysql2/promise globally
vi.mock('mysql2/promise', () => ({
  createPool: vi.fn(),
}));

describe('RedminePool', () => {
  const credentials = {
    host: 'localhost',
    user: 'user',
    password: 'pass',
    database: 'db',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates pool on construction', () => {
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    new RedminePool(credentials);
    expect(mysql.createPool).toHaveBeenCalledWith(credentials);
  });

  it('getPool returns the pool', () => {
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    const pool = new RedminePool(credentials);
    expect(pool.getPool()).toBe(mockPool);
  });

  it('endPool ends the pool and sets poolEnded', async () => {
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    const pool = new RedminePool(credentials);
    await pool.endPool();
    expect(mockPool.end).toHaveBeenCalled();
    // После завершения poolEnded = true, getPool создаёт новый пул
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    pool.getPool();
    expect(mysql.createPool).toHaveBeenCalledTimes(2); // первый раз в конструкторе, второй раз после endPool
  });

  it('getPool recreates pool if ended', async () => {
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    const pool = new RedminePool(credentials);
    await pool.endPool();
    (mysql.createPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPool as Pool);
    pool.getPool();
    expect(mysql.createPool).toHaveBeenCalledTimes(2);
  });
});
