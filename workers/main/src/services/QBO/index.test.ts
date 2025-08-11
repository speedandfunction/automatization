import { describe, expect, it } from 'vitest';

import { CustomerRevenueByRef, Invoice, QBORepository } from './index';

describe('QBO Service Index Exports', () => {
  it('should export QBORepository class', () => {
    expect(QBORepository).toBeDefined();
    expect(typeof QBORepository).toBe('function');
  });

  it('should allow creating CustomerRevenueByRef instance', () => {
    const revenue: CustomerRevenueByRef = {
      customer1: {
        customerName: 'Test Customer',
        totalAmount: 1000,
        invoiceCount: 1,
      },
    };

    expect(revenue).toBeDefined();
    expect(revenue.customer1.customerName).toBe('Test Customer');
  });

  it('should allow creating Invoice instance', () => {
    const invoice: Invoice = {
      TotalAmt: 500,
      Balance: 0,
      CustomerRef: {
        value: 'customer1',
        name: 'Test Customer',
      },
    };

    expect(invoice).toBeDefined();
    expect(invoice.TotalAmt).toBe(500);
  });
});
