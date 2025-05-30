import type { Pool } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';
import { beforeEach, vi } from 'vitest';

import { RedminePool } from '../../common/RedminePool';
import { ProjectUnitRepository } from '../../repositories/financial/ProjectUnitRepository';
import { FinancialReportService } from '../../services/financial/FinancialReportService';
import {
  createFinancialReportService,
  createProjectUnitRepository,
} from './factory';

vi.mock('../../common/RedminePool');

const mockExecute = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(RedminePool.prototype, 'getPool').mockReturnValue({
    execute: mockExecute,
  } as unknown as Pool);
});

describe('factory', () => {
  it('createProjectUnitRepository returns ProjectUnitRepository instance', () => {
    const repo = createProjectUnitRepository();

    expect(repo).toBeInstanceOf(ProjectUnitRepository);
  });

  it('createFinancialReportService returns FinancialReportService instance', () => {
    const service = createFinancialReportService();

    expect(service).toBeInstanceOf(FinancialReportService);
  });

  it('ProjectUnitRepository instance has getProjectUnits method', () => {
    const repo = createProjectUnitRepository();

    expect(typeof repo.getProjectUnits).toBe('function');
  });

  it('FinancialReportService instance has getWeeklyReport method', () => {
    const service = createFinancialReportService();

    expect(typeof service.getWeeklyReport).toBe('function');
  });
});

describe('factory (behavioral)', () => {
  it('ProjectUnitRepository.getProjectUnits returns project units', async () => {
    const mockRows = [
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ];

    mockExecute.mockResolvedValueOnce([mockRows]);
    const repo = createProjectUnitRepository();
    const result = await repo.getProjectUnits();

    expect(result).toEqual(mockRows);
    expect(mockExecute).toHaveBeenCalled();
  });

  it('ProjectUnitRepository.getProjectUnits returns empty array if no data', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const repo = createProjectUnitRepository();
    const result = await repo.getProjectUnits();

    expect(result).toEqual([]);
  });

  it('ProjectUnitRepository.getProjectUnits throws if db fails', async () => {
    mockExecute.mockRejectedValueOnce(new Error('fail'));
    const repo = createProjectUnitRepository();

    await expect(repo.getProjectUnits()).rejects.toThrow('fail');
  });

  it('FinancialReportService.getWeeklyReport returns project units', async () => {
    const mockRows = [
      { group_id: 1, group_name: 'A', project_id: 2, project_name: 'B' },
    ];

    mockExecute.mockResolvedValueOnce([mockRows]);
    const service = createFinancialReportService();
    const result = await service.getWeeklyReport();

    expect(result).toEqual(mockRows);
  });

  it('FinancialReportService.getWeeklyReport returns empty array if no data', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const service = createFinancialReportService();
    const result = await service.getWeeklyReport();

    expect(result).toEqual([]);
  });

  it('FinancialReportService.getWeeklyReport throws if repo fails', async () => {
    mockExecute.mockRejectedValueOnce(new Error('fail'));
    const service = createFinancialReportService();

    await expect(service.getWeeklyReport()).rejects.toThrow('fail');
  });
});
