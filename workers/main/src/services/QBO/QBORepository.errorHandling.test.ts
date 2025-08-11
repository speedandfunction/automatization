import axios from 'axios';
import axiosRetry from 'axios-retry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { QuickBooksRepositoryError } from '../../common/errors';
import { OAuth2Manager } from '../OAuth2';
import { QBORepository } from './QBORepository';

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

describe('QBORepository Error Handling', () => {
  let qboRepository: QBORepository;
  let mockAxiosInstance: { get: ReturnType<typeof vi.fn> };
  let mockRetryCondition: (error: {
    response?: { status: number };
    code?: string;
  }) => boolean;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxiosInstance = {
      get: vi.fn(),
    };
    (mockAxios.create as ReturnType<typeof vi.fn>).mockReturnValue(
      mockAxiosInstance,
    );

    // Capture retry condition function for testing
    (mockAxiosRetry as ReturnType<typeof vi.fn>).mockImplementation(
      (
        instance,
        config: {
          retryCondition?: (error: {
            response?: { status: number };
            code?: string;
          }) => boolean;
        },
      ) => {
        if (config?.retryCondition) {
          mockRetryCondition = config.retryCondition;
        }
      },
    );

    (mockOAuth2Manager as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
    }));

    qboRepository = new QBORepository();
  });

  describe('retry condition logic', () => {
    it('should retry on 429 status code', () => {
      const error = {
        response: { status: 429 },
        code: undefined,
      };

      expect(mockRetryCondition(error)).toBe(true);
    });

    it('should retry on 500 status code', () => {
      const error = {
        response: { status: 500 },
        code: undefined,
      };

      expect(mockRetryCondition(error)).toBe(true);
    });

    it('should retry on 502 status code', () => {
      const error = {
        response: { status: 502 },
        code: undefined,
      };

      expect(mockRetryCondition(error)).toBe(true);
    });

    it('should retry on network errors', () => {
      const networkErrors = [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNABORTED',
      ];

      networkErrors.forEach((code) => {
        const error = {
          response: undefined,
          code,
        };

        expect(mockRetryCondition(error)).toBe(true);
      });
    });

    it('should not retry on 400 status code', () => {
      const error = {
        response: { status: 400 },
        code: undefined,
      };

      expect(mockRetryCondition(error)).toBe(false);
    });

    it('should not retry on 404 status code', () => {
      const error = {
        response: { status: 404 },
        code: undefined,
      };

      expect(mockRetryCondition(error)).toBe(false);
    });
  });

  describe('OAuth2 token errors', () => {
    it('should handle OAuth2 token retrieval failure', async () => {
      (mockOAuth2Manager as ReturnType<typeof vi.fn>).mockImplementation(
        () => ({
          getAccessToken: vi.fn().mockRejectedValue(new Error('Token expired')),
        }),
      );

      qboRepository = new QBORepository();

      await expect(qboRepository.getEffectiveRevenue()).rejects.toThrow(
        QuickBooksRepositoryError,
      );

      await expect(qboRepository.getEffectiveRevenue()).rejects.toThrow(
        'QBORepository.getEffectiveRevenue failed: QBORepository.getPaidInvoices failed: Token expired',
      );
    });
  });

  describe('API error scenarios', () => {
    it('should handle malformed API response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { QueryResponse: {} }, // Missing Invoice property
      });

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });

    it('should handle null API response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { QueryResponse: { Invoice: null } },
      });

      const result = await qboRepository.getEffectiveRevenue();

      expect(result).toEqual({});
    });
  });
});
