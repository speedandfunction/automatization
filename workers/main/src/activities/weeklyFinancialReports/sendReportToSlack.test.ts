import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { AppError } from '../../common/errors';
import { readJsonFile } from '../../common/fileUtils';
import { TargetUnit } from '../../common/types';
import { FinancialsAppData } from '../../services/FinApp';
import { SlackService } from '../../services/SlackService';
import { WeeklyFinancialReportRepository } from '../../services/WeeklyFinancialReport';
import { sendReportToSlack } from './sendReportToSlack';

vi.mock('../../common/fileUtils', () => ({
  readJsonFile: vi.fn(),
}));
vi.mock('../../services/WeeklyFinancialReport', () => ({
  WeeklyFinancialReportRepository: vi.fn(),
}));
vi.mock('../../services/SlackService', () => ({
  SlackService: vi.fn(),
}));

const mockTargetUnits: TargetUnit[] = [
  {
    group_id: 1,
    group_name: 'Group',
    project_id: 2,
    project_name: 'Project',
    user_id: 3,
    username: 'User',
    spent_on: '2024-06-01',
    total_hours: 8,
  },
];
const mockFinancialsAppData: FinancialsAppData = {
  employees: [{ redmine_id: 3, history: { rate: { '2024-06-01': 100 } } }],
  projects: [
    {
      name: 'Test Project',
      redmine_id: 2,
      history: { rate: { '2024-06-01': 200 } },
    },
  ],
};

describe('sendReportToSlack', () => {
  let readJsonFileMock: Mock;
  let generateReportMock: Mock;
  let postMessageMock: Mock;

  function tryMockReset(obj: unknown) {
    if (
      typeof obj === 'function' &&
      'mockReset' in obj &&
      typeof (obj as { mockReset: unknown }).mockReset === 'function'
    ) {
      (obj as { mockReset: () => void }).mockReset();
    }
  }

  beforeEach(() => {
    readJsonFileMock = vi.mocked(readJsonFile);
    generateReportMock = vi.fn();
    postMessageMock = vi.fn();

    tryMockReset(WeeklyFinancialReportRepository);
    tryMockReset(SlackService);
  });

  it('sends report to Slack and returns success message', async () => {
    readJsonFileMock
      .mockResolvedValueOnce(mockTargetUnits)
      .mockResolvedValueOnce(mockFinancialsAppData);
    generateReportMock.mockReturnValue({
      details: 'details',
      summary: 'summary',
    });
    (WeeklyFinancialReportRepository as unknown as Mock).mockImplementation(
      () => ({
        generateReport: generateReportMock,
      }),
    );
    postMessageMock
      .mockResolvedValueOnce({ ts: '123' })
      .mockResolvedValueOnce({});
    (SlackService as unknown as Mock).mockImplementation(() => ({
      postMessage: postMessageMock,
    }));

    const result = await sendReportToSlack('target.json', 'finapp.json');

    expect(result).toBe('Report sent to Slack');
    expect(readJsonFileMock).toHaveBeenCalledTimes(2);
    expect(generateReportMock).toHaveBeenCalled();
    expect(postMessageMock).toHaveBeenCalledTimes(2);
    expect(postMessageMock).toHaveBeenCalledWith('summary');
    expect(postMessageMock).toHaveBeenCalledWith('details', '123');
  });

  it('throws AppError if readJsonFile fails', async () => {
    readJsonFileMock.mockRejectedValueOnce(new Error('fail'));
    await expect(
      sendReportToSlack('target.json', 'finapp.json'),
    ).rejects.toThrow(AppError);
    await expect(
      sendReportToSlack('target.json', 'finapp.json'),
    ).rejects.toThrow('Failed to send report to Slack');
  });

  it('throws AppError if generateReport fails', async () => {
    readJsonFileMock
      .mockResolvedValueOnce(mockTargetUnits)
      .mockResolvedValueOnce(mockFinancialsAppData);
    generateReportMock.mockRejectedValueOnce(new Error('fail-gen'));
    (WeeklyFinancialReportRepository as unknown as Mock).mockImplementation(
      () => ({
        generateReport: generateReportMock,
      }),
    );
    (SlackService as unknown as Mock).mockImplementation(() => ({
      postMessage: postMessageMock,
    }));
    await expect(
      sendReportToSlack('target.json', 'finapp.json'),
    ).rejects.toThrow(AppError);
  });

  it('throws AppError if postMessage fails', async () => {
    readJsonFileMock
      .mockResolvedValueOnce(mockTargetUnits)
      .mockResolvedValueOnce(mockFinancialsAppData);
    generateReportMock.mockReturnValue({
      details: 'details',
      summary: 'summary',
    });
    (WeeklyFinancialReportRepository as unknown as Mock).mockImplementation(
      () => ({
        generateReport: generateReportMock,
      }),
    );
    postMessageMock.mockRejectedValueOnce(new Error('fail-post'));
    (SlackService as unknown as Mock).mockImplementation(() => ({
      postMessage: postMessageMock,
    }));
    await expect(
      sendReportToSlack('target.json', 'finapp.json'),
    ).rejects.toThrow(AppError);
  });
});
