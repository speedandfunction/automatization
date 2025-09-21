import { RowDataPacket } from 'mysql2/promise';

export interface TargetUnitRow extends RowDataPacket {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  user_id: number;
  username: string;
  spent_on: string;
  project_hours: number;
  total_hours: number;
}
