import axios, {AxiosError, AxiosInstance} from 'axios';
import axiosRetry from 'axios-retry';

import {qboConfig} from '../../configs/qbo';
import {IQBORepository} from './IQBORepository';
import {OAuth2TokenManager} from './OAuth2TokenManager';
import {QBOApiError, QBOErrorClassifier} from './QboApiError';
import {CustomerRevenueByRef, CustomerRevenueObject, Invoice} from './types';

export interface QBORepositoryOptions {
  baseUrl: string;
}

export class QBORepository implements IQBORepository {
  private readonly axiosInstance: AxiosInstance;
  private tokenManager: OAuth2TokenManager;

  constructor() {
    this.tokenManager = new OAuth2TokenManager();

    this.axiosInstance = axios.create({
      baseURL: qboConfig.apiUrl,
      headers: {
        'Content-Type': 'application/text',
        'Accept': 'application/json',
      },
    });

    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: (retryCount, error) => {
        const qboError = QBOApiError.fromAxiosError(error);

        return QBOErrorClassifier.getRetryDelay(qboError, retryCount);
      },
      retryCondition: (error) => {
        const qboError = QBOApiError.fromAxiosError(error);

        return QBOErrorClassifier.isRetryable(qboError.toErrorDetails());
      },
    });

    this.axiosInstance.interceptors.request.use(async (config) => {
      const accessToken = await this.tokenManager.getAccessToken();

      config.headers.Authorization = `Bearer ${accessToken}`;

      return config;
    });
  }

  async getPaidInvoices(
    periodStart: string,
    periodEnd: string,
  ): Promise<Invoice[]> {
    const query = `SELECT TotalAmt, CustomerRef FROM Invoice WHERE TxnDate >= '${periodStart}' AND TxnDate <= '${periodEnd}' AND Balance = '0'`;

    try {
      const response = await this.axiosInstance.get(
        `/v3/company/${qboConfig.companyId}/query`,
        {
          params: { query },
        },
      );
      const data = response.data as unknown;

      if (
        typeof data === 'object' &&
        data !== null &&
        'QueryResponse' in data &&
        typeof (data as { QueryResponse?: unknown }).QueryResponse ===
          'object' &&
        (data as { QueryResponse?: { Invoice?: unknown } }).QueryResponse
          ?.Invoice instanceof Array
      ) {
        return (data as { QueryResponse: { Invoice: Invoice[] } }).QueryResponse
          .Invoice;
      }

      return [];
    } catch (error) {
      const qboError = QBOApiError.fromAxiosError(error as AxiosError);

      throw new QBOApiError(
        `QBORepository.getPaidInvoices failed: ${qboError.message}`,
        qboError.statusCode,
        qboError.retryable,
        qboError.retryAfter,
        qboError.errorCode,
      );
    }
  }

  async getPaidInvoicesGroupedByCustomer(
    periodStart: string,
    periodEnd: string,
  ): Promise<CustomerRevenueObject> {
    const invoices = await this.getPaidInvoices(periodStart, periodEnd);

    console.log('invoices:', JSON.stringify(invoices, null, 2));

    return invoices.reduce((acc, invoice) => {
      const customerValue = (invoice.CustomerRef as { value?: string })?.value || 'Unknown';

      if (customerValue) {
        acc[customerValue] = (acc[customerValue] || 0) + invoice.TotalAmt || 0;
      }

      return acc;
    }, {} as CustomerRevenueObject);
  }

  async getQuarterEffectiveRevenue(): Promise<CustomerRevenueByRef> {
    const currentDate = new Date();
    const quarter = Math.floor(currentDate.getMonth() / 3);
    const periodStart = new Date(currentDate.getFullYear(), quarter * 3, 1)
      .toISOString()
      .slice(0, 10);
    const periodEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - ((currentDate.getDay() + 6) % 7) - 1,
    )
      .toISOString()
      .slice(0, 10);

    const invoices = await this.getPaidInvoices(periodStart, periodEnd);

    console.log('QBO Effective Revenue data:', JSON.stringify(invoices, null, 2));

    const customerRevenueByRef: CustomerRevenueByRef = {};

    for (const invoice of invoices) {
      const customerRef = invoice.CustomerRef as { value?: string; id?: string };
      if (!customerRef || !customerRef.id) {
        continue;
      }

      customerRevenueByRef[customerRef.id] = (customerRevenueByRef[customerRef.id] || 0) + (invoice.TotalAmt || 0);
    }

    console.log('customerRevenueByRef:', JSON.stringify(customerRevenueByRef, null, 2));

    return customerRevenueByRef;
  }

  async getEffectiveRevenue(): Promise<CustomerRevenueObject> {
    const currentDate = new Date();
    const fourMonthsAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 4,
      currentDate.getDate(),
    );

    const periodStart = fourMonthsAgo.toISOString().slice(0, 10);
    const periodEnd = currentDate.toISOString().slice(0, 10);

    const effectiveRevenue = await this.getPaidInvoicesGroupedByCustomer(periodStart, periodEnd);

    console.log('effectiveRevenue:', JSON.stringify(effectiveRevenue, null, 2));

    return effectiveRevenue;
  }
}
