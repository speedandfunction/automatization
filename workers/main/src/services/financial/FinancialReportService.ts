import { IProjectUnitRepository } from '../../repositories/financial/IProjectUnitRepository';

export class FinancialReportService {
  constructor(private repo: IProjectUnitRepository) {}
  async getWeeklyReport(): Promise<ProjectUnit[]> {
    return this.repo.getProjectUnits();
  }
}
