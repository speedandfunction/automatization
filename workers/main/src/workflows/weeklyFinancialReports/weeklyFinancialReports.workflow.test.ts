import * as workflowModule from '@temporalio/workflow';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { weeklyFinancialReportsWorkflow } from './weeklyFinancialReports.workflow';

vi.mock('@temporalio/workflow', () => {
  const getTargetUnitsMock = vi.fn();
  const fetchFinancialAppDataMock = vi.fn();
  const sendReportToSlackMock = vi.fn();

  return {
    proxyActivities: () => ({
      getTargetUnits: getTargetUnitsMock,
      fetchFinancialAppData: fetchFinancialAppDataMock,
      sendReportToSlack: sendReportToSlackMock,
    }),
    __getTargetUnitsMock: () => getTargetUnitsMock,
    __getFetchFinancialAppDataMock: () => fetchFinancialAppDataMock,
    __getSendReportToSlackMock: () => sendReportToSlackMock,
  };
});

describe('weeklyFinancialReportsWorkflow', () => {
  type WorkflowModuleWithMock = typeof workflowModule & {
    __getTargetUnitsMock: () => ReturnType<typeof vi.fn>;
    __getFetchFinancialAppDataMock: () => ReturnType<typeof vi.fn>;
    __getSendReportToSlackMock: () => ReturnType<typeof vi.fn>;
  };
  const getTargetUnitsMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getTargetUnitsMock();
  const fetchFinancialAppDataMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getFetchFinancialAppDataMock();
  const sendReportToSlackMock = (
    workflowModule as WorkflowModuleWithMock
  ).__getSendReportToSlackMock();

  beforeEach(() => {
    getTargetUnitsMock.mockReset();
    fetchFinancialAppDataMock.mockReset();
    sendReportToSlackMock.mockReset();
  });

  it('propagates error from getTargetUnits', async () => {
    getTargetUnitsMock.mockRejectedValueOnce(new Error('activity error'));
    await expect(weeklyFinancialReportsWorkflow()).rejects.toThrow(
      'activity error',
    );
  });

  it('propagates error from fetchFinancialAppData', async () => {
    getTargetUnitsMock.mockResolvedValueOnce({ fileLink: 'file.json' });
    fetchFinancialAppDataMock.mockRejectedValueOnce(new Error('fetch error'));
    await expect(weeklyFinancialReportsWorkflow()).rejects.toThrow(
      'fetch error',
    );
  });

  it('returns fileLink on success', async () => {
    getTargetUnitsMock.mockResolvedValueOnce({ fileLink: 'file.json' });
    fetchFinancialAppDataMock.mockResolvedValueOnce({
      fileLink: 'result.json',
    });
    sendReportToSlackMock.mockResolvedValueOnce('slack-link.json');
    const result = await weeklyFinancialReportsWorkflow();

    expect(result).toBe('slack-link.json');
    expect(getTargetUnitsMock).toHaveBeenCalledWith();
    expect(fetchFinancialAppDataMock).toHaveBeenCalledWith('file.json');
    expect(sendReportToSlackMock).toHaveBeenCalledWith(
      'file.json',
      'result.json',
    );
  });
});
