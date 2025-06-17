import { TargetUnit } from '../../common/types';
import { Employee, Project } from '../FinApp';

export interface GenerateReportInput {
  targetUnits: TargetUnit[];
  employees: Employee[];
  projects: Project[];
}

export interface IWeeklyFinancialReportRepository {
  generateReport(
    params: GenerateReportInput,
  ): Promise<{ summary: string; details: string }>;
}

export interface AggregateGroupDataInput {
  groupUnits: TargetUnit[];
  employees: Employee[];
  projects: Project[];
}
