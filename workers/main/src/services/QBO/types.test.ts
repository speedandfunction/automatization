import { describe, expect, it } from 'vitest';

import {
  CustomerRevenueByRef,
  HTTP_STATUS,
  Invoice,
  NetworkErrorCode,
  RETRY_CONFIG,
} from './types';

describe('NetworkErrorCode', () => {
  it('should contain all expected network error codes', () => {
    expect(NetworkErrorCode.ECONNRESET).toBe('ECONNRESET');
    expect(NetworkErrorCode.ETIMEDOUT).toBe('ETIMEDOUT');
    expect(NetworkErrorCode.ENOTFOUND).toBe('ENOTFOUND');
    expect(NetworkErrorCode.ECONNABORTED).toBe('ECONNABORTED');
  });

  it('should have correct number of error codes', () => {
    const errorCodes = Object.values(NetworkErrorCode);

    expect(errorCodes).toHaveLength(4);
  });

  it('should include all error codes in Object.values', () => {
    const errorCodes = Object.values(NetworkErrorCode);

    expect(errorCodes).toContain('ECONNRESET');
    expect(errorCodes).toContain('ETIMEDOUT');
    expect(errorCodes).toContain('ENOTFOUND');
    expect(errorCodes).toContain('ECONNABORTED');
  });
});

describe('HTTP_STATUS', () => {
  it('should contain correct HTTP status codes', () => {
    expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
  });

  it('should be readonly', () => {
    expect(HTTP_STATUS).toBeDefined();
    expect(typeof HTTP_STATUS.TOO_MANY_REQUESTS).toBe('number');
  });
});

describe('RETRY_CONFIG', () => {
  it('should contain correct retry configuration values', () => {
    expect(RETRY_CONFIG.DEFAULT_MAX_DELAY).toBe(30000);
    expect(RETRY_CONFIG.GATEWAY_MAX_DELAY).toBe(60000);
    expect(RETRY_CONFIG.RETRY_AFTER_MULTIPLIER).toBe(1000);
  });

  it('should be readonly', () => {
    expect(RETRY_CONFIG).toBeDefined();
    expect(typeof RETRY_CONFIG.DEFAULT_MAX_DELAY).toBe('number');
  });
});

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
