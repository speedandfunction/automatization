import type { Pool } from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RedminePool } from '../../common/RedminePool';
import { RedmineRepository } from './RedmineRepository';

// Mock RedminePool and Pool
const mockExecute = vi.fn();
const mockPool: Partial<Pool> = {
  execute: mockExecute,
};

const mockRedminePool: Partial<RedminePool> = {
  getPool: () => mockPool as Pool,
};

describe('RedmineRepository', () => {
  let repo: RedmineRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new RedmineRepository(mockRedminePool as RedminePool);
  });

  it('getProjectUnitsQuery returns correct SQL', () => {
    // @ts-expect-error: access private method for test
    const query = repo.getProjectUnitsQuery();

    expect(query).toContain('SELECT');
    expect(query).toContain('group_id');
    expect(query).toContain('SUM(total_hours) AS total_hours');
    expect(query).toContain('ORDER BY group_name ASC');
  });

  it('getProjectUnits returns rows from pool', async () => {
    const mockRows = [
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ];

    mockExecute.mockResolvedValueOnce([mockRows]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual(mockRows);
    expect(mockExecute).toHaveBeenCalled();
  });

  it('getProjectUnits returns empty array if no rows', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual([]);
  });
});
