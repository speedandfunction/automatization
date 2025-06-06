import { beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { AppError } from '../../common/errors';
import { writeJsonFile } from '../../common/fileUtils';
import { RedminePool } from '../../common/RedminePool';
import { getTargetUnits } from './getTargetUnits';

// Mocks
vi.mock('../../common/RedminePool', () => {
  return {
    RedminePool: vi.fn().mockImplementation(() => ({
      getPool: vi.fn(() => 'mockPool'),
      endPool: vi.fn(),
    })),
  };
});

vi.mock('../../services/TargetUnit/TargetUnitRepository', () => {
  return {
    TargetUnitRepository: vi.fn(),
  };
});

vi.mock('../../common/fileUtils', () => ({
  writeJsonFile: vi.fn(),
}));

vi.mock('../../configs/redmineDatabase', () => ({
  redmineDatabaseConfig: {},
}));

describe('getTargetUnits', () => {
  const mockUnits = [
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
  ];
  const mockFile =
    'data/weeklyFinancialReportsWorkflow/getTargetUnits/target-units-123.json';
  let dateSpy: ReturnType<typeof vi.spyOn>;
  let writeJsonFileMock: any;
  let RedminePoolMock: any;
  let TargetUnitRepository: Mock;

  beforeAll(async () => {
    ({ TargetUnitRepository } = await vi.importMock('../../services/TargetUnit/TargetUnitRepository'));
  });

  beforeEach(() => {
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(123);
    writeJsonFileMock = writeJsonFile as unknown as {
      mockClear: () => void;
      mockResolvedValue: (...args: any[]) => void;
      mockRejectedValue: (...args: any[]) => void;
    };
    RedminePoolMock = RedminePool as unknown as {
      mockClear: () => void;
      mockImplementation: (...args: any[]) => void;
    };
    RedminePoolMock.mockClear();
    writeJsonFileMock.mockClear();
    TargetUnitRepository.mockClear();
  });

  it('returns fileLink on success', async () => {
    TargetUnitRepository.mockImplementation(() => ({
      getTargetUnits: vi.fn().mockResolvedValue(mockUnits),
    }));
    writeJsonFileMock.mockResolvedValue(undefined);

    const result = await getTargetUnits();
    expect(result).toEqual({ fileLink: mockFile });
    expect(writeJsonFile).toHaveBeenCalledWith(mockFile, mockUnits);
  });

  it('throws AppError if repo.getTargetUnits throws', async () => {
    TargetUnitRepository.mockImplementation(() => ({
      getTargetUnits: vi.fn().mockRejectedValue(new Error('fail-get')),
    }));
    writeJsonFileMock.mockResolvedValue(undefined);

    await expect(getTargetUnits()).rejects.toThrow(AppError);
    await expect(getTargetUnits()).rejects.toThrow(
      'Failed to get Target Units',
    );
  });

  it('throws AppError if writeJsonFile throws', async () => {
    TargetUnitRepository.mockImplementation(() => ({
      getTargetUnits: vi.fn().mockResolvedValue(mockUnits),
    }));
    writeJsonFileMock.mockRejectedValue(new Error('fail-write'));

    await expect(getTargetUnits()).rejects.toThrow(AppError);
    await expect(getTargetUnits()).rejects.toThrow(
      'Failed to get Target Units',
    );
  });

  it('always ends the pool', async () => {
    const endPool = vi.fn();

    RedminePoolMock = RedminePool as unknown as {
      mockImplementation: (...args: any[]) => void;
    };
    RedminePoolMock.mockImplementation(() => ({
      getPool: vi.fn(() => 'mockPool'),
      endPool,
    }));
    TargetUnitRepository.mockImplementation(() => ({
      getTargetUnits: vi.fn().mockResolvedValue(mockUnits),
    }));
    writeJsonFileMock.mockResolvedValue(undefined);

    await getTargetUnits();
    expect(endPool).toHaveBeenCalled();
  });
});
