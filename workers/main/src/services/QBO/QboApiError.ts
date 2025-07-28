import { AxiosError } from 'axios';

import { QuickBooksRepositoryError } from '../../common/errors';
import { QBOErrorDetails } from './types';

export class QBOApiError extends QuickBooksRepositoryError {
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode?: number,
    retryable: boolean = false,
    retryAfter?: number,
    errorCode?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.errorCode = errorCode;
  }

  static fromAxiosError(error: AxiosError): QBOApiError {
    const statusCode = error.response?.status;
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'QBO API Error';
    const retryAfter = error.response?.headers?.['retry-after'];

    // Determine if error is retryable
    const retryable = QBOErrorClassifier.isRetryable({
      statusCode,
      message,
      retryable: false,
      errorCode: (error.response?.data as { errorCode?: string })?.errorCode,
    });

    return new QBOApiError(
      message,
      statusCode,
      retryable,
      retryAfter ? parseInt(retryAfter, 10) : undefined,
      (error.response?.data as { errorCode?: string })?.errorCode,
    );
  }

  toErrorDetails(): QBOErrorDetails {
    return {
      statusCode: this.statusCode,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      errorCode: this.errorCode,
      message: this.message,
    };
  }
}

// Error Classification Logic
export class QBOErrorClassifier {
  static isRetryable(error: Partial<QBOErrorDetails>): boolean {
    // 429 - Rate limit (always retryable)
    if (error.statusCode === 429) {
      return true;
    }

    // 5xx - Server errors (retryable)
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }

    // Network timeouts and connection errors
    if (
      error.message &&
      (error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('connection'))
    ) {
      return true;
    }

    // Specific QBO error codes that are retryable
    const retryableErrorCodes = [
      'AUTHENTICATION_ERROR', // Token expired, can retry after refresh
      'RATE_LIMIT_EXCEEDED',
      'SERVICE_UNAVAILABLE',
    ];

    if (error.errorCode && retryableErrorCodes.includes(error.errorCode)) {
      return true;
    }

    return false;
  }

  static getRetryDelay(error: QBOApiError, attempt: number): number {
    // Use server-suggested delay if available (for rate limiting)
    if (error.statusCode === 429 && error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, attempt),
      maxDelay,
    );

    // Add jitter (±20%) to prevent thundering herd
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);

    return Math.max(100, exponentialDelay + jitter); // Minimum 100ms
  }
}
