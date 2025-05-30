import { describe, expect, it, vi } from 'vitest';

import { FinancialReportService } from '../../services/financial/FinancialReportService';
import * as factory from './factory';
import { getProjectUnits } from './getProjectUnits.activity';

describe('getProjectUnits activity', () => {
  it('returns weekly report from service', async () => {
    const mockReport = [
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ];

    const mockService: Partial<FinancialReportService> = {
      getWeeklyReport: vi.fn().mockResolvedValue(mockReport),
    };

    vi.spyOn(factory, 'createFinancialReportService').mockReturnValue(
      mockService as FinancialReportService,
    );
    const result = await getProjectUnits();

    expect(result).toEqual(mockReport);
  });

  it('returns empty array if no data', async () => {
    const mockService: Partial<FinancialReportService> = {
      getWeeklyReport: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(factory, 'createFinancialReportService').mockReturnValue(
      mockService as FinancialReportService,
    );
    const result = await getProjectUnits();

    expect(result).toEqual([]);
  });

  it('throws if service fails', async () => {
    const mockService: Partial<FinancialReportService> = {
      getWeeklyReport: vi.fn().mockRejectedValue(new Error('fail')),
    };

    vi.spyOn(factory, 'createFinancialReportService').mockReturnValue(
      mockService as FinancialReportService,
    );
    await expect(getProjectUnits()).rejects.toThrow('fail');
  });
});
