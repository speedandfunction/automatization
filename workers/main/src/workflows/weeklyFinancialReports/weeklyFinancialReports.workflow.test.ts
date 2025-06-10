import * as workflowModule from '@temporalio/workflow';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors';
import { GroupNameEnum } from '../../configs/weeklyFinancialReport';
import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

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
  type WorkflowModuleWithMock = typeof workflowModule & {
    __getTargetUnitsMock: () => ReturnType<typeof vi.fn>;
  };
  const getTargetUnitsMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getTargetUnitsMock();

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
    const allowedValues = Object.values(GroupNameEnum).join('", "');
    const expectedMessage = `Invalid groupName paramter: INVALID_GROUP. Allowed values: "${allowedValues}"`;

    await expect(
      weeklyFinancialReportsWorkflow(
        'INVALID_GROUP' as unknown as GroupNameEnum,
      ),
    ).rejects.toThrow(AppError);
    await expect(
      weeklyFinancialReportsWorkflow(
        'INVALID_GROUP' as unknown as GroupNameEnum,
      ),
    ).rejects.toThrow(expectedMessage);
  });

  it('propagates error from getTargetUnits', async () => {
    getTargetUnitsMock.mockRejectedValueOnce(new Error('activity error'));
    await expect(
      weeklyFinancialReportsWorkflow(GroupNameEnum.SD_REPORT),
    ).rejects.toThrow('activity error');
  });
});
