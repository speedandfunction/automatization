import axios from 'axios';
import axiosRetry from 'axios-retry';

import { QuickBooksRepositoryError } from '../../common/errors';
import { formatDateToISOString, generateJitter } from '../../common/utils';
import { axiosConfig } from '../../configs/axios';
import { qboConfig } from '../../configs/qbo';
import { OAuth2Manager } from '../OAuth2';
import { CustomerRevenueByRef, Invoice } from './types';

interface QBORetryError {
  response?: { status: number; headers: Record<string, string> };
  code?: string;
}

interface DateWindow {
  startDate: string;
  endDate: string;
}

interface QBOQueryResponse {
  QueryResponse: { Invoice?: Invoice[] };
}

export interface IQBORepository {
  getEffectiveRevenue(): Promise<CustomerRevenueByRef>;
}

export class QBORepository implements IQBORepository {
  private readonly tokenManager: OAuth2Manager;
  private readonly axiosInstance: ReturnType<typeof axios.create>;

  constructor() {
    this.tokenManager = new OAuth2Manager(`qbo-${qboConfig.companyId}`, {
      clientId: qboConfig.clientId!,
      clientSecret: qboConfig.clientSecret!,
      refreshToken: qboConfig.refreshToken!,
      tokenHost: qboConfig.tokenHost,
      tokenPath: qboConfig.tokenPath,
      tokenExpirationWindowSeconds: qboConfig.tokenExpirationWindowSeconds,
    });

    this.axiosInstance = axios.create({
      timeout: axiosConfig.timeout,
      headers: { ...axiosConfig.headers },
    });

    axiosRetry(this.axiosInstance, {
      retries: axiosConfig.maxRetries,
      retryDelay: (retryCount, error) =>
        this.getRetryDelay(error as QBORetryError, retryCount),
      retryCondition: (error) => this.isRetryableError(error as QBORetryError),
    });
  }

  private isRetryableError(error: QBORetryError): boolean {
    if (error.response) {
      const statusCode = error.response.status;

      if (statusCode === 429 || statusCode >= 500) return true;
    }

    return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNABORTED'].includes(
      error.code || '',
    );
  }

  private calculateRetryDelay(error: QBORetryError, attempt: number): number {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];

      if (retryAfter) return parseInt(retryAfter) * 1000;
    }
    const baseDelay = Math.pow(2, attempt) * 1000;
    const jitter = generateJitter(baseDelay);
    const maxDelay = error.response?.status === 502 ? 60000 : 30000;

    return Math.min(baseDelay + jitter, maxDelay);
  }

  private getRetryDelay(error: QBORetryError, attempt: number): number {
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
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        const invoices = response.data.QueryResponse.Invoice || [];

        if (invoices.length === 0) break;

        allInvoices.push(...invoices);
        startPosition += maxResults;
        if (invoices.length < maxResults) break;
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
        acc[customerRefId] = { customerName, totalAmount: 0, invoiceCount: 0 };
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
