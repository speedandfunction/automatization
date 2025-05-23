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

/**
 * Fetches financial data for a given period from an external source or database.
 * @param period - The period to fetch data for (e.g., 'Q1 2025', 'current')
 */
export async function fetchFinancialData(
  period: string = 'current',
): Promise<FinancialData> {
  // TODO: Replace this stub with actual data fetching logic (e.g., DB query, API call)
  return {
    period: period,
    contractType: 'T&M',
    revenue: 120000,
    cogs: 80000,
    margin: 40000,
    marginality: 33.3,
    effectiveRevenue: 110000,
    effectiveMargin: 35000,
    effectiveMarginality: 31.8,
  };
}
