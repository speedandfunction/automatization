import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

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
const mockOAuth2Manager = vi.mocked(OAuth2Manager);

describe('QBORepository Integration', () => {
  let qboRepository: QBORepository;
  let mockAxiosInstance: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxiosInstance = {
      get: vi.fn(),
    };
    (mockAxios.create as ReturnType<typeof vi.fn>).mockReturnValue(
      mockAxiosInstance,
    );

    (mockOAuth2Manager as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
    }));

    qboRepository = new QBORepository();
  });

  describe('data aggregation', () => {
    it('should aggregate multiple invoices for same customer', async () => {
      const invoices: Invoice[] = [
        {
          TotalAmt: 1000,
          Balance: 0,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        },
        {
          TotalAmt: 500,
          Balance: 0,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        },
        {
          TotalAmt: 750,
          Balance: 0,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        },
        {
          TotalAmt: 300,
          Balance: 0,
          CustomerRef: { value: 'customer2', name: 'Customer Two' },
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          QueryResponse: { Invoice: invoices },
        },
      });

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({
        customer1: {
          customerName: 'Customer One',
          totalAmount: 2250, // 1000 + 500 + 750
          invoiceCount: 3,
        },
        customer2: {
          customerName: 'Customer Two',
          totalAmount: 300,
          invoiceCount: 1,
        },
      });
    });

    it('should handle invoices with missing customer information', async () => {
      const invoices: Invoice[] = [
        {
          TotalAmt: 1000,
          Balance: 0,
          CustomerRef: { value: 'customer1', name: 'Customer One' },
        },
        { TotalAmt: 500, Balance: 0, CustomerRef: undefined },
        {
          TotalAmt: 750,
          Balance: 0,
          CustomerRef: { value: 'customer2', name: 'Customer Two' },
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          QueryResponse: { Invoice: invoices },
        },
      });

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({
        customer1: {
          customerName: 'Customer One',
          totalAmount: 1000,
          invoiceCount: 1,
        },
        unknown: {
          customerName: 'Unknown',
          totalAmount: 500,
          invoiceCount: 1,
        },
        customer2: {
          customerName: 'Customer Two',
          totalAmount: 750,
          invoiceCount: 1,
        },
      });
    });
  });

  describe('date window calculation', () => {
    it('should use correct date range for effective revenue months', async () => {
      const mockDate = new Date('2024-01-15');

      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          QueryResponse: { Invoice: [] },
        },
      });

      await qboRepository.getEffectiveRevenue();

      // Should query for 4 months back from 2024-01-15
      const expectedQuery =
        "TxnDate >= '2023-09-15' AND TxnDate <= '2024-01-15'";

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            query: expect.stringContaining(expectedQuery) as string,
          },
        }),
      );

      vi.useRealTimers();
    });
  });
});
