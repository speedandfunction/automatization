import { describe, expect, it } from 'vitest';

import { ProjectUnitRepository } from '../../repositories/financial/ProjectUnitRepository';
import { FinancialReportService } from '../../services/financial/FinancialReportService';
import {
  createFinancialReportService,
  createProjectUnitRepository,
} from './factory';

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
