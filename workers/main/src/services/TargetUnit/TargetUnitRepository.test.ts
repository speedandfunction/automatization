import { Pool } from 'mysql2/promise';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { TargetUnitRepositoryError } from '../../common/errors';
import { GroupName, TargetUnit } from '../../common/types';
import { TargetUnitRepository } from './TargetUnitRepository';
import { TargetUnitRow } from './types';

const groupName: GroupName = 'SD Weekly Financial Report';

describe('TargetUnitRepository', () => {
  let mockPool: { query: Mock };
  let repo: TargetUnitRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repo = new TargetUnitRepository(mockPool as unknown as Pool);
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
    const result = await repo.getTargetUnits(groupName);

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
    await expect(repo.getTargetUnits(groupName)).rejects.toThrow(
      TargetUnitRepositoryError,
    );
  });

  it('throws TargetUnitRepositoryError on query error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db error'));
    await expect(repo.getTargetUnits(groupName)).rejects.toThrowError(
      'db error',
    );
  });
});
