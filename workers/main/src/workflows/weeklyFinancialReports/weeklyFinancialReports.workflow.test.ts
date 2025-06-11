import { describe, expect, it, vi } from 'vitest';

import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    getTargetUnits: vi
      .fn()
      .mockResolvedValue({ fileLink: 'sub-dir/mocked-link.json' }),
    fetchFinancialAppData: vi
      .fn()
      .mockResolvedValue({ fileLink: 'sub-dir/mocked-link.json' }),
  }),
}));

describe('weeklyFinancialReportsWorkflow', () => {
  it('returns the fileLink from getTargetUnits', async () => {
    const result = await weeklyFinancialReportsWorkflow();

    expect(result).toBe('sub-dir/mocked-link.json');
  });
});
