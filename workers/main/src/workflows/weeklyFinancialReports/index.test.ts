import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker';
import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { FinancialData, ProjectUnit } from '../../activities';
import { weeklyFinancialReportsWorkflow } from '..';
import { generateReport } from './index';

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

const mockFinancialData: FinancialData = {
  period: 'current',
  contractType: 'T&M',
  revenue: 120000,
  cogs: 80000,
  margin: 40000,
  marginality: 33.3,
  effectiveRevenue: 110000,
  effectiveMargin: 35000,
  effectiveMarginality: 31.8,
};

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
      fetchFinancialData: async () => mockFinancialData,
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
    expect(result).toContain('Revenue: $120,000');
    expect(result).toContain('COGS: $80,000');
    expect(result).toContain('Margin: $40,000');
    expect(result).toContain('Marginality: 33.3%');
    expect(result).toContain('Effective Revenue (last 4 months): $110,000');
    expect(result).toContain('Effective Margin: $35,000');
    expect(result).toContain('Effective Marginality: 31.8%');
  });
});

describe('generateReport', () => {
  it('formats the report string as expected', () => {
    const reportTitle = 'Test Report';
    const report = generateReport(reportTitle, mockFinancialData);

    expect(report).toContain('Period: Test Report');
    expect(report).toContain('Contract Type: T&M');
    expect(report).toContain('Revenue: $120,000');
    expect(report).toContain('COGS: $80,000');
    expect(report).toContain('Margin: $40,000');
    expect(report).toContain('Marginality: 33.3%');
    expect(report).toContain('Effective Revenue (last 4 months): $110,000');
    expect(report).toContain('Effective Margin: $35,000');
    expect(report).toContain('Effective Marginality: 31.8%');
  });
});
