import { describe, expect, it, vi } from 'vitest';

import { GroupName } from '../../common/types';
import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

const groupName: GroupName = 'SD Weekly Financial Report';

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    getTargetUnits: vi
      .fn()
      .mockResolvedValue({ fileLink: 'sub-dir/mocked-link.json' }),
  }),
}));

describe('weeklyFinancialReportsWorkflow', () => {
  it('returns the fileLink from getTargetUnits (default group)', async () => {
    const result = await weeklyFinancialReportsWorkflow(groupName);

    expect(result).toBe('sub-dir/mocked-link.json');
  });
});
