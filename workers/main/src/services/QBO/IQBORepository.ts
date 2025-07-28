import { Invoice, CustomerRevenueByRef, CustomerRevenueObject } from './types';

/**
 * Interface for QBO repository operations.
 */
export interface IQBORepository {
  /**
   * Fetch all paid invoices within a date range (inclusive).
   */
  getPaidInvoices(periodStart: string, periodEnd: string): Promise<Invoice[]>;
  /**
   * Fetch paid invoices grouped by customer with total amounts.
   */
  getPaidInvoicesGroupedByCustomer(periodStart: string, periodEnd: string): Promise<CustomerRevenueObject>;
  /**
   * Calculate Effective Revenue (sum of paid invoices) for the current quarter grouped by CustomerRef.id.
   */
  getQuarterEffectiveRevenue(): Promise<CustomerRevenueByRef>;
}
