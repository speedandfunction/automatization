import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { formatFinancialReport } from './FinancialReportFormatter';

describe('formatFinancialReport', () => {
  it('should format report with given project units', () => {
    const result = formatFinancialReport([
      {
        group_id: 1,
        group_name: 'Engineering',
        project_id: 101,
        project_name: 'Project Alpha',
      },
    ]);

    expect(result).toContain('Weekly Financial Report');
    expect(result).toContain('Engineering');
    expect(result).toContain('Project Alpha');
  });
});

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    getProjectUnits: vi.fn().mockResolvedValue([
      {
        group_id: 1,
        group_name: 'Engineering',
        project_id: 101,
        project_name: 'Project Alpha',
      },
    ]),
  }),
}));

import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

describe('weeklyFinancialReportsWorkflow', () => {
  it('should return formatted report from workflow', async () => {
    const result = await weeklyFinancialReportsWorkflow();

    expect(result).toContain('Weekly Financial Report');
    expect(result).toContain('Engineering');
    expect(result).toContain('Project Alpha');
  });
});
