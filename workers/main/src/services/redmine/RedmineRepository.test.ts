import { Pool } from 'mysql2/promise';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ProjectUnit } from '../../common/types';
import { RedmineRepository, RedmineRepositoryError } from './RedmineRepository';
import { IPoolProvider, ProjectUnitRow } from './types';

describe('RedmineRepository', () => {
  let mockPool: { query: Mock };
  let mockPoolProvider: IPoolProvider;
  let repo: RedmineRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    mockPoolProvider = {
      getPool: () => mockPool as unknown as Pool,
    };
    repo = new RedmineRepository(mockPoolProvider);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('maps rows to ProjectUnit and returns them', async () => {
    const rows: ProjectUnitRow[] = [
      {
        group_id: 1,
        group_name: 'Group',
        project_id: 2,
        project_name: 'Project',
        user_id: 3,
        username: 'User',
        spent_on: '2024-06-01',
        total_hours: 8,
        constructor: { name: 'RowDataPacket' },
      } as ProjectUnitRow,
    ];

    mockPool.query.mockResolvedValueOnce([rows]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual<Partial<ProjectUnit>[]>([
      {
        group_id: 1,
        group_name: 'Group',
        project_id: 2,
        project_name: 'Project',
        user_id: 3,
        username: 'User',
        spent_on: '2024-06-01',
        total_hours: 8,
      },
    ]);
  });

  it('throws RedmineRepositoryError if query does not return array', async () => {
    mockPool.query.mockResolvedValueOnce([null]);
    await expect(repo.getProjectUnits()).rejects.toThrow(
      RedmineRepositoryError,
    );
  });

  it('throws RedmineRepositoryError on query error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db error'));
    await expect(repo.getProjectUnits()).rejects.toThrow('db error');
  });
});
