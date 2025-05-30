import type { Pool } from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RedminePool } from '../../common/RedminePool';
import { ProjectUnit } from '../../common/types';
import { ProjectUnitRepository } from './ProjectUnitRepository';

vi.mock('../../common/RedminePool');

const mockExecute = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(RedminePool.prototype, 'getPool').mockReturnValue({
    execute: mockExecute,
  } as unknown as Pool);
});

describe('ProjectUnitRepository', () => {
  it('returns project units from db', async () => {
    const mockRows: ProjectUnit[] = [
      {
        group_id: 1,
        group_name: 'Group',
        project_id: 2,
        project_name: 'Project',
      },
    ];

    mockExecute.mockResolvedValueOnce([mockRows]);
    const repo = new ProjectUnitRepository();
    const result = await repo.getProjectUnits();

    expect(result).toEqual(mockRows);
    expect(mockExecute).toHaveBeenCalled();
  });

  it('returns empty array if no data', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const repo = new ProjectUnitRepository();
    const result = await repo.getProjectUnits();

    expect(result).toEqual([]);
  });

  it('throws if db fails', async () => {
    mockExecute.mockRejectedValueOnce(new Error('fail'));
    const repo = new ProjectUnitRepository();

    await expect(repo.getProjectUnits()).rejects.toThrow('fail');
  });
});
