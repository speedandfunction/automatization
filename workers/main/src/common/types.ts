import { GroupNameEnum } from '../configs/weeklyFinancialReport';

export interface TargetUnit {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  user_id: number;
  username: string;
  spent_on: string;
  project_hours: number;
  total_hours: number;
  rate?: number;
  projectRate?: number;
  effectiveMarginalityIndicator?: string;
}

export type GroupName = (typeof GroupNameEnum)[keyof typeof GroupNameEnum];
