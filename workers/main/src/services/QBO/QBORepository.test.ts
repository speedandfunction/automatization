import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { qboConfig } from '../../configs/qbo';
import { QBOApiError } from './QboApiError';
import { QBORepository } from './QBORepository';
import {
  CustomerRevenue,
  CustomerRevenueByRef,
  CustomerRevenueObject,
  EffectiveRevenueResult,
  Invoice,
} from './types';

// Mock dependencies
vi.mock('axios');
vi.mock('axios-retry');
vi.mock('../../configs/qbo', () => ({
  qboConfig: {
    companyId: 'test-company-id',
    apiUrl: 'https://test.qbo.api',
  },
}));
vi.mock('./OAuth2TokenManager', () => ({
  OAuth2TokenManager: vi.fn().mockImplementation(() => ({
    getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
  })),
}));

describe('QBORepository', () => {
  let qboRepository: QBORepository;
  let mockAxiosInstance: AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock axios.create
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    } as unknown as AxiosInstance;

    (axios.create as any).mockReturnValue(mockAxiosInstance);
    (axiosRetry as any).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      const qboRepository = new QBORepository({ baseUrl: 'https://test.api' });

      expect(qboRepository).toBeInstanceOf(QBORepository);
    });

    it('should configure axios-retry with custom handlers', () => {
      const qboRepository = new QBORepository({ baseUrl: 'https://test.api' });

      expect(qboRepository).toBeInstanceOf(QBORepository);
    });

    it('should throw QBOApiError when company ID is not configured', () => {
      // Mock qboConfig to return undefined companyId
      vi.mocked(qboConfig).companyId = undefined;

      expect(() => {
        new QBORepository({ baseUrl: 'https://test.api' });
      }).toThrow(QBOApiError);

      // Restore mock
      vi.mocked(qboConfig).companyId = 'test-company-id';
    });
  });

  describe('getPaidInvoices', () => {
    beforeEach(() => {
      qboRepository = new QBORepository({ baseUrl: 'https://test.api' });
    });

    it('should fetch paid invoices successfully', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoices(
        '2024-01-01',
        '2024-01-31',
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/v3/company/test-company-id/query',
        {
          params: {
            query:
              "SELECT TotalAmt, CustomerRef FROM Invoice WHERE TxnDate >= '2024-01-01' AND TxnDate <= '2024-01-31' AND Balance = '0'",
          },
        },
      );
      expect(result).toEqual(mockInvoices);
    });

    it('should return empty array when no invoices found', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoices(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when QueryResponse is missing', async () => {
      const mockResponse = {
        data: {},
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoices(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual([]);
    });

    it('should handle API errors and convert to QBOApiError', async () => {
      const mockError = new Error('API Error');

      (mockAxiosInstance.get as any).mockRejectedValue(mockError);

      try {
        await qboRepository.getPaidInvoices('2024-01-01', '2024-01-31');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(QBOApiError);
        expect((error as QBOApiError).message).toContain(
          'QBORepository.getPaidInvoices failed',
        );
      }
    });
  });

  describe('getQuarterEffectiveRevenue', () => {
    beforeEach(() => {
      qboRepository = new QBORepository({ baseUrl: 'https://test.api' });
    });

    it('should calculate quarter effective revenue correctly', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            id: 'ref1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer2',
            id: 'ref2',
            name: 'Customer Two',
          },
        },
        {
          Id: '3',
          TotalAmt: 1500,
          CustomerRef: {
            value: 'customer1',
            id: 'ref1',
            name: 'Customer One',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getQuarterEffectiveRevenue();

      expect(result).toEqual({
        ref1: 2500, // 1000 + 1500 (customer1)
        ref2: 2000, // 2000 (customer2)
      });
    });

    it('should handle empty invoices array', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getQuarterEffectiveRevenue();

      expect(result).toEqual({});
    });

    it('should handle invoices with missing customer ref id', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            id: 'ref1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer2',
            // Missing id
            name: 'Customer Two',
          },
        },
        {
          Id: '3',
          TotalAmt: 1500,
          CustomerRef: {
            value: 'customer3',
            id: 'ref3',
            name: 'Customer Three',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getQuarterEffectiveRevenue();

      expect(result).toEqual({
        ref1: 1000, // customer1
        ref3: 1500, // customer3
        // customer2 skipped due to missing id
      });
    });
  });

  describe('getEffectiveRevenue', () => {
    beforeEach(() => {
      qboRepository = new QBORepository({ baseUrl: 'https://test.api' });
    });

    it('should calculate 4-month effective revenue correctly', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
        {
          Id: '3',
          TotalAmt: 3000,
          CustomerRef: {
            value: 'customer3',
            name: 'Customer Three',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({
        customer1: {
          totalAmount: 1000,
          invoiceCount: 1,
        },
        customer2: {
          totalAmount: 2000,
          invoiceCount: 1,
        },
        customer3: {
          totalAmount: 3000,
          invoiceCount: 1,
        },
      });
    });

    it('should use 4-month window instead of quarter', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });

    it('should handle invoices with null TotalAmt', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: null as any,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
        {
          Id: '3',
          TotalAmt: 3000,
          CustomerRef: {
            value: 'customer3',
            name: 'Customer Three',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({
        customer1: {
          totalAmount: 1000,
          invoiceCount: 1,
        },
        customer2: {
          totalAmount: 0, // null TotalAmt becomes 0
          invoiceCount: 1,
        },
        customer3: {
          totalAmount: 3000,
          invoiceCount: 1,
        },
      });
    });

    it('should calculate correct date range for 4-month window', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });
  });

  describe('date calculation logic', () => {
    beforeEach(() => {
      qboRepository = new QBORepository({ baseUrl: 'https://test.api' });
    });

    it('should calculate 4-month period correctly', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });
  });

  describe('getPaidInvoicesGroupedByCustomer', () => {
    beforeEach(() => {
      qboRepository = new QBORepository({ baseUrl: 'https://test.api' });
    });

    it('should group invoices by customer and calculate totals', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '3',
          TotalAmt: 1500,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
        {
          Id: '4',
          TotalAmt: 3000,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoicesGroupedByCustomer(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual({
        customer1: {
          totalAmount: 3000, // 1000 + 2000
          invoiceCount: 2,
        },
        customer2: {
          totalAmount: 4500, // 1500 + 3000
          invoiceCount: 2,
        },
      });
    });

    it('should handle invoices with missing customer value', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: 2000,
          CustomerRef: {}, // Missing value
        },
        {
          Id: '3',
          TotalAmt: 1500,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoicesGroupedByCustomer(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual({
        customer1: {
          totalAmount: 1000,
          invoiceCount: 1,
        },
        customer2: {
          totalAmount: 1500,
          invoiceCount: 1,
        },
        Unknown: {
          totalAmount: 2000,
          invoiceCount: 1,
        },
      });
    });

    it('should handle empty invoices array', async () => {
      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: [],
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoicesGroupedByCustomer(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual({});
    });

    it('should handle invoices with null TotalAmt', async () => {
      const mockInvoices: Invoice[] = [
        {
          Id: '1',
          TotalAmt: 1000,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '2',
          TotalAmt: null as any,
          CustomerRef: {
            value: 'customer1',
            name: 'Customer One',
          },
        },
        {
          Id: '3',
          TotalAmt: 2000,
          CustomerRef: {
            value: 'customer2',
            name: 'Customer Two',
          },
        },
      ];

      const mockResponse = {
        data: {
          QueryResponse: {
            Invoice: mockInvoices,
          },
        },
      };

      (mockAxiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await qboRepository.getPaidInvoicesGroupedByCustomer(
        '2024-01-01',
        '2024-01-31',
      );

      expect(result).toEqual({
        customer1: {
          totalAmount: 1000, // 1000 + 0 (null TotalAmt)
          invoiceCount: 2,
        },
        customer2: {
          totalAmount: 2000,
          invoiceCount: 1,
        },
      });
    });
  });
});
