export interface CustomerRevenueByRef {
  [customerRefId: string]: {
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  };
}

export interface Invoice {
  TotalAmt: number;
  Balance: number;
  CustomerRef?: {
    value: string;
    name?: string;
  };
}

export enum NetworkErrorCode {
  ECONNRESET = 'ECONNRESET',
  ETIMEDOUT = 'ETIMEDOUT',
  ENOTFOUND = 'ENOTFOUND',
  ECONNABORTED = 'ECONNABORTED',
}

export const HTTP_STATUS = {
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

export const RETRY_CONFIG = {
  DEFAULT_MAX_DELAY: 30000,
  GATEWAY_MAX_DELAY: 60000,
  RETRY_AFTER_MULTIPLIER: 1000,
} as const;

export interface QBORetryError {
  response?: { status: number; headers: Record<string, string> };
  code?: string;
}

export interface DateWindow {
  startDate: string;
  endDate: string;
}

export interface QBOQueryResponse {
  QueryResponse: { Invoice?: Invoice[] };
}

export interface IQBORepository {
  getEffectiveRevenue(): Promise<CustomerRevenueByRef>;
}
