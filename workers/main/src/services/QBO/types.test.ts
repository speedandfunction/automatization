import { describe, expect, it } from 'vitest';

import { CustomerRevenueByRef, Invoice } from './types';

describe('QBO Types', () => {
  describe('CustomerRevenueByRef', () => {
    it('should have correct structure', () => {
      const revenue: CustomerRevenueByRef = {
        customer1: {
          customerName: 'Test Customer',
          totalAmount: 1000,
          invoiceCount: 2,
        },
      };

      expect(revenue.customer1.customerName).toBe('Test Customer');
      expect(revenue.customer1.totalAmount).toBe(1000);
      expect(revenue.customer1.invoiceCount).toBe(2);
    });

    it('should support multiple customers', () => {
      const revenue: CustomerRevenueByRef = {
        customer1: {
          customerName: 'Customer One',
          totalAmount: 1000,
          invoiceCount: 1,
        },
        customer2: {
          customerName: 'Customer Two',
          totalAmount: 2000,
          invoiceCount: 3,
        },
      };

      expect(Object.keys(revenue)).toHaveLength(2);
      expect(revenue.customer1.totalAmount).toBe(1000);
      expect(revenue.customer2.totalAmount).toBe(2000);
    });
  });

  describe('Invoice', () => {
    it('should have correct structure with CustomerRef', () => {
      const invoice: Invoice = {
        TotalAmt: 500,
        Balance: 0,
        CustomerRef: {
          value: 'customer1',
          name: 'Test Customer',
        },
      };

      expect(invoice.TotalAmt).toBe(500);
      expect(invoice.Balance).toBe(0);
      expect(invoice.CustomerRef?.value).toBe('customer1');
      expect(invoice.CustomerRef?.name).toBe('Test Customer');
    });

    it('should handle optional CustomerRef', () => {
      const invoice: Invoice = {
        TotalAmt: 500,
        Balance: 0,
        CustomerRef: undefined,
      };

      expect(invoice.TotalAmt).toBe(500);
      expect(invoice.Balance).toBe(0);
      expect(invoice.CustomerRef).toBeUndefined();
    });

    it('should handle CustomerRef with missing name', () => {
      const invoice: Invoice = {
        TotalAmt: 500,
        Balance: 0,
        CustomerRef: {
          value: 'customer1',
          name: undefined,
        },
      };

      expect(invoice.TotalAmt).toBe(500);
      expect(invoice.Balance).toBe(0);
      expect(invoice.CustomerRef?.value).toBe('customer1');
      expect(invoice.CustomerRef?.name).toBeUndefined();
    });

    it('should handle different balance amounts', () => {
      const paidInvoice: Invoice = {
        TotalAmt: 1000,
        Balance: 0,
        CustomerRef: {
          value: 'customer1',
          name: 'Test Customer',
        },
      };

      const unpaidInvoice: Invoice = {
        TotalAmt: 1000,
        Balance: 1000,
        CustomerRef: {
          value: 'customer1',
          name: 'Test Customer',
        },
      };

      expect(paidInvoice.Balance).toBe(0);
      expect(unpaidInvoice.Balance).toBe(1000);
    });
  });
});
