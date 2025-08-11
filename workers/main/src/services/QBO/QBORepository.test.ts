/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { QuickBooksRepositoryError } from '../../common/errors';
import { OAuth2Manager } from '../OAuth2';
import { QBORepository } from './QBORepository';
import { Invoice } from './types';

// Mock dependencies
vi.mock('axios');
vi.mock('axios-retry');
vi.mock('../OAuth2');
vi.mock('../../configs/qbo', () => ({
  qboConfig: {
    apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    companyId: 'test-company-id',
    refreshToken: 'test-refresh-token',
    tokenHost: 'https://oauth.platform.intuit.com',
    tokenPath: '/oauth2/v1/tokens/bearer',
    tokenExpirationWindowSeconds: 300,
    effectiveRevenueMonths: 4,
  },
  qboSchema: z.object({
    QBO_API_URL: z.string().url().min(1, 'QBO_API_URL is required'),
    QBO_BEARER_TOKEN: z.string().optional(),
    QBO_CLIENT_ID: z.string().min(1, 'QBO_CLIENT_ID is required'),
    QBO_CLIENT_SECRET: z.string().min(1, 'QBO_CLIENT_SECRET is required'),
    QBO_COMPANY_ID: z.string().min(1, 'QBO_COMPANY_ID is required'),
    QBO_REFRESH_TOKEN: z.string(),
    QBO_EFFECTIVE_REVENUE_MONTHS: z.string().optional(),
  }),
}));

const mockAxios = vi.mocked(axios);
const mockAxiosRetry = vi.mocked(axiosRetry);
const mockOAuth2Manager = vi.mocked(OAuth2Manager);

// Test data utilities
const createMockInvoice = (overrides = {}): Invoice => ({
  TotalAmt: 1000,
  Balance: 0,
  CustomerRef: { value: 'customer1', name: 'Test Customer' },
  ...overrides,
});

const createMockApiResponse = (invoices: Invoice[] = []) => ({
  data: {
    QueryResponse: { Invoice: invoices },
  },
});

describe('QBORepository', () => {
  let qboRepository: QBORepository;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
    };
    mockAxios.create.mockReturnValue(mockAxiosInstance);

    // Setup mock OAuth2Manager
    mockOAuth2Manager.mockImplementation(
      () =>
        ({
          getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
        }) as any,
    );

    qboRepository = new QBORepository();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(mockOAuth2Manager).toHaveBeenCalledWith('qbo-test-company-id', {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'test-refresh-token',
        tokenHost: 'https://oauth.platform.intuit.com',
        tokenPath: '/oauth2/v1/tokens/bearer',
        tokenExpirationWindowSeconds: 300,
      });

      expect(mockAxios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      expect(mockAxiosRetry).toHaveBeenCalledWith(
        mockAxiosInstance,
        expect.objectContaining({
          retries: 3,
          retryCondition: expect.any(Function),
          retryDelay: expect.any(Function),
        }),
      );
    });
  });

  describe('getEffectiveRevenue', () => {
    it('should return aggregated customer revenue data', async () => {
      const mockInvoices: Invoice[] = [
        createMockInvoice({
          TotalAmt: 1000,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        }),
        createMockInvoice({
          TotalAmt: 500,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        }),
        createMockInvoice({
          TotalAmt: 750,
          CustomerRef: { value: 'customer2', name: 'Customer Two' },
        }),
      ];

      mockAxiosInstance.get.mockResolvedValue(
        createMockApiResponse(mockInvoices),
      );

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({
        customer1: {
          customerName: 'Customer One',
          totalAmount: 1500,
          invoiceCount: 2,
        },
        customer2: {
          customerName: 'Customer Two',
          totalAmount: 750,
          invoiceCount: 1,
        },
      });
    });

    it('should handle empty invoice response', async () => {
      mockAxiosInstance.get.mockResolvedValue(createMockApiResponse([]));

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });

    it('should throw QuickBooksRepositoryError on API failure', async () => {
      const errorMessage = 'API request failed';

      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(qboRepository.getEffectiveRevenue()).rejects.toThrow(
        QuickBooksRepositoryError,
      );

      await expect(qboRepository.getEffectiveRevenue()).rejects.toThrow(
        'QBORepository.getEffectiveRevenue failed: QBORepository.getPaidInvoices failed: API request failed',
      );
    });
  });
});
