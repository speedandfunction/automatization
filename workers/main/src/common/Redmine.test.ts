import {
  MockActivityEnvironment,
  TestWorkflowEnvironment,
} from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime } from '@temporalio/worker';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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
    // Optionally, check key properties of the first item
    expect(result[0]).toHaveProperty('group_id', 1);
    expect(result[0]).toHaveProperty('group_name', 'Engineering');
    expect(result[0]).toHaveProperty('project_id', 101);
    expect(result[0]).toHaveProperty('project_name', 'Project Alpha');
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
