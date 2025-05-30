import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker';
import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

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

describe('weeklyFinancialReportsWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    Runtime.install({
      logger: new DefaultLogger('WARN', (entry: LogEntry) =>
        // eslint-disable-next-line no-console
        console.log(`[${entry.level}]`, entry.message),
      ),
    });

    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('generates a report with mocked activities', async () => {
    const { client, nativeConnection } = testEnv;
    const mockActivities = {
      getProjectUnits: async () => mockProjectUnits,
    };

    const taskQueue = `test-${uuidv4()}`;

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('./index.ts'),
      activities: mockActivities,
    });

    const result = await worker.runUntil(
      client.workflow.execute(weeklyFinancialReportsWorkflow, {
        workflowId: uuidv4(),
        taskQueue,
      }),
    );

    expect(result).toContain('Weekly Financial Report');
    expect(result).toContain('Engineering');
    expect(result).toContain('Project Alpha');
  });
});
