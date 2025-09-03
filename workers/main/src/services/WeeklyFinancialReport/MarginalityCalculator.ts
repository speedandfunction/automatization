import {
  HIGH_EFFECTIVE_MARGINALITY_THRESHOLD,
  HIGH_MARGINALITY_THRESHOLD,
  LOW_EFFECTIVE_MARGINALITY_THRESHOLD,
  MEDIUM_EFFECTIVE_MARGINALITY_THRESHOLD,
  MEDIUM_MARGINALITY_THRESHOLD,
} from '../../configs/weeklyFinancialReport';

export enum MarginalityLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum EffectiveMarginalityLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  VeryLow = 'veryLow',
}

export interface MarginalityResult {
  marginAmount: number;
  marginalityPercent: number;
  indicator: string;
  level: MarginalityLevel;
}

export interface EffectiveMarginalityResult {
  marginAmount: number;
  marginalityPercent: number;
  indicator: string;
  level: EffectiveMarginalityLevel;
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

export class EffectiveMarginalityCalculator {
  static calculate(revenue: number, cogs: number): EffectiveMarginalityResult {
    const marginAmount = revenue - cogs;
    const marginalityPercent = revenue > 0 ? (marginAmount / revenue) * 100 : 0;
    const level = this.classify(marginalityPercent);
    const indicator = this.getIndicator(level);

    return { marginAmount, marginalityPercent, indicator, level };
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
