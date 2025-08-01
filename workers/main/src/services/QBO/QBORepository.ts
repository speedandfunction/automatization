import axios from 'axios';
import axiosRetry from 'axios-retry';

import { QuickBooksRepositoryError } from '../../common/errors';
import { formatDateToISOString } from '../../common/utils';
import { axiosConfig } from '../../configs/axios';
import { qboConfig } from '../../configs/qbo';
import { OAuth2TokenManager } from '../OAuth2/OAuth2TokenManager';
import { CustomerRevenueByRef, Invoice } from './types';

interface QBOQueryResponse {
  QueryResponse: {
    Invoice?: Invoice[];
  };
}

export interface IQBORepository {
  getEffectiveRevenue(): Promise<CustomerRevenueByRef>;
}

interface DateWindow {
  startDate: string;
  endDate: string;
}

export class QBORepository implements IQBORepository {
  private readonly tokenManager: OAuth2TokenManager;
  private readonly axiosInstance: ReturnType<typeof axios.create>;

  constructor() {
    this.tokenManager = new OAuth2TokenManager(
      `qbo-${qboConfig.companyId}`,
      qboConfig.refreshToken,
    );

    this.axiosInstance = axios.create({
      timeout: axiosConfig.timeout,
      headers: {
        ...axiosConfig.headers,
      },
    });

    axiosRetry(this.axiosInstance, {
      retries: axiosConfig.maxRetries,
      retryDelay: (retryCount, error) => this.getRetryDelay(error, retryCount),
      retryCondition: (error) => this.isRetryableError(error),
    });
  }

  private isRetryableError(error: any): boolean {
    if (error.response) {
      const statusCode = error.response.status;

      // Rate limiting errors (retryable)
      if (statusCode === 429) {
        return true;
      }

      // Server errors (retryable) - including 502 Bad Gateway
      if (statusCode >= 500) {
        return true;
      }
    }

    // Network errors (retryable)
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      return true;
    }

    // Axios timeout errors (retryable)
    if (error.code === 'ECONNABORTED') {
      return true;
    }

    return false;
  }

  private calculateRetryDelay(error: any, attempt: number): number {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];

      if (retryAfter) {
        return parseInt(retryAfter) * 1000;
      }
    }

    // Enhanced exponential backoff with jitter
    const baseDelay = Math.pow(2, attempt) * 1000; // 2^attempt * 1000ms
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter

    // Special handling for 502 errors - longer delays
    if (error.response?.status === 502) {
      const extendedDelay = baseDelay * 1.5; // 50% longer delay for 502 errors

      return Math.min(extendedDelay + jitter, 60000); // Max 60 seconds for 502
    }

    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds for other errors
  }

  private getRetryDelay(error: any, attempt: number): number {
    return this.calculateRetryDelay(error, attempt);
  }

  private async getPaidInvoices(): Promise<Invoice[]> {
    try {
      const accessToken = await this.tokenManager.getAccessToken();
      const { startDate, endDate } = this.calculateDateWindow();
      const allInvoices: Invoice[] = [];
      let startPosition = 1;
      const maxResults = 100;

      while (true) {
        const query = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' AND Balance = '0' STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

        const response = await this.axiosInstance.get<QBOQueryResponse>(
          `${qboConfig.apiUrl}/v3/company/${qboConfig.companyId}/query`,
          {
            params: { query },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const invoices = response.data.QueryResponse.Invoice || [];

        if (invoices.length === 0) {
          break;
        }

        allInvoices.push(...invoices);
        startPosition += maxResults;

        if (invoices.length < maxResults) {
          break;
        }
      }

      return allInvoices;
    } catch (error) {
      throw new QuickBooksRepositoryError(
        `QBORepository.getPaidInvoices failed: ${(error as Error).message}`,
      );
    }
  }

  private aggregateInvoices(invoices: Invoice[]): CustomerRevenueByRef {
    return invoices.reduce((acc, invoice) => {
      const customerRefId = invoice.CustomerRef?.value || 'unknown';
      const customerName = invoice.CustomerRef?.name || 'Unknown';

      if (!acc[customerRefId]) {
        acc[customerRefId] = {
          customerName,
          totalAmount: 0,
          invoiceCount: 0,
        };
      }

      acc[customerRefId].totalAmount += invoice.TotalAmt;
      acc[customerRefId].invoiceCount += 1;

      return acc;
    }, {} as CustomerRevenueByRef);
  }

  private calculateDateWindow(): DateWindow {
    const endDate = new Date();
    const startDate = new Date(endDate);

    startDate.setMonth(endDate.getMonth() - qboConfig.effectiveRevenueMonths);

    return {
      startDate: formatDateToISOString(startDate),
      endDate: formatDateToISOString(endDate),
    };
  }

  async getEffectiveRevenue(): Promise<CustomerRevenueByRef> {
    try {
      const invoices = await this.getPaidInvoices();

      return this.aggregateInvoices(invoices);
    } catch (error) {
      throw new QuickBooksRepositoryError(
        `QBORepository.getEffectiveRevenue failed: ${(error as Error).message}`,
      );
    }
  }
}
