import * as workflowModule from '@temporalio/workflow';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AppError } from '../../common/errors/AppError';
import { GroupNameEnum } from '../../configs/weeklyFinancialReport';
import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

// Define the type for the mocked getTargetUnits function
interface GetTargetUnitsMock extends Mock {
  mockResolvedValueOnce: (value: { fileLink: string }) => void;
  mockRejectedValueOnce: (error: Error) => void;
  mockReset: () => void;
}

declare module '@temporalio/workflow' {
  export function __getTargetUnitsMock(): GetTargetUnitsMock;
}

vi.mock('@temporalio/workflow', () => {
  const getTargetUnitsMock = vi.fn();

  return {
    proxyActivities: () => ({
      getTargetUnits: getTargetUnitsMock,
    }),
    __getTargetUnitsMock: () => getTargetUnitsMock,
  };
});

describe('weeklyFinancialReportsWorkflow', () => {
  const getTargetUnitsMock = workflowModule.__getTargetUnitsMock();

  beforeEach(() => {
    getTargetUnitsMock.mockReset();
  });

  it.each([[GroupNameEnum.SD_REPORT], [GroupNameEnum.ED_REPORT]])(
    'returns the fileLink from getTargetUnits for group %s',
    async (groupName: GroupNameEnum) => {
      getTargetUnitsMock.mockResolvedValueOnce({
        fileLink: `${groupName}-mocked-link.json`,
      });
      const result = await weeklyFinancialReportsWorkflow(groupName);

      expect(result).toBe(`${groupName}-mocked-link.json`);
    },
  );

  it('throws AppError for invalid group name', async () => {
    await expect(
      weeklyFinancialReportsWorkflow(
        'INVALID_GROUP' as unknown as GroupNameEnum,
      ),
    ).rejects.toThrow(AppError);
    await expect(
      weeklyFinancialReportsWorkflow(
        'INVALID_GROUP' as unknown as GroupNameEnum,
      ),
    ).rejects.toThrow('Invalid groupName: INVALID_GROUP');
  });

  it('propagates error from getTargetUnits', async () => {
    getTargetUnitsMock.mockRejectedValueOnce(new Error('activity error'));
    await expect(
      weeklyFinancialReportsWorkflow(GroupNameEnum.SD_REPORT),
    ).rejects.toThrow('activity error');
  });
});
