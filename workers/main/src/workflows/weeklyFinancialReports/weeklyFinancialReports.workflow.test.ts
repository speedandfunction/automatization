import { describe, expect, it, vi } from 'vitest';

import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    getTargetUnits: vi
      .fn()
      .mockResolvedValue({ fileLink: 'sub-dir/mocked-link.json' }),
  }),
}));

describe('weeklyFinancialReportsWorkflow', () => {
  it('returns the fileLink from getTargetUnits (default group)', async () => {
    const result = await weeklyFinancialReportsWorkflow();

    expect(result).toBe('sub-dir/mocked-link.json');
  });

  it('returns the fileLink from getTargetUnits (custom group)', async () => {
    const result = await weeklyFinancialReportsWorkflow('Custom Group');

    expect(result).toBe('sub-dir/mocked-link.json');
  });
});
