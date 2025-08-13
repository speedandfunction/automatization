import { formatCurrency } from '../../common/formatUtils';
import { formatDateToISOString } from '../../common/utils';
import { qboConfig } from '../../configs/qbo';
import {
  HIGH_MARGINALITY_THRESHOLD,
  MEDIUM_MARGINALITY_THRESHOLD,
} from '../../configs/weeklyFinancialReport';

export interface FormatSummaryInput {
  reportTitle: string;
  highGroups: string[];
  mediumGroups: string[];
  lowGroups: string[];
}

export interface FormatDetailInput {
  groupName: string;
  currentQuarter: string;
  groupTotalRevenue: number;
  groupTotalCogs: number;
  marginAmount: number;
  marginalityPercent: number;
  indicator: string;
  effectiveRevenue: number;
  effectiveMargin: number;
  effectiveMarginality: number;
}

const spacer = ' '.repeat(4);

export class WeeklyFinancialReportFormatter {
  static formatDetail = ({
    groupName,
    currentQuarter,
    groupTotalRevenue,
    groupTotalCogs,
    marginAmount,
    marginalityPercent,
    indicator,
    effectiveRevenue,
    effectiveMargin,
    effectiveMarginality,
  }: FormatDetailInput) =>
    `*${groupName}*\n` +
    `${spacer}period: ${currentQuarter}\n` +
    `${spacer}revenue: ${formatCurrency(groupTotalRevenue)}\n` +
    `${spacer}COGS: ${formatCurrency(groupTotalCogs)}\n` +
    `${spacer}margin: ${formatCurrency(marginAmount)}\n` +
    `${spacer}marginality: ${marginalityPercent.toFixed(0)}%\n` +
    `${spacer}effective revenue: ${formatCurrency(effectiveRevenue)}\n` +
    `${spacer}effective margin: ${formatCurrency(effectiveMargin)}\n` +
    `${spacer}effective marginality: ${indicator} ${effectiveMarginality.toFixed(0)}%\n\n\n`;

  static formatSummary = ({
    reportTitle,
    highGroups,
    mediumGroups,
    lowGroups,
  }: FormatSummaryInput) => {
    let summary = `${reportTitle}\n`;

    if (highGroups.length) {
      summary += '\n_______________________\n\n\n';
      summary += `:arrowup: *Marginality is ${HIGH_MARGINALITY_THRESHOLD}% or higher*:\n`;
      summary += `${spacer}${spacer}${highGroups.join(`\n${spacer}${spacer}`)}\n`;
    }

    if (mediumGroups.length) {
      summary += '\n_______________________\n\n\n';
      summary += ` :large_yellow_circle:  *Marginality is between ${MEDIUM_MARGINALITY_THRESHOLD}-${HIGH_MARGINALITY_THRESHOLD}%*:\n`;
      summary += `${spacer}${spacer}${mediumGroups.join(`\n${spacer}${spacer}`)}\n`;
    }

    if (lowGroups.length) {
      summary += '\n_______________________\n\n\n';
      summary += `:arrowdown: *Marginality is under ${MEDIUM_MARGINALITY_THRESHOLD}%*:\n`;
      summary += `${spacer}${spacer}${lowGroups.join(`\n${spacer}${spacer}`)}\n`;
    }

    summary += '\n_______________________\n\n\n';
    summary += 'The specific figures will be available in the thread';

    return summary;
  };

  private static calculateDateWindow() {
    const endDate = new Date();

    const currentYear = endDate.getFullYear();
    const currentMonth = endDate.getMonth();
    const monthsToSubtract = qboConfig.effectiveRevenueMonths;

    let targetYear = currentYear;
    let targetMonth = currentMonth - monthsToSubtract;

    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const daysInTargetMonth = new Date(
      targetYear,
      targetMonth + 1,
      0,
    ).getDate();

    const clampedDay = Math.min(endDate.getDate(), daysInTargetMonth);

    const startDate = new Date(
      targetYear,
      targetMonth,
      clampedDay,
      endDate.getHours(),
      endDate.getMinutes(),
      endDate.getSeconds(),
      endDate.getMilliseconds(),
    );

    return {
      startDate: formatDateToISOString(startDate),
      endDate: formatDateToISOString(endDate),
    };
  }

  static formatFooter = () => {
    const { startDate, endDate } = this.calculateDateWindow();

    return (
      '\n*Notes:*\n' +
      '1. *Contract Type* is not implemented\n' +
      `2. *Effective Revenue* calculated for the last ${qboConfig.effectiveRevenueMonths} months (${startDate} - ${endDate})\n` +
      '3. *Dept Tech* hours are not implemented\n\n' +
      `*Legend*: Marginality :arrowup: ≥${HIGH_MARGINALITY_THRESHOLD}%   :large_yellow_circle: ${MEDIUM_MARGINALITY_THRESHOLD}-${HIGH_MARGINALITY_THRESHOLD - 1}%  :arrowdown: <${MEDIUM_MARGINALITY_THRESHOLD}%`
    );
  };
}
