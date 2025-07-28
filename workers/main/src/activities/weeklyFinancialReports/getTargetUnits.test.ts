import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AppError } from '../../common/errors';
import { writeJsonFile } from '../../common/fileUtils';
import { RedminePool } from '../../common/RedminePool';
import { getTargetUnits } from './getTargetUnits';

type TargetUnit = {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  user_id: number;
  username: string;
  spent_on: string;
  total_hours: number;
};

interface TargetUnitRepositoryMock {
  mockClear: () => void;
  mockImplementation: (
    impl: () => { getTargetUnits: () => Promise<TargetUnit[]> },
  ) => void;
}

interface RedminePoolMock {
  mockClear: () => void;
  mockImplementation: (
    impl: () => { getPool: () => string; endPool: () => void },
  ) => void;
}

const defaultUnit: TargetUnit = {
  group_id: 1,
  group_name: 'Group',
  project_id: 2,
  project_name: 'Project',
  user_id: 3,
  username: 'User',
  spent_on: '2024-06-01',
  total_hours: 8,
};

function createMockUnit(overrides: Partial<TargetUnit> = {}): TargetUnit {
  return { ...defaultUnit, ...overrides };
}

async function setupTargetUnitRepositoryMock(): Promise<TargetUnitRepositoryMock> {
  const imported = await vi.importMock(
    '../../services/TargetUnit/TargetUnitRepository',
  );
  const repo = vi.mocked(
    imported.TargetUnitRepository,
  ) as TargetUnitRepositoryMock;

  repo.mockClear();

  return repo;
}

function setupRedminePoolMock(endPool: Mock) {
  (RedminePool as unknown as RedminePoolMock).mockClear();
  (RedminePool as unknown as RedminePoolMock).mockImplementation(() => ({
    getPool: vi.fn(() => 'mockPool'),
    endPool,
  }));
}

vi.mock('../../common/RedminePool', () => ({
  RedminePool: vi.fn().mockImplementation(() => ({
    getPool: vi.fn(() => 'mockPool'),
    endPool: vi.fn(),
  })),
}));
vi.mock('../../services/TargetUnit/TargetUnitRepository', () => ({
  TargetUnitRepository: vi.fn(),
}));
vi.mock('../../common/fileUtils', () => ({
  writeJsonFile: vi.fn(),
}));
vi.mock('../../configs/redmineDatabase', () => ({
  redmineDatabaseConfig: {},
  redmineDatabaseSchema: {},
}));

describe('getTargetUnits', () => {
  const mockUnits: TargetUnit[] = [createMockUnit()];
  const mockFile =
    'data/weeklyFinancialReportsWorkflow/getTargetUnits/target-units-123.json';
  let writeJsonFileMock: Mock;
  let TargetUnitRepository: TargetUnitRepositoryMock;
  let endPool: Mock;
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(123);
    writeJsonFileMock = vi.mocked(writeJsonFile);
    writeJsonFileMock.mockClear();
    TargetUnitRepository = await setupTargetUnitRepositoryMock();
    endPool = vi.fn();
    setupRedminePoolMock(endPool);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  const mockRepo = (success = true) => {
    TargetUnitRepository.mockImplementation(() => ({
      getTargetUnits: success
        ? vi.fn().mockResolvedValue(mockUnits)
        : vi.fn().mockRejectedValue(new Error('fail-get')),
    }));
  };

  it('returns fileLink when successful', async () => {
    mockRepo(true);
    writeJsonFileMock.mockResolvedValue(undefined);
    const result = await getTargetUnits();

    expect(result).toEqual({ fileLink: mockFile });
    expect(writeJsonFile).toHaveBeenCalledWith(mockFile, mockUnits);
  });

  it('throws AppError when repo.getTargetUnits throws', async () => {
    mockRepo(false);
    writeJsonFileMock.mockResolvedValue(undefined);
    await expect(getTargetUnits()).rejects.toThrow(AppError);
    await expect(getTargetUnits()).rejects.toThrow(
      'Failed to get Target Units',
    );
  });

  it('throws AppError when writeJsonFile throws', async () => {
    mockRepo(true);
    writeJsonFileMock.mockRejectedValue(new Error('fail-write'));
    await expect(getTargetUnits()).rejects.toThrow(AppError);
    await expect(getTargetUnits()).rejects.toThrow(
      'Failed to get Target Units',
    );
  });

  it('always ends the Redmine pool', async () => {
    mockRepo(true);
    writeJsonFileMock.mockResolvedValue(undefined);
    await getTargetUnits();
    expect(endPool).toHaveBeenCalled();
  });
});
