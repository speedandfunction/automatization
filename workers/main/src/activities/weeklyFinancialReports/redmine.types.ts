export interface ProjectUnit {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
}

export interface FinancialData {
  period: string;
  contractType: string;
  revenue: number;
  cogs: number;
  margin: number;
  marginality: number;
  effectiveRevenue: number;
  effectiveMargin: number;
  effectiveMarginality: number;
}
