import { Pool } from 'mysql2/promise';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { TargetUnit } from '../../common/types';
import {
  TargetUnitRepository,
  TargetUnitRepositoryError,
} from './TargetUnitRepository';
import { IPoolProvider, TargetUnitRow } from './types';

describe('TargetUnitRepository', () => {
  let mockPool: { query: Mock };
  let mockPoolProvider: IPoolProvider;
  let repo: TargetUnitRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    mockPoolProvider = {
      getPool: () => mockPool as unknown as Pool,
    };
    repo = new TargetUnitRepository(mockPoolProvider);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('maps rows to TargetUnit and returns them', async () => {
    const rows: TargetUnitRow[] = [
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
      } as TargetUnitRow,
    ];

    mockPool.query.mockResolvedValueOnce([rows]);
    const result = await repo.getProjectUnits();

    expect(result).toEqual<Partial<TargetUnit>[]>([
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

  it('throws TargetUnitRepositoryError if query does not return array', async () => {
    mockPool.query.mockResolvedValueOnce([null]);
    await expect(repo.getProjectUnits()).rejects.toThrow(
      TargetUnitRepositoryError,
    );
  });

  it('throws TargetUnitRepositoryError on query error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db error'));
    await expect(repo.getProjectUnits()).rejects.toThrow('db error');
  });
});
