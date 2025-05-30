import { describe, expect, it, vi } from 'vitest';

import { IProjectUnitRepository } from '../../repositories/financial/IProjectUnitRepository';
import { FinancialReportService } from './FinancialReportService';

describe('FinancialReportService', () => {
  it('returns weekly report from repo', async () => {
    const repo: Partial<IProjectUnitRepository> = {
      getProjectUnits: vi
        .fn()
        .mockResolvedValue([
          { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
        ]),
    };
    const service = new FinancialReportService(repo as IProjectUnitRepository);
    const result = await service.getWeeklyReport();

    expect(result).toEqual([
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ]);
  });

  it('returns empty array if repo returns none', async () => {
    const repo: Partial<IProjectUnitRepository> = {
      getProjectUnits: vi.fn().mockResolvedValue([]),
    };
    const service = new FinancialReportService(repo as IProjectUnitRepository);
    const result = await service.getWeeklyReport();

    expect(result).toEqual([]);
  });

  it('throws if repo fails', async () => {
    const repo: Partial<IProjectUnitRepository> = {
      getProjectUnits: vi.fn().mockRejectedValue(new Error('fail')),
    };
    const service = new FinancialReportService(repo as IProjectUnitRepository);

    await expect(service.getWeeklyReport()).rejects.toThrow('fail');
  });
});
