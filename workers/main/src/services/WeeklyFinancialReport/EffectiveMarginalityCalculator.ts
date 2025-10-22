import {
  HIGH_EFFECTIVE_MARGINALITY_THRESHOLD,
  LOW_EFFECTIVE_MARGINALITY_THRESHOLD,
  MEDIUM_EFFECTIVE_MARGINALITY_THRESHOLD,
} from '../../configs/weeklyFinancialReport';

export enum EffectiveMarginalityLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  VeryLow = 'veryLow',
}

export interface EffectiveMarginalityResult {
  marginAmount: number;
  marginalityPercent: number;
  effectiveMarginalityIndicator: string;
  level: EffectiveMarginalityLevel;
}

export class EffectiveMarginalityCalculator {
  static calculate(revenue: number, cogs: number): EffectiveMarginalityResult {
    const marginAmount = revenue - cogs;
    const marginalityPercent = revenue > 0 ? (marginAmount / revenue) * 100 : 0;
    const level = this.classify(marginalityPercent);
    const effectiveMarginalityIndicator = this.getIndicator(level);

    return {
      marginAmount,
      marginalityPercent,
      effectiveMarginalityIndicator,
      level,
    };
  }

  static classify(percent: number): EffectiveMarginalityLevel {
    if (percent >= HIGH_EFFECTIVE_MARGINALITY_THRESHOLD)
      return EffectiveMarginalityLevel.High;
    if (percent >= MEDIUM_EFFECTIVE_MARGINALITY_THRESHOLD)
      return EffectiveMarginalityLevel.Medium;
    if (percent >= LOW_EFFECTIVE_MARGINALITY_THRESHOLD)
      return EffectiveMarginalityLevel.Low;

    return EffectiveMarginalityLevel.VeryLow;
  }

  static getIndicator(level: EffectiveMarginalityLevel): string {
    switch (level) {
      case EffectiveMarginalityLevel.High:
        return `:large_green_circle:`;
      case EffectiveMarginalityLevel.Medium:
        return `:large_yellow_circle:`;
      case EffectiveMarginalityLevel.Low:
        return `:red_circle:`;
      case EffectiveMarginalityLevel.VeryLow:
      default:
        return `:no_entry:`;
    }
  }
}
