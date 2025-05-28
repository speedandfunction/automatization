import {
  MockActivityEnvironment,
  TestWorkflowEnvironment,
} from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime } from '@temporalio/worker';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { getProjectUnits } from '../activities';
import { Redmine } from '../common/Redmine';
import { fetchFinancialData } from '../activities/weeklyFinancialReports/redmine';

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

  it('fetchFinancialData returns expected mock data for default period', async () => {
    const data = await fetchFinancialData();
    expect(data).toBeDefined();
    expect(data.period).toBe('current');
    expect(data.contractType).toBe('T&M');
    expect(data.revenue).toBe(120000);
  });

  it('fetchFinancialData returns expected mock data for custom period', async () => {
    const data = await fetchFinancialData('previous');
    expect(data).toBeDefined();
    expect(data.period).toBe('previous');
  });
});
