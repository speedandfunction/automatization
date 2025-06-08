import type { Connection } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AppError } from '../../common/errors';
import * as fileUtils from '../../common/fileUtils';
import * as mongoPoolModule from '../../common/MongoPool';
import type { TargetUnit } from '../../common/types';
import type { Employee, Project } from '../../services/FinApp';
import type { IFinAppRepository } from '../../services/FinApp';
import * as finAppService from '../../services/FinApp';
import { getFinAppData } from './getFinAppData';

// --- MongoPoolMock type for test mocks ---
type MongoPoolMock = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  getConnection: () => unknown;
  connection: null;
  uri: string;
};

// Mock dependencies
vi.mock('../../common/fileUtils', () => ({
  readJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
}));
vi.mock('../../common/MongoPool', () => ({
  MongoPool: {
    getInstance: vi.fn(),
  },
}));
vi.mock('../../services/FinApp', () => ({
  FinAppRepository: vi.fn(),
}));

// --- Mock Data ---
const mockTargetUnits: TargetUnit[] = [
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
const mockEmployees: Employee[] = [
  { redmine_id: 3, history: { rate: { '2024-01-01': 100 } } },
];
const mockProjects: Project[] = [
  {
    redmine_id: 2,
    quick_books_id: 10,
    history: { rate: { '2024-01-01': 200 } },
  },
];

// --- Helper Functions ---
function createRepoInstance(
  overrides: Partial<IFinAppRepository> = {},
): IFinAppRepository {
  return {
    getEmployees: vi.fn().mockResolvedValue(mockEmployees),
    getProjects: vi.fn().mockResolvedValue(mockProjects),
    ...overrides,
  };
}

function createMongoPoolInstance(
  connectImpl?: () => Promise<Connection>,
  disconnectImpl?: () => Promise<void>,
): MongoPoolMock {
  return {
    connect: connectImpl || vi.fn().mockResolvedValue({} as Connection),
    disconnect: disconnectImpl || vi.fn().mockResolvedValue(undefined),
    getConnection: vi.fn(),
    connection: null,
    uri: '',
  };
}

// --- Test Suite ---
describe('getFinAppData', () => {
  let readJsonFile: Mock;
  let writeJsonFile: Mock;
  let connect: Mock;
  let disconnect: Mock;
  let FinAppRepository: Mock;
  let dateSpy: ReturnType<typeof vi.spyOn>;
  let repoInstance: IFinAppRepository;
  let mongoPoolInstance: MongoPoolMock;

  const fileLink = 'input.json';
  const expectedFilename =
    'data/weeklyFinancialReportsWorkflow/getFinAppData/data-123.json';

  // Helper to set up mocks for a successful run
  function setupSuccessMocks() {
    readJsonFile.mockResolvedValue(mockTargetUnits);
    writeJsonFile.mockResolvedValue(undefined);
    (repoInstance.getEmployees as Mock).mockResolvedValue(mockEmployees);
    (repoInstance.getProjects as Mock).mockResolvedValue(mockProjects);
  }

  // Helper for error tests
  async function expectAppError(promise: Promise<unknown>, msg: string) {
    await expect(promise).rejects.toThrow(AppError);
    await expect(promise).rejects.toThrow(msg);
    expect(() => mongoPoolInstance.disconnect()).not.toThrow();
  }

  beforeEach(() => {
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(123);
    readJsonFile = vi.mocked(fileUtils.readJsonFile);
    writeJsonFile = vi.mocked(fileUtils.writeJsonFile);
    FinAppRepository = vi.mocked(finAppService.FinAppRepository);

    repoInstance = createRepoInstance();
    FinAppRepository.mockImplementation(() => repoInstance);

    connect = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
    mongoPoolInstance = createMongoPoolInstance(connect, disconnect);
    (mongoPoolModule.MongoPool.getInstance as Mock).mockReturnValue(
      mongoPoolInstance as unknown as mongoPoolModule.MongoPool,
    );
  });

  afterEach(() => {
    dateSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('success cases', () => {
    it('returns fileLink when successful', async () => {
      setupSuccessMocks();
      const result = await getFinAppData(fileLink);

      expect(result).toEqual({ fileLink: expectedFilename });
      expect(() => mongoPoolInstance.connect()).not.toThrow();
      expect(() => mongoPoolInstance.disconnect()).not.toThrow();
      expect(readJsonFile).toHaveBeenCalledWith(fileLink);
      expect(writeJsonFile).toHaveBeenCalledWith(expectedFilename, {
        employees: mockEmployees,
        projects: mockProjects,
      });
    });

    it('always disconnects the mongo pool', async () => {
      setupSuccessMocks();
      await getFinAppData(fileLink).catch(() => {});
      expect(() => mongoPoolInstance.disconnect()).not.toThrow();
    });
  });

  describe('error cases', () => {
    it('throws AppError when readJsonFile throws', async () => {
      readJsonFile.mockRejectedValue(new Error('fail-read'));
      await expectAppError(
        getFinAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when getEmployees throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      (repoInstance.getEmployees as Mock).mockRejectedValue(
        new Error('fail-employees'),
      );
      await expectAppError(
        getFinAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when getProjects throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      (repoInstance.getProjects as Mock).mockRejectedValue(
        new Error('fail-projects'),
      );
      await expectAppError(
        getFinAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when writeJsonFile throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      writeJsonFile.mockRejectedValue(new Error('fail-write'));
      await expectAppError(
        getFinAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });
  });
});
