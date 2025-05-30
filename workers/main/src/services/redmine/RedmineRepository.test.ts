import type { Pool } from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IPoolProvider, RedmineRepository } from './RedmineRepository';

// Mock Pool and IPoolProvider
const mockQuery = vi.fn();
const mockPool: Partial<Pool> = {
  query: mockQuery,
};

const mockPoolProvider: IPoolProvider = {
  getPool: () => mockPool as Pool,
};

describe('RedmineRepository', () => {
  let repo: RedmineRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new RedmineRepository(mockPoolProvider);
  });

  it('getProjectUnits returns rows from pool', async () => {
    const mockRows = [
      {
        group_id: 1,
        group_name: 'A',
        project_id: 2,
        project_name: 'B',
        user_id: 3,
        username: 'User X',
        spent_on: '2024-06-01',
        total_hours: 5,
      },
    ];

    mockQuery.mockResolvedValueOnce([mockRows]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual([
      {
        group_id: 1,
        group_name: 'A',
        project_id: 2,
        project_name: 'B',
        user_id: 3,
        username: 'User X',
        spent_on: '2024-06-01',
        total_hours: 5,
      },
    ]);
    expect(mockQuery).toHaveBeenCalled();
  });

  it('getProjectUnits returns empty array if no rows', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual([]);
  });

  it('getProjectUnits throws error if query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    await expect(repo.getProjectUnits()).rejects.toThrow(
      'RedmineRepository.getProjectUnits failed: DB error',
    );
  });
});
