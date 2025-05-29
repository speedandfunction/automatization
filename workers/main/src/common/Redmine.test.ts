import {
  MockActivityEnvironment,
  TestWorkflowEnvironment,
} from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime } from '@temporalio/worker';
import { afterAll, beforeAll, describe, expect, it, vi, afterEach } from 'vitest';

// Mock mysql2/promise before importing Redmine
vi.mock('mysql2/promise', () => {
  return {
    createPool: vi.fn(),
  };
});

import * as mysql from 'mysql2/promise';
import { getProjectUnits } from '../activities';
import { Redmine } from './Redmine';

// Mock data
const mockProjectUnits = [
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

// describe('Redmine Activities', () => {
//   let testEnv: TestWorkflowEnvironment;
//   let activityContext: MockActivityEnvironment;
//
//   beforeAll(async () => {
//     Runtime.install({
//       logger: new DefaultLogger('WARN', (entry: LogEntry) =>
//         // eslint-disable-next-line no-console
//         console.log(`[${entry.level}]`, entry.message),
//       ),
//     });
//
//     testEnv = await TestWorkflowEnvironment.createTimeSkipping();
//     activityContext = new MockActivityEnvironment();
//   });
//
//   afterAll(async () => {
//     await testEnv?.teardown();
//   });
//
//   afterEach(() => {
//     vi.clearAllMocks();
//   });
//
//   it('getProjectUnits returns project units from Redmine', async () => {
//     vi.spyOn(Redmine.prototype, 'getProjectUnits').mockResolvedValue(
//       mockProjectUnits,
//     );
//
//     const result = await activityContext.run(getProjectUnits);
//
//     expect(result).toBeDefined();
//   });
//
//   it('getProjectUnits handles errors gracefully', async () => {
//     const errorMessage = 'Database connection failed';
//     const mockError = new Error(errorMessage);
//
//     const mockGetProjectUnits = vi
//       .spyOn(Redmine.prototype, 'getProjectUnits')
//       .mockRejectedValue(mockError);
//
//     await expect(activityContext.run(getProjectUnits)).rejects.toThrow(
//       errorMessage,
//     );
//
//     expect(mockGetProjectUnits).toHaveBeenCalledTimes(1);
//   });
// });

describe('Redmine internal', () => {
  it('ensureConnection creates pool if missing', () => {
    const credentials = { host: 'localhost', user: 'root', password: '', database: 'test' };
    const createPoolMock = mysql.createPool as unknown as ReturnType<typeof vi.fn>;
    createPoolMock.mockClear();
    createPoolMock.mockReturnValue({} as any);

    const redmine = Object.create(Redmine.prototype) as Redmine;
    (redmine as any).pool = undefined;
    (redmine as any).credentials = credentials;
    (redmine as any).ensureConnection();
    expect(createPoolMock).toHaveBeenCalledWith(credentials);
  });

  it('getProjectUnits returns correct data for different options', async () => {
    const credentials = { host: 'localhost', user: 'root', password: '', database: 'test' };
    const fakeRows = [
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ];
    const fakePool = { execute: vi.fn().mockResolvedValue([fakeRows]) };
    const createPoolMock = mysql.createPool as unknown as ReturnType<typeof vi.fn>;
    createPoolMock.mockClear();
    createPoolMock.mockReturnValue(fakePool);
    const redmine = new Redmine(credentials);

    // No options
    let result = await redmine.getProjectUnits();
    expect(fakePool.execute).toHaveBeenCalled();
    expect(result).toEqual(fakeRows);

    // With unitId
    await redmine.getProjectUnits({ unitId: 123 });
    expect(fakePool.execute).toHaveBeenCalledWith(
      expect.stringContaining('g.id = ?'),
      expect.arrayContaining([123])
    );

    // With unitName
    await redmine.getProjectUnits({ unitName: 'Test' });
    expect(fakePool.execute).toHaveBeenCalledWith(
      expect.stringContaining('g.lastname = ?'),
      expect.arrayContaining(['Test'])
    );
  });

  it('getProjectUnits handles errors gracefully', async () => {
    const credentials = { host: 'localhost', user: 'root', password: '', database: 'test' };
    const fakePool = { execute: vi.fn().mockRejectedValue(new Error('Database connection failed')) };
    const createPoolMock = mysql.createPool as unknown as ReturnType<typeof vi.fn>;
    createPoolMock.mockClear();
    createPoolMock.mockReturnValue(fakePool);
    const redmine = new Redmine(credentials);

    await expect(redmine.getProjectUnits()).rejects.toThrow('Database connection failed');
  });
});
