import { getRateByDate } from '../../common/formatUtils';
import type { TargetUnit } from '../../common/types';
import type { Employee, Project } from '../FinApp';
import { GroupAggregator } from './GroupAggregator';
import {
  AggregateGroupDataInput,
  GenerateReportInput,
  IWeeklyFinancialReportRepository,
} from './IWeeklyFinancialReportRepository';
import {
  MarginalityCalculator,
  MarginalityLevel,
} from './MarginalityCalculator';
import { WeeklyFinancialReportFormatter } from './WeeklyFinancialReportFormatter';

interface ProcessTargetUnitInput {
  targetUnit: TargetUnit;
  targetUnits: TargetUnit[];
  employees: Employee[];
  projects: Project[];
  processedGroupIds: Set<number>;
  currentQuarter: string;
  highMarginalityGroups: string[];
  mediumMarginalityGroups: string[];
  lowMarginalityGroups: string[];
  updateReportDetails: (detail: string) => void;
  updateTotalReportedHours: (hours: number) => void;
}

export class WeeklyFinancialReportRepository
  implements IWeeklyFinancialReportRepository
{
  async generateReport({
    targetUnits,
    employees,
    projects,
  }: GenerateReportInput) {
    const currentDate = new Date();
    const reportTitle = this.composeWeeklyReportTitle(currentDate);
    const processedGroupIds = new Set<number>();
    let reportDetails = '';
    let totalReportedHours = 0;
    const currentQuarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;
    const highGroups: string[] = [];
    const mediumGroups: string[] = [];
    const lowGroups: string[] = [];

    for (const targetUnit of targetUnits) {
      this.processTargetUnit({
        targetUnit,
        targetUnits,
        employees,
        projects,
        processedGroupIds,
        currentQuarter,
        highMarginalityGroups: highGroups,
        mediumMarginalityGroups: mediumGroups,
        lowMarginalityGroups: lowGroups,
        updateReportDetails: (detail) => (reportDetails += detail),
        updateTotalReportedHours: (hours) => (totalReportedHours += hours),
      });
    }

    reportDetails +=
      WeeklyFinancialReportFormatter.formatFooter(totalReportedHours);

    const reportSummary = WeeklyFinancialReportFormatter.formatSummary({
      reportTitle,
      highGroups,
      mediumGroups,
      lowGroups,
    });

    return {
      details: reportDetails,
      summary: reportSummary,
    };
  }

  private processTargetUnit({
    targetUnit,
    targetUnits,
    employees,
    projects,
    processedGroupIds,
    currentQuarter,
    highMarginalityGroups,
    mediumMarginalityGroups,
    lowMarginalityGroups,
    updateReportDetails,
    updateTotalReportedHours,
  }: ProcessTargetUnitInput) {
    if (!processedGroupIds.has(targetUnit.group_id)) {
      processedGroupIds.add(targetUnit.group_id);

      const { groupUnits, groupTotalHours } = GroupAggregator.aggregateGroup(
        targetUnits,
        targetUnit.group_id,
      );
      const { groupTotalCogs, groupTotalRevenue } = this.aggregateGroupData({
        groupUnits,
        employees,
        projects,
      });
      const marginality = MarginalityCalculator.calculate(
        groupTotalRevenue,
        groupTotalCogs,
      );

      this.pushGroupByMarginality(marginality.level, targetUnit.group_name, {
        highMarginalityGroups,
        mediumMarginalityGroups,
        lowMarginalityGroups,
      });
      updateReportDetails(
        WeeklyFinancialReportFormatter.formatDetail({
          groupName: targetUnit.group_name,
          groupTotalHours,
          currentQuarter,
          groupTotalRevenue,
          groupTotalCogs,
          marginAmount: marginality.marginAmount,
          marginalityPercent: marginality.marginalityPercent,
          indicator: marginality.indicator,
        }),
      );
      updateTotalReportedHours(groupTotalHours);
    }
  }

  private pushGroupByMarginality(
    level: MarginalityLevel,
    groupName: string,
    groups: {
      highMarginalityGroups: string[];
      mediumMarginalityGroups: string[];
      lowMarginalityGroups: string[];
    },
  ) {
    switch (level) {
      case MarginalityLevel.High:
        groups.highMarginalityGroups.push(groupName);
        break;
      case MarginalityLevel.Medium:
        groups.mediumMarginalityGroups.push(groupName);
        break;
      case MarginalityLevel.Low:
        groups.lowMarginalityGroups.push(groupName);
        break;
    }
  }

  private composeWeeklyReportTitle(currentDate: Date): string {
    const quarter = Math.floor(currentDate.getMonth() / 3);
    const periodStart = new Date(currentDate.getFullYear(), quarter * 3, 1)
      .toISOString()
      .slice(0, 10);
    const periodEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - ((currentDate.getDay() + 6) % 7) - 1,
    )
      .toISOString()
      .slice(0, 10);

    return `*Weekly Financial Summary for Target Units* (${periodStart} - ${periodEnd})`;
  }

  private safeGetRate(
    history: Employee['history'] | undefined,
    date: string,
  ): number {
    if (!history || typeof history !== 'object' || !history.rate) return 0;

    return getRateByDate(history.rate, date) || 0;
  }

  private aggregateGroupData({
    groupUnits,
    employees,
    projects,
  }: AggregateGroupDataInput) {
    let groupTotalCogs = 0;
    let groupTotalRevenue = 0;

    for (const unit of groupUnits) {
      const employee = employees.find((e) => e.redmine_id === unit.user_id);
      const project = projects.find((p) => p.redmine_id === unit.project_id);
      const date = unit.spent_on;
      const employeeRate = this.safeGetRate(employee?.history, date);
      const projectRate = this.safeGetRate(project?.history, date);

      groupTotalCogs += employeeRate * unit.total_hours;
      groupTotalRevenue += projectRate * unit.total_hours;
    }

    return { groupTotalCogs, groupTotalRevenue };
  }
}
