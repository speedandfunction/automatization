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
  MarginalityResult,
} from './MarginalityCalculator';
import { WeeklyFinancialReportFormatter } from './WeeklyFinancialReportFormatter';

interface GroupData {
  groupName: string;
  groupTotalHours: number;
  groupTotalRevenue: number;
  groupTotalCogs: number;
  effectiveRevenue: number;
  effectiveMargin: number;
  effectiveMarginality: number;
  marginality: MarginalityResult;
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
    const currentQuarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;

    const { groupData } = this.collectGroupData(
      targetUnits,
      employees,
      projects,
    );

    this.sortGroupData(groupData);

    const { reportDetails: initialDetails, totalReportedHours } =
      this.formatGroupDetails(groupData, currentQuarter);

    const reportDetails =
      initialDetails +
      WeeklyFinancialReportFormatter.formatFooter(totalReportedHours);

    const { highGroups, mediumGroups, lowGroups } =
      this.createSortedGroups(groupData);

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

  private collectGroupData(
    targetUnits: TargetUnit[],
    employees: Employee[],
    projects: Project[],
  ) {
    const processedGroupIds = new Set<number>();
    const groupData: GroupData[] = [];

    for (const targetUnit of targetUnits) {
      if (!processedGroupIds.has(targetUnit.group_id)) {
        processedGroupIds.add(targetUnit.group_id);
        const groupDataItem = this.processSingleGroup(
          targetUnit,
          targetUnits,
          employees,
          projects,
        );

        groupData.push(groupDataItem);
      }
    }

    return { groupData };
  }

  private sortGroupData(groupData: GroupData[]) {
    const levelOrder = {
      [MarginalityLevel.High]: 3,
      [MarginalityLevel.Medium]: 2,
      [MarginalityLevel.Low]: 1,
    };

    // Sort by marginality level (High -> Medium -> Low),
    // then within each level by descending effectiveMarginality
    groupData.sort((a, b) => {
      const levelComparison =
        levelOrder[b.marginality.level] - levelOrder[a.marginality.level];

      if (levelComparison !== 0) {
        return levelComparison;
      }

      return b.effectiveMarginality - a.effectiveMarginality;
    });
  }

  private processSingleGroup(
    targetUnit: TargetUnit,
    targetUnits: TargetUnit[],
    employees: Employee[],
    projects: Project[],
  ): GroupData {
    const { groupUnits, groupTotalHours } = GroupAggregator.aggregateGroup(
      targetUnits,
      targetUnit.group_id,
    );
    const {
      groupTotalCogs,
      groupTotalRevenue,
      effectiveRevenue,
      effectiveMargin,
      effectiveMarginality,
    } = this.aggregateGroupData({ groupUnits, employees, projects });
    const marginality = MarginalityCalculator.calculate(
      groupTotalRevenue,
      groupTotalCogs,
    );

    return {
      groupName: targetUnit.group_name,
      groupTotalHours,
      groupTotalRevenue,
      groupTotalCogs,
      effectiveRevenue,
      effectiveMargin,
      effectiveMarginality,
      marginality,
    };
  }

  private createSortedGroups(groupData: GroupData[]) {
    const highGroups: string[] = [];
    const mediumGroups: string[] = [];
    const lowGroups: string[] = [];

    // Groups are already sorted by effectiveMarginality, so just distribute them by categories
    for (const group of groupData) {
      this.pushGroupByMarginality(group.marginality.level, group.groupName, {
        highMarginalityGroups: highGroups,
        mediumMarginalityGroups: mediumGroups,
        lowMarginalityGroups: lowGroups,
      });
    }

    return { highGroups, mediumGroups, lowGroups };
  }

  private formatGroupDetails(groupData: GroupData[], currentQuarter: string) {
    let reportDetails = '';
    let totalReportedHours = 0;

    for (const group of groupData) {
      reportDetails += WeeklyFinancialReportFormatter.formatDetail({
        groupName: group.groupName,
        groupTotalHours: group.groupTotalHours,
        currentQuarter,
        groupTotalRevenue: group.groupTotalRevenue,
        groupTotalCogs: group.groupTotalCogs,
        marginAmount: group.marginality.marginAmount,
        marginalityPercent: group.marginality.marginalityPercent,
        indicator: group.marginality.indicator,
        effectiveRevenue: group.effectiveRevenue,
        effectiveMargin: group.effectiveMargin,
        effectiveMarginality: group.effectiveMarginality,
      });
      totalReportedHours += group.groupTotalHours;
    }

    return { reportDetails, totalReportedHours };
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
    let effectiveRevenue = 0;

    for (const unit of groupUnits) {
      const employee = employees.find((e) => e.redmine_id === unit.user_id);
      const project = projects.find((p) => p.redmine_id === unit.project_id);
      const date = unit.spent_on;
      const employeeRate = this.safeGetRate(employee?.history, date);
      const projectRate = this.safeGetRate(project?.history, date);

      groupTotalCogs += employeeRate * unit.total_hours;
      groupTotalRevenue += projectRate * unit.total_hours;
      effectiveRevenue += projectRate * unit.total_hours; // For now, same as total revenue
    }

    const effectiveMargin = effectiveRevenue - groupTotalCogs;
    const effectiveMarginality =
      effectiveRevenue > 0 ? (effectiveMargin / effectiveRevenue) * 100 : 0;

    return {
      groupTotalCogs,
      groupTotalRevenue,
      effectiveRevenue,
      effectiveMargin,
      effectiveMarginality,
    };
  }
}
