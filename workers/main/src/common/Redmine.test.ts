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
import { Redmine } from './Redmine';
import { ProjectUnit } from './types';

// Mock data
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
    vi.spyOn(Redmine.prototype, 'getProjectUnits').mockResolvedValue(
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
      .spyOn(Redmine.prototype, 'getProjectUnits')
      .mockRejectedValue(mockError);

    await expect(activityContext.run(getProjectUnits)).rejects.toThrow(
      errorMessage,
    );

    expect(mockGetProjectUnits).toHaveBeenCalledTimes(1);
  });
});

describe('Redmine.getProjectUnitsQuery (private method)', () => {
  const dummyCredentials = {
    host: 'localhost',
    user: 'test',
    database: 'test',
    password: 'test',
  };
  const redmine = new Redmine(dummyCredentials);

  // Helper to access private method
  function callGetProjectUnitsQuery(options?: {
    unitName?: string;
    unitId?: number;
  }) {
    // @ts-expect-error: Accessing private method for test purposes
    return redmine.getProjectUnitsQuery(options);
  }

  it('returns correct query and params with no options', () => {
    const { query, params } = callGetProjectUnitsQuery();

    expect(query).toContain("g.type = 'Group'");
    expect(params).toEqual([]);
  });

  it('returns correct query and params with unitId', () => {
    const { query, params } = callGetProjectUnitsQuery({ unitId: 42 });

    expect(query).toContain('g.id = ?');
    expect(params).toEqual([42]);
  });

  it('returns correct query and params with unitName', () => {
    const { query, params } = callGetProjectUnitsQuery({ unitName: 'QA' });

    expect(query).toContain('g.lastname = ?');
    expect(params).toEqual(['QA']);
  });
});

describe('Redmine class internals', () => {
  const credentials = {
    host: 'localhost',
    user: 'test',
    database: 'test',
    password: 'test',
  };
  let redmine: Redmine;

  beforeEach(async () => {
    redmine = new Redmine(credentials);
  });

  it('should initialize pool in constructor', () => {
    const testCredentials = {
      host: 'localhost',
      user: 'test',
      database: 'test',
      password: 'test',
    };
    const testRedmine = new Redmine(testCredentials);

    expect(mysql.createPool as Mock).toHaveBeenCalledWith(testCredentials);
    expect(testRedmine['pool']).toBeDefined();
  });

  it('should re-initialize pool if poolEnded is true', () => {
    const oldPool = redmine['pool'];

    redmine['poolEnded'] = true;
    redmine['ensureConnection']();
    expect(redmine['pool']).not.toBe(oldPool);
    expect(redmine['poolEnded']).toBe(false);
  });

  it('should re-initialize pool if pool is undefined', () => {
    Object.defineProperty(redmine, 'pool', {
      value: undefined,
      writable: true,
    });
    redmine['poolEnded'] = false;
    redmine['ensureConnection']();
    expect(redmine['pool']).toBeDefined();
    expect(redmine['poolEnded']).toBe(false);
  });

  it('should end the pool and set poolEnded to true', async () => {
    const endSpy = vi
      .spyOn(redmine['pool'], 'end')
      .mockResolvedValue(undefined);

    await redmine.endPool();
    expect(endSpy).toHaveBeenCalled();
    expect(redmine['poolEnded']).toBe(true);
  });

  it('should not call end if pool is already ended', async () => {
    redmine['poolEnded'] = true;
    const endSpy = vi.spyOn(redmine['pool'], 'end');

    await redmine.endPool();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should return the pool instance from connection getter', () => {
    expect(redmine.connection).toBe(redmine['pool']);
  });
});
