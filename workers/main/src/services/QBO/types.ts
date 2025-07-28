export interface Invoice {
  Id: string;
  TotalAmt: number;
  CustomerRef: Record<string, unknown>;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | Record<string, unknown>;
}

export interface CustomerRevenue {
  customerValue: string;
  totalAmount: number;
  invoiceCount: number;
}



export interface CustomerRevenueByRef {
  [customerRefId: string]: number; // customerRefId -> totalAmount
}

export interface CustomerRevenueObject {
  [customerValue: string]: number;
}

export interface EffectiveRevenueResult {
  total: number;
  invoices: Invoice[];
  periodStart: string;
  periodEnd: string;
}

// Enhanced Error Types for QBO API
export interface QBOErrorDetails {
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  errorCode?: string;
  message: string;
}
