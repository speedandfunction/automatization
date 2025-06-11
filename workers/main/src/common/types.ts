import { GroupNameEnum } from '../configs/weeklyFinancialReport';

export interface TargetUnit {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  user_id: number;
  username: string;
  spent_on: string;
  total_hours: number;
  rate?: number;
  projectRate?: number;
}

export type GroupName = (typeof GroupNameEnum)[keyof typeof GroupNameEnum];
