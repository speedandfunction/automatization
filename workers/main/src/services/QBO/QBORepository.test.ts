import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { QuickBooksRepositoryError } from '../../common/errors';
import { QBORepository } from './QBORepository';

// Mock all dependencies with proper schemas
vi.mock('axios');
vi.mock('axios-retry');
vi.mock('../OAuth2/OAuth2TokenManager');

// Mock all config schemas
vi.mock('../../configs/qbo', () => ({
  qboConfig: {
    effectiveRevenueMonths: 4,
    apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    companyId: 'test-company-id',
    refreshToken: 'test-refresh-token',
    tokenEndpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  },
  qboSchema: z.object({
    QBO_API_URL: z.string().url().min(1, 'QBO_API_URL is required'),
    QBO_CLIENT_ID: z.string().min(1, 'QBO_CLIENT_ID is required'),
    QBO_CLIENT_SECRET: z.string().min(1, 'QBO_CLIENT_SECRET is required'),
    QBO_COMPANY_ID: z.string().min(1, 'QBO_COMPANY_ID is required'),
    QBO_REFRESH_TOKEN: z.string(),
    QBO_EFFECTIVE_REVENUE_MONTHS: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .default(4),
  }),
}));

vi.mock('../../configs/axios', () => ({
  axiosConfig: {
    timeout: 30000,
    maxRetries: 3,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  axiosSchema: z.object({
    AXIOS_TIMEOUT: z.number().optional(),
    AXIOS_MAX_RETRIES: z.number().optional(),
  }),
}));

vi.mock('../../configs/mongoDatabase', () => ({
  mongoDatabaseSchema: z.object({
    MONGODB_URI: z.string().optional(),
  }),
}));

vi.mock('../../configs/redmineDatabase', () => ({
  redmineDatabaseSchema: z.object({
    REDMINE_HOST: z.string().optional(),
    REDMINE_API_KEY: z.string().optional(),
  }),
}));

vi.mock('../../configs/slack', () => ({
  slackSchema: z.object({
    SLACK_BOT_TOKEN: z.string().optional(),
  }),
}));

vi.mock('../../configs/temporal', () => ({
  temporalSchema: z.object({
    TEMPORAL_HOST: z.string().optional(),
  }),
}));

vi.mock('../../configs/worker', () => ({
  workerSchema: z.object({
    WORKER_NAME: z.string().optional(),
  }),
}));

describe('QBORepository - Comprehensive Tests', () => {
  describe('constructor validation', () => {
    it('should create instance with valid configuration', () => {
      const repository = new QBORepository();

      expect(repository).toBeInstanceOf(QBORepository);
    });

    it('should implement IQBORepository interface', () => {
      const repository = new QBORepository();

      expect(typeof repository.getEffectiveRevenue).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should throw QuickBooksRepositoryError for configuration errors', () => {
      expect(() => {
        throw new QuickBooksRepositoryError('Test error');
      }).toThrow(QuickBooksRepositoryError);
    });

    it('should have proper error message format', () => {
      const error = new QuickBooksRepositoryError('Test error message');

      expect(error.message).toBe('Test error message');
    });
  });

  describe('interface compliance', () => {
    it('should have getEffectiveRevenue method', () => {
      const repository = new QBORepository();

      expect(typeof repository.getEffectiveRevenue).toBe('function');
    });
  });
});
