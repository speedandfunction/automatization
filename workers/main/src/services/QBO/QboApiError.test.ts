import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { QBOApiError, QBOErrorClassifier } from './QboApiError';

describe('QBOApiError', () => {
  describe('constructor', () => {
    it('should create QBOApiError with all properties', () => {
      const error = new QBOApiError(
        'Test error message',
        500,
        true,
        60,
        'TEST_ERROR',
      );

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(60);
      expect(error.errorCode).toBe('TEST_ERROR');
    });

    it('should create QBOApiError with default values', () => {
      const error = new QBOApiError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBeUndefined();
      expect(error.retryable).toBe(false);
      expect(error.retryAfter).toBeUndefined();
      expect(error.errorCode).toBeUndefined();
    });
  });

  describe('fromAxiosError', () => {
    it('should convert AxiosError to QBOApiError with full details', () => {
      const axiosError = new AxiosError(
        'API Error',
        '500',
        undefined,
        undefined,
        {
          status: 500,
          data: {
            message: 'Internal Server Error',
            errorCode: 'INTERNAL_ERROR',
          },
          statusText: 'Internal Server Error',
          headers: { 'retry-after': '30' },
          config: {} as any,
        },
      );

      const qboError = QBOApiError.fromAxiosError(axiosError);

      expect(qboError.message).toBe('Internal Server Error');
      expect(qboError.statusCode).toBe(500);
      expect(qboError.retryable).toBe(true); // 5xx errors are retryable
      expect(qboError.retryAfter).toBe(30);
      expect(qboError.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should handle AxiosError without response data', () => {
      const axiosError = new AxiosError(
        'Network Error',
        'ECONNABORTED',
        undefined,
        undefined,
        {
          status: 0,
          data: undefined,
          statusText: '',
          headers: {},
          config: {} as any,
        },
      );

      const qboError = QBOApiError.fromAxiosError(axiosError);

      expect(qboError.message).toBe('Network Error');
      expect(qboError.statusCode).toBe(0);
      expect(qboError.retryable).toBe(true); // Network errors are retryable
      expect(qboError.retryAfter).toBeUndefined();
      expect(qboError.errorCode).toBeUndefined();
    });

    it('should use fallback message when response data is missing', () => {
      const axiosError = new AxiosError(
        'Original Error',
        '500',
        undefined,
        undefined,
        {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
      );

      const qboError = QBOApiError.fromAxiosError(axiosError);

      expect(qboError.message).toBe('Original Error');
      expect(qboError.statusCode).toBe(500);
    });
  });

  describe('toErrorDetails', () => {
    it('should convert to error details object', () => {
      const error = new QBOApiError('Test error', 429, true, 60, 'RATE_LIMIT');

      const details = error.toErrorDetails();

      expect(details).toEqual({
        message: 'Test error',
        statusCode: 429,
        retryable: true,
        retryAfter: 60,
        errorCode: 'RATE_LIMIT',
      });
    });
  });
});

describe('QBOErrorClassifier', () => {
  describe('isRetryable', () => {
    it('should return true for 429 status code', () => {
      const result = QBOErrorClassifier.isRetryable({
        statusCode: 429,
        message: 'Rate limit exceeded',
      });

      expect(result).toBe(true);
    });

    it('should return true for 5xx status codes', () => {
      const statusCodes = [500, 502, 503, 504];

      statusCodes.forEach((statusCode) => {
        const result = QBOErrorClassifier.isRetryable({
          statusCode,
          message: 'Server error',
        });

        expect(result).toBe(true);
      });
    });

    it('should return true for network timeout errors', () => {
      const result = QBOErrorClassifier.isRetryable({
        message: 'timeout of 5000ms exceeded',
      });

      expect(result).toBe(true);
    });

    it('should return true for network connection errors', () => {
      const result = QBOErrorClassifier.isRetryable({
        message: 'Network connection failed',
      });

      expect(result).toBe(true);
    });

    it('should return true for specific QBO error codes', () => {
      const retryableCodes = [
        'AUTHENTICATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'SERVICE_UNAVAILABLE',
      ];

      retryableCodes.forEach((errorCode) => {
        const result = QBOErrorClassifier.isRetryable({
          errorCode,
          message: 'QBO error',
        });

        expect(result).toBe(true);
      });
    });

    it('should return false for 4xx client errors', () => {
      const statusCodes = [400, 401, 403, 404, 422];

      statusCodes.forEach((statusCode) => {
        const result = QBOErrorClassifier.isRetryable({
          statusCode,
          message: 'Client error',
        });

        expect(result).toBe(false);
      });
    });

    it('should return false for unknown error codes', () => {
      const result = QBOErrorClassifier.isRetryable({
        errorCode: 'UNKNOWN_ERROR',
        message: 'Unknown error',
      });

      expect(result).toBe(false);
    });

    it('should return false for non-network error messages', () => {
      const result = QBOErrorClassifier.isRetryable({
        message: 'Invalid request format',
      });

      expect(result).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should use server-suggested delay for 429 errors', () => {
      const error = new QBOApiError(
        'Rate limited',
        429,
        true,
        120, // 2 minutes
        'RATE_LIMIT',
      );

      const delay = QBOErrorClassifier.getRetryDelay(error, 1);

      expect(delay).toBe(120000); // 120 seconds in milliseconds
    });

    it('should use exponential backoff with jitter for other retryable errors', () => {
      const error = new QBOApiError('Server error', 500, true);

      const delay1 = QBOErrorClassifier.getRetryDelay(error, 1);
      const delay2 = QBOErrorClassifier.getRetryDelay(error, 2);
      const delay3 = QBOErrorClassifier.getRetryDelay(error, 3);

      // First attempt: ~1000ms with jitter
      expect(delay1).toBeGreaterThanOrEqual(800);
      expect(delay1).toBeLessThanOrEqual(1200);

      // Second attempt: ~2000ms with jitter
      expect(delay2).toBeGreaterThanOrEqual(1600);
      expect(delay2).toBeLessThanOrEqual(2400);

      // Third attempt: ~4000ms with jitter
      expect(delay3).toBeGreaterThanOrEqual(3200);
      expect(delay3).toBeLessThanOrEqual(4800);
    });

    it('should cap delay at maximum value', () => {
      const error = new QBOApiError('Server error', 500, true);

      const delay = QBOErrorClassifier.getRetryDelay(error, 10); // High attempt number

      expect(delay).toBeLessThanOrEqual(30000); // Max 30 seconds
    });

    it('should ensure minimum delay', () => {
      const error = new QBOApiError('Server error', 500, true);

      const delay = QBOErrorClassifier.getRetryDelay(error, 0);

      expect(delay).toBeGreaterThanOrEqual(100); // Minimum 100ms
    });

    it('should add jitter to prevent thundering herd', () => {
      const error = new QBOApiError('Server error', 500, true);

      const delays = [];

      for (let i = 0; i < 10; i++) {
        delays.push(QBOErrorClassifier.getRetryDelay(error, 1));
      }

      // Should have some variation due to jitter
      const uniqueDelays = new Set(delays);

      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });
});
