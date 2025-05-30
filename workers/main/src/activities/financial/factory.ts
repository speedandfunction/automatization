import { ProjectUnitRepository } from '../../repositories/financial/ProjectUnitRepository';
import { FinancialReportService } from '../../services/financial/FinancialReportService';

export function createProjectUnitRepository() {
  return new ProjectUnitRepository();
}

export function createFinancialReportService() {
  return new FinancialReportService(createProjectUnitRepository());
}
