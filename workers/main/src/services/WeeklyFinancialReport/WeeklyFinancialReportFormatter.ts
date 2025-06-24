import { formatCurrency } from '../../common/formatUtils';
import {
  HIGH_MARGINALITY_THRESHOLD,
  MEDIUM_MARGINALITY_THRESHOLD,
} from '../../configs/weeklyFinancialReport';

export interface formatSummaryInput {
  reportTitle: string;
  highGroups: string[];
  mediumGroups: string[];
  lowGroups: string[];
}

export interface FormatDetailInput {
  groupName: string;
  groupTotalHours: number;
  currentQuarter: string;
  groupTotalRevenue: number;
  groupTotalCogs: number;
  marginAmount: number;
  marginalityPercent: number;
  indicator: string;
}

const spacer = ' '.repeat(4);

export class WeeklyFinancialReportFormatter {
  static formatDetail = ({
    groupName,
    groupTotalHours,
    currentQuarter,
    groupTotalRevenue,
    groupTotalCogs,
    marginAmount,
    marginalityPercent,
    indicator,
  }: FormatDetailInput) =>
    `${indicator} *${groupName}* (${groupTotalHours}h)\n` +
    `${spacer}*Period*: ${currentQuarter}\n` +
    `${spacer}*Revenue*: ${formatCurrency(groupTotalRevenue)}\n` +
    `${spacer}*COGS*: ${formatCurrency(groupTotalCogs)}\n` +
    `${spacer}*Margin*: ${formatCurrency(marginAmount)}\n` +
    `${spacer}*Marginality*: ${marginalityPercent.toFixed(0)}%\n\n`;

  static formatSummary = ({
    reportTitle,
    highGroups,
    mediumGroups,
    lowGroups,
  }: formatSummaryInput) => {
    let summary = `${reportTitle}\n`;

    if (highGroups.length) {
      summary += '________________________________\n';
      summary += `:arrowup: *Marginality is ${HIGH_MARGINALITY_THRESHOLD}% or higher*:\n`;
      summary += `${spacer}${highGroups.join(`\n${spacer}`)}\n`;
    }

    if (mediumGroups.length) {
      summary += '__________________________________\n';
      summary += ` :large_yellow_circle:  *Marginality is between ${MEDIUM_MARGINALITY_THRESHOLD}-${HIGH_MARGINALITY_THRESHOLD}%*:\n`;
      summary += `${spacer}${mediumGroups.join(`\n${spacer}`)}\n`;
    }

    if (lowGroups.length) {
      summary += '__________________________________\n';
      summary += `:arrowdown: *Marginality is under ${MEDIUM_MARGINALITY_THRESHOLD}%*:\n`;
      summary += `${spacer}${lowGroups.join(`\n${spacer}`)}\n`;
    }

    summary += ' -------------------------------------------\n';
    summary += 'The specific figures will be available in the thread';

    return summary;
  };

  static formatFooter = (totalHours: number) =>
    `\n*Total hours*: ${totalHours}h\n\n` +
    '*Notes:*\n' +
    '1. *Contract Type* is not implemented\n' +
    '2. *Effective Revenue* is not implemented\n' +
    '3. *Dept Tech* hours are not implemented\n\n' +
    `*Legend*: Marginality :arrowup: ≥${HIGH_MARGINALITY_THRESHOLD}%   :large_yellow_circle: ${MEDIUM_MARGINALITY_THRESHOLD}-${HIGH_MARGINALITY_THRESHOLD - 1}%  :arrowdown: <${MEDIUM_MARGINALITY_THRESHOLD}%`;
}
