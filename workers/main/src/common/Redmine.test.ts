import {
  MockActivityEnvironment,
  TestWorkflowEnvironment,
} from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime } from '@temporalio/worker';
import * as mysql from 'mysql2/promise';
import type { Mock } from 'vitest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { getProjectUnits } from '../activities';
import { RedmineRepository } from './Redmine';
import { RedminePool } from './RedminePool';
import { ProjectUnit } from './types';

const mockProjectUnits: ProjectUnit[] = [
  {
    group_id: 1,
    group_name: 'Engineering',
    project_id: 101,
    project_name: 'Project Alpha',
  },
  {
    group_id: 2,
    group_name: 'QA',
    project_id: 102,
    project_name: 'Project Beta',
  },
];

vi.mock('mysql2/promise', async () => {
  const actual =
    await vi.importActual<typeof import('mysql2/promise')>('mysql2/promise');

  return {
    ...actual,
    createPool: vi.fn(() => ({ end: vi.fn() })),
  };
});

describe('Redmine Activities', () => {
  let testEnv: TestWorkflowEnvironment;
  let activityContext: MockActivityEnvironment;

  beforeAll(async () => {
    Runtime.install({
      logger: new DefaultLogger('WARN', (entry: LogEntry) =>
        // eslint-disable-next-line no-console
        console.log(`[${entry.level}]`, entry.message),
      ),
    });

    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
    activityContext = new MockActivityEnvironment();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('getProjectUnits returns project units from Redmine', async () => {
    vi.spyOn(RedmineRepository.prototype, 'getProjectUnits').mockResolvedValue(
      mockProjectUnits,
    );

    const result = await activityContext.run(getProjectUnits);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(mockProjectUnits.length);
    expect(result).toEqual(mockProjectUnits);
  });

  it('getProjectUnits handles errors gracefully', async () => {
    const errorMessage = 'Database connection failed';
    const mockError = new Error(errorMessage);

    const mockGetProjectUnits = vi
      .spyOn(RedmineRepository.prototype, 'getProjectUnits')
      .mockRejectedValue(mockError);

    await expect(activityContext.run(getProjectUnits)).rejects.toThrow(
      errorMessage,
    );

    expect(mockGetProjectUnits).toHaveBeenCalledTimes(1);
  });
});

describe('RedmineRepository.getProjectUnitsQuery (private method)', () => {
  const dummyCredentials = {
    host: 'localhost',
    user: 'test',
    database: 'test',
    password: 'test',
  };
  const redminePool = new RedminePool(dummyCredentials);
  const redmineRepo = new RedmineRepository(redminePool);

  // Helper to access private method
  function callGetProjectUnitsQuery() {
    // @ts-expect-error: Accessing private method for test purposes
    return redmineRepo.getProjectUnitsQuery();
  }

  it('returns correct query string', () => {
    const query = callGetProjectUnitsQuery();

    expect(typeof query).toBe('string');
    expect(query).toContain('SELECT');
    expect(query).toContain('FROM users AS g');
    expect(query).toContain('JOIN members AS m ON m.user_id = g.id');
    expect(query).toContain('JOIN projects AS p ON p.id = m.project_id');
  });
});

describe('RedmineRepository class internals', () => {
  const credentials = {
    host: 'localhost',
    user: 'test',
    database: 'test',
    password: 'test',
  };
  let redminePool: RedminePool;

  beforeEach(async () => {
    redminePool = new RedminePool(credentials);
  });

  it('should initialize pool in RedminePool constructor', () => {
    const testCredentials = {
      host: 'localhost',
      user: 'test',
      database: 'test',
      password: 'test',
    };
    const testRedminePool = new RedminePool(testCredentials);

    expect(mysql.createPool as Mock).toHaveBeenCalledWith(testCredentials);
    expect(testRedminePool['pool']).toBeDefined();
  });

  it('should re-initialize pool if poolEnded is true', () => {
    const oldPool = redminePool['pool'];

    redminePool['poolEnded'] = true;
    redminePool['getPool']();
    expect(redminePool['pool']).not.toBe(oldPool);
    expect(redminePool['poolEnded']).toBe(false);
  });

  it('should re-initialize pool if pool is undefined', () => {
    // Reset the mock to clear previous calls
    (mysql.createPool as Mock).mockClear();
    Object.defineProperty(redminePool, 'pool', {
      value: undefined,
      writable: true,
    });
    redminePool['poolEnded'] = false;
    redminePool['getPool']();
    expect(mysql.createPool as Mock).toHaveBeenCalledWith(credentials);
    expect(redminePool['pool']).toBeDefined();
    expect(redminePool['poolEnded']).toBe(false);
  });

  it('should end the pool and set poolEnded to true', async () => {
    const endSpy = vi
      .spyOn(redminePool['pool'], 'end')
      .mockResolvedValue(undefined);

    await redminePool.endPool();
    expect(endSpy).toHaveBeenCalled();
    expect(redminePool['poolEnded']).toBe(true);
  });

  it('should not call end if pool is already ended', async () => {
    redminePool['poolEnded'] = true;
    const endSpy = vi.spyOn(redminePool['pool'], 'end');

    await redminePool.endPool();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should return the pool instance from getPool', () => {
    expect(redminePool.getPool()).toBe(redminePool['pool']);
  });
});
