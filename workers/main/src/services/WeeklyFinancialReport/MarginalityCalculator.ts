import {
  HIGH_MARGINALITY_THRESHOLD,
  MEDIUM_MARGINALITY_THRESHOLD,
} from '../../configs/weeklyFinancialReport';

export enum MarginalityLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface MarginalityResult {
  marginAmount: number;
  marginalityPercent: number;
  indicator: string;
  level: MarginalityLevel;
}

export class MarginalityCalculator {
  static calculate(revenue: number, cogs: number): MarginalityResult {
    const marginAmount = revenue - cogs;
    const marginalityPercent = revenue > 0 ? (marginAmount / revenue) * 100 : 0;
    const level = this.classify(marginalityPercent);
    const indicator = this.getIndicator(level);

    return { marginAmount, marginalityPercent, indicator, level };
  }

  static classify(percent: number): MarginalityLevel {
    if (percent >= HIGH_MARGINALITY_THRESHOLD) return MarginalityLevel.High;
    if (percent >= MEDIUM_MARGINALITY_THRESHOLD) return MarginalityLevel.Medium;

    return MarginalityLevel.Low;
  }

  static getIndicator(level: MarginalityLevel): string {
    switch (level) {
      case MarginalityLevel.High:
        return ':arrowup:';
      case MarginalityLevel.Medium:
        return ':large_yellow_circle:';
      case MarginalityLevel.Low:
      default:
        return ':arrowdown:';
    }
  }
}
