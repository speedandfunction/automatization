import { getRateByDate } from '../../common/formatUtils';
import type { TargetUnit } from '../../common/types';
import type { Employee, Project } from '../FinApp';
import { getContractTypeByDate } from '../FinApp/FinAppUtils';
import { EffectiveMarginalityCalculator } from './MarginalityCalculator';

export class WeeklyFinancialReportCalculations {
  static safeGetRate(
    history: Employee['history'] | undefined,
    date: string,
  ): number {
    if (!history || typeof history !== 'object' || !history.rate) return 0;

    return getRateByDate(history.rate, date) || 0;
  }

  static calculateGroupTotals(
    groupUnits: TargetUnit[],
    employees: Employee[],
    projects: Project[],
  ) {
    let groupTotalCogs = 0;
    let groupTotalRevenue = 0;
    let effectiveRevenue = 0;
    const processedProjects = new Set<number>();

    for (const unit of groupUnits) {
      const employee = employees.find((e) => e.redmine_id === unit.user_id);
      const project = projects.find((p) => p.redmine_id === unit.project_id);
      const date = unit.spent_on;
      const employeeRate = this.safeGetRate(employee?.history, date);
      const projectRate = this.safeGetRate(project?.history, date);

      groupTotalCogs += employeeRate * unit.total_hours;
      groupTotalRevenue += projectRate * (unit.project_hours || 0);

      if (project && !processedProjects.has(project.redmine_id)) {
        effectiveRevenue += project.effectiveRevenue || 0;
        processedProjects.add(project.redmine_id);
      }
    }

    return { groupTotalCogs, groupTotalRevenue, effectiveRevenue };
  }

  static resolveContractType(groupUnits: TargetUnit[], projects: Project[]) {
    const latestDateByProject = new Map<number, string>();
    const projectIdsInGroup = new Set<number>();

    // Track latest date per project
    for (const unit of groupUnits) {
      const project = projects.find((p) => p.redmine_id === unit.project_id);

      if (project) {
        projectIdsInGroup.add(project.redmine_id);
        const prev = latestDateByProject.get(project.redmine_id);

        if (!prev || Date.parse(unit.spent_on) > Date.parse(prev)) {
          latestDateByProject.set(project.redmine_id, unit.spent_on);
        }
      }
    }

    // Resolve contract type
    const contractTypes = new Set<string>();

    for (const projectId of projectIdsInGroup) {
      const project = projects.find((p) => p.redmine_id === projectId);
      const date = latestDateByProject.get(projectId);

      if (project && date) {
        const contractType = getContractTypeByDate(
          project.history?.contractType,
          date,
        );

        if (contractType) contractTypes.add(contractType);
      }
    }

    return contractTypes.size <= 1 ? Array.from(contractTypes)[0] : 'Mixed';
  }

  static calculateEffectiveMarginality(
    effectiveRevenue: number,
    groupTotalCogs: number,
  ) {
    const effectiveMargin = effectiveRevenue - groupTotalCogs;
    const effectiveMarginality =
      effectiveRevenue > 0 ? (effectiveMargin / effectiveRevenue) * 100 : 0;
    const effectiveMarginalityIndicator =
      EffectiveMarginalityCalculator.getIndicator(
        EffectiveMarginalityCalculator.classify(effectiveMarginality),
      );

    return {
      effectiveMargin,
      effectiveMarginality,
      effectiveMarginalityIndicator,
    };
  }
}
