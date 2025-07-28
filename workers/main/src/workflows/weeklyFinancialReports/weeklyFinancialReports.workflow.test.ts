import * as workflowModule from '@temporalio/workflow';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors';
import { GroupNameEnum } from '../../configs/weeklyFinancialReport';
import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

vi.mock('@temporalio/workflow', () => {
  const getTargetUnitsMock = vi.fn();
  const fetchFinancialAppDataMock = vi.fn();
  const fetchQBODataMock = vi.fn();
  const sendReportToSlackMock = vi.fn();

  return {
    proxyActivities: () => ({
      getTargetUnits: getTargetUnitsMock,
      fetchFinancialAppData: fetchFinancialAppDataMock,
      fetchQBOData: fetchQBODataMock,
      sendReportToSlack: sendReportToSlackMock,
    }),
    __getTargetUnitsMock: () => getTargetUnitsMock,
    __getFetchFinancialAppDataMock: () => fetchFinancialAppDataMock,
    __getFetchQBODataMock: () => fetchQBODataMock,
    __getSendReportToSlackMock: () => sendReportToSlackMock,
  };
});

describe('weeklyFinancialReportsWorkflow', () => {
  type WorkflowModuleWithMock = typeof workflowModule & {
    __getTargetUnitsMock: () => ReturnType<typeof vi.fn>;
    __getFetchFinancialAppDataMock: () => ReturnType<typeof vi.fn>;
    __getFetchQBODataMock: () => ReturnType<typeof vi.fn>;
    __getSendReportToSlackMock: () => ReturnType<typeof vi.fn>;
  };
  const getTargetUnitsMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getTargetUnitsMock();
  const fetchFinancialAppDataMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getFetchFinancialAppDataMock();
  const fetchQBODataMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getFetchQBODataMock();
  const sendReportToSlackMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getSendReportToSlackMock();

  beforeEach(() => {
    getTargetUnitsMock.mockReset();
    fetchFinancialAppDataMock.mockReset();
    fetchQBODataMock.mockReset();
    sendReportToSlackMock.mockReset();
  });

  it('throws AppError for invalid group name', async () => {
    const allowedValues = Object.values(GroupNameEnum).join('", "');
    const expectedMessage = `Invalid groupName parameter: INVALID_GROUP. Allowed values: "${allowedValues}"`;

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

  it('propagates error from fetchFinancialAppData', async () => {
    getTargetUnitsMock.mockResolvedValueOnce({ fileLink: 'file.json' });
    fetchFinancialAppDataMock.mockRejectedValueOnce(new Error('fetch error'));
    await expect(
      weeklyFinancialReportsWorkflow(GroupNameEnum.SD_REPORT),
    ).rejects.toThrow('fetch error');
  });

  it('returns fileLink on success', async () => {
    getTargetUnitsMock.mockResolvedValueOnce({ fileLink: 'file.json' });
    fetchFinancialAppDataMock.mockResolvedValueOnce({
      fileLink: 'result.json',
    });
    fetchQBODataMock.mockResolvedValueOnce({
      fileLink: 'qbo-result.json',
    });
    sendReportToSlackMock.mockResolvedValueOnce('slack-link.json');
    const result = await weeklyFinancialReportsWorkflow(
      GroupNameEnum.SD_REPORT,
    );

    expect(result).toBe('testQBO');
    expect(getTargetUnitsMock).toHaveBeenCalledWith(GroupNameEnum.SD_REPORT);
    expect(fetchFinancialAppDataMock).toHaveBeenCalledWith('file.json');
    expect(fetchQBODataMock).toHaveBeenCalledWith('result.json');
  });
});
