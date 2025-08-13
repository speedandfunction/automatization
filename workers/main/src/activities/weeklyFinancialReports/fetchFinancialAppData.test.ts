import type { Connection } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AppError } from '../../common/errors';
import * as fileUtils from '../../common/fileUtils';
import * as mongoPoolModule from '../../common/MongoPool';
import type { TargetUnit } from '../../common/types';
import type {
  Employee,
  IFinAppRepository,
  Project,
} from '../../services/FinApp';
import * as finAppService from '../../services/FinApp';
import type { CustomerRevenueByRef } from '../../services/QBO';
import * as qboService from '../../services/QBO';
import { fetchFinancialAppData } from './fetchFinancialAppData';

type MongoPoolMock = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  getConnection: () => unknown;
  connection: null;
  uri: string;
};

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
vi.mock('../../services/QBO', () => ({
  QBORepository: vi.fn(),
}));

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
    name: 'Test Project',
    redmine_id: 2,
    quick_books_id: 10,
    history: { rate: { '2024-01-01': 200 } },
  },
];

const mockEffectiveRevenue: CustomerRevenueByRef = {
  '10': {
    customerName: 'Test Customer',
    totalAmount: 5000,
    invoiceCount: 3,
  },
};

function createRepoInstance(
  overrides: Partial<IFinAppRepository> = {},
): IFinAppRepository {
  return {
    getEmployeesByRedmineIds: vi.fn().mockResolvedValue(mockEmployees),
    getProjectsByRedmineIds: vi.fn().mockResolvedValue(mockProjects),
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

describe('getFinAppData', () => {
  let readJsonFile: Mock;
  let writeJsonFile: Mock;
  let connect: Mock;
  let disconnect: Mock;
  let FinAppRepository: Mock;
  let qboRepository: Mock;
  let dateSpy: ReturnType<typeof vi.spyOn>;
  let repoInstance: IFinAppRepository;
  let qboRepoInstance: { getEffectiveRevenue: Mock };
  let mongoPoolInstance: MongoPoolMock;

  const fileLink = 'input.json';
  const expectedFilename =
    'data/weeklyFinancialReportsWorkflow/getFinAppData/data-123.json';

  function setupSuccessMocks() {
    readJsonFile.mockResolvedValue(mockTargetUnits);
    writeJsonFile.mockResolvedValue(undefined);
    (repoInstance.getEmployeesByRedmineIds as Mock).mockResolvedValue(
      mockEmployees,
    );
    (repoInstance.getProjectsByRedmineIds as Mock).mockResolvedValue(
      mockProjects,
    );
    qboRepoInstance.getEffectiveRevenue.mockResolvedValue(mockEffectiveRevenue);
  }

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
    qboRepository = vi.mocked(qboService.QBORepository);

    repoInstance = createRepoInstance();
    FinAppRepository.mockImplementation(() => repoInstance);

    qboRepoInstance = {
      getEffectiveRevenue: vi.fn().mockResolvedValue(mockEffectiveRevenue),
    };
    qboRepository.mockImplementation(() => qboRepoInstance);

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
      const result = await fetchFinancialAppData(fileLink);

      expect(result).toEqual({ fileLink: expectedFilename });
      expect(() => mongoPoolInstance.connect()).not.toThrow();
      expect(() => mongoPoolInstance.disconnect()).not.toThrow();
      expect(readJsonFile).toHaveBeenCalledWith(fileLink);
      expect(writeJsonFile).toHaveBeenCalledWith(expectedFilename, {
        employees: mockEmployees,
        projects: [
          {
            ...mockProjects[0],
            effectiveRevenue: 5000,
          },
        ],
        effectiveRevenue: mockEffectiveRevenue,
      });
      expect(qboRepository).toHaveBeenCalledTimes(1);
      expect(qboRepoInstance.getEffectiveRevenue).toHaveBeenCalledTimes(1);
    });

    it('always disconnects the mongo pool', async () => {
      setupSuccessMocks();
      await fetchFinancialAppData(fileLink).catch(() => {});
      expect(() => mongoPoolInstance.disconnect()).not.toThrow();
    });
  });

  describe('error cases', () => {
    it('throws AppError when readJsonFile throws', async () => {
      readJsonFile.mockRejectedValue(new Error('fail-read'));
      await expectAppError(
        fetchFinancialAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when getEmployees throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      (repoInstance.getEmployeesByRedmineIds as Mock).mockRejectedValue(
        new Error('fail-employees'),
      );
      await expectAppError(
        fetchFinancialAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when getProjects throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      (repoInstance.getProjectsByRedmineIds as Mock).mockRejectedValue(
        new Error('fail-projects'),
      );
      await expectAppError(
        fetchFinancialAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });

    it('throws AppError when writeJsonFile throws', async () => {
      readJsonFile.mockResolvedValue(mockTargetUnits);
      writeJsonFile.mockRejectedValue(new Error('fail-write'));
      await expectAppError(
        fetchFinancialAppData(fileLink),
        'Failed to get Fin App Data',
      );
    });
  });
});
