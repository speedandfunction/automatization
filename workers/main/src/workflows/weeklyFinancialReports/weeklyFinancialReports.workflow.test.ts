import { describe, expect, it, vi } from 'vitest';

import { GroupNameEnum } from '../../configs/weeklyFinancialReport';
import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    getTargetUnits: vi
      .fn()
      .mockResolvedValue({ fileLink: 'sub-dir/mocked-link.json' }),
  }),
}));

describe('weeklyFinancialReportsWorkflow', () => {
  it('returns the fileLink from getTargetUnits', async () => {
    const result = await weeklyFinancialReportsWorkflow(
      GroupNameEnum.ED_REPORT,
    );

    expect(result).toBe('sub-dir/mocked-link.json');
  });
});
