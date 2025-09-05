import { getRateByDate } from '../../common/formatUtils';
import type { TargetUnit } from '../../common/types';
import type { Employee, Project } from '../FinApp';
import { getContractTypeByDate } from '../FinApp/FinAppUtils';
import { GroupAggregator } from './GroupAggregator';
import {
  AggregateGroupDataInput,
  GenerateReportInput,
  IWeeklyFinancialReportRepository,
} from './IWeeklyFinancialReportRepository';
import {
  EffectiveMarginalityCalculator,
  MarginalityCalculator,
  MarginalityLevel,
  MarginalityResult,
} from './MarginalityCalculator';
import { WeeklyFinancialReportCalculations } from './WeeklyFinancialReportCalculations';
import { WeeklyFinancialReportFormatter } from './WeeklyFinancialReportFormatter';

interface GroupData {
  groupName: string;
  groupTotalHours: number;
  groupTotalRevenue: number;
  groupTotalCogs: number;
  effectiveRevenue: number;
  effectiveMargin: number;
  effectiveMarginality: number;
  effectiveMarginalityIndicator: string;
  marginality: MarginalityResult;
  contractType?: string;
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

    const { reportDetails: initialDetails } = this.formatGroupDetails(
      groupData,
      currentQuarter,
    );

    const reportDetails =
      initialDetails + WeeklyFinancialReportFormatter.formatFooter();

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
    // then within each level by groupName alphabetically
    groupData.sort((a, b) => {
      const levelComparison =
        levelOrder[b.marginality.level] - levelOrder[a.marginality.level];

      if (levelComparison !== 0) {
        return levelComparison;
      }

      // Sort by groupName alphabetically within each level
      return a.groupName.localeCompare(b.groupName);
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
      effectiveMarginalityIndicator,
      contractType,
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
      effectiveMarginalityIndicator,
      marginality,
      contractType,
    };
  }

  private createSortedGroups(groupData: GroupData[]) {
    const highGroups: string[] = [];
    const mediumGroups: string[] = [];
    const lowGroups: string[] = [];

    // Distribute groups by marginality level
    for (const group of groupData) {
      this.pushGroupByMarginality(group.marginality.level, group.groupName, {
        highMarginalityGroups: highGroups,
        mediumMarginalityGroups: mediumGroups,
        lowMarginalityGroups: lowGroups,
      });
    }
    // Preserve the order established in sortGroupData

    return { highGroups, mediumGroups, lowGroups };
  }

  private formatGroupDetails(groupData: GroupData[], currentQuarter: string) {
    let reportDetails = '';

    for (const group of groupData) {
      reportDetails += WeeklyFinancialReportFormatter.formatDetail({
        groupName: group.groupName,
        currentQuarter,
        groupTotalHours: group.groupTotalHours,
        groupTotalRevenue: group.groupTotalRevenue,
        groupTotalCogs: group.groupTotalCogs,
        marginAmount: group.marginality.marginAmount,
        marginalityPercent: group.marginality.marginalityPercent,

        effectiveRevenue: group.effectiveRevenue,
        effectiveMargin: group.effectiveMargin,
        effectiveMarginality: group.effectiveMarginality,
        effectiveMarginalityIndicator: group.effectiveMarginalityIndicator,
        contractType: group.contractType,
      });
    }

    return { reportDetails };
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

  private aggregateGroupData({
    groupUnits,
    employees,
    projects,
  }: AggregateGroupDataInput) {
    const { groupTotalCogs, groupTotalRevenue, effectiveRevenue } =
      WeeklyFinancialReportCalculations.calculateGroupTotals(
        groupUnits,
        employees,
        projects,
      );

    const contractType = WeeklyFinancialReportCalculations.resolveContractType(
      groupUnits,
      projects,
    );

    const {
      effectiveMargin,
      effectiveMarginality,
      effectiveMarginalityIndicator,
    } = WeeklyFinancialReportCalculations.calculateEffectiveMarginality(
      effectiveRevenue,
      groupTotalCogs,
    );

    return {
      groupTotalCogs,
      groupTotalRevenue,
      effectiveRevenue,
      effectiveMargin,
      effectiveMarginality,
      effectiveMarginalityIndicator,
      contractType,
    };
  }

  private safeGetRate(
    history: Employee['history'] | undefined,
    date: string,
  ): number {
    return WeeklyFinancialReportCalculations.safeGetRate(history, date);
  }
}
