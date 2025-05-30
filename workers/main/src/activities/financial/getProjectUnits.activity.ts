import { createFinancialReportService } from './factory';

export const getProjectUnits = async () =>
  createFinancialReportService().getWeeklyReport();
