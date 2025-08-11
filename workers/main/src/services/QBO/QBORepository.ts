import axios from 'axios';
import axiosRetry from 'axios-retry';

import { QuickBooksRepositoryError } from '../../common/errors';
import { formatDateToISOString, generateJitter } from '../../common/utils';
import { axiosConfig } from '../../configs/axios';
import { qboConfig } from '../../configs/qbo';
import { OAuth2Manager } from '../OAuth2';
import {
  CustomerRevenueByRef,
  DateWindow,
  HTTP_STATUS,
  Invoice,
  IQBORepository,
  NetworkErrorCode,
  QBOQueryResponse,
  QBORetryError,
} from './types';

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
    return (
      this.isHttpRetryableError(error) || this.isNetworkRetryableError(error)
    );
  }

  private isHttpRetryableError(error: QBORetryError): boolean {
    if (!error.response) return false;

    const { status } = error.response;

    return (
      status === HTTP_STATUS.TOO_MANY_REQUESTS ||
      status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  private isNetworkRetryableError(error: QBORetryError): boolean {
    return Object.values(NetworkErrorCode).includes(
      error.code as NetworkErrorCode,
    );
  }

  private calculateRetryDelay(error: QBORetryError, attempt: number): number {
    const rateLimitDelay = this.getRateLimitDelay(error);

    if (rateLimitDelay > 0) return rateLimitDelay;

    const baseDelay = Math.pow(2, attempt) * 1000;
    const jitter = generateJitter(baseDelay);
    const maxDelay = this.getMaxDelay(error);

    return Math.min(baseDelay + jitter, maxDelay);
  }

  private getRateLimitDelay(error: QBORetryError): number {
    if (error.response?.status !== HTTP_STATUS.TOO_MANY_REQUESTS) return 0;

    const retryAfter = error.response.headers['retry-after'];

    return retryAfter ? parseInt(retryAfter) * 1000 : 0;
  }

  private getMaxDelay(error: QBORetryError): number {
    return error.response?.status === HTTP_STATUS.BAD_GATEWAY ? 60000 : 30000;
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
