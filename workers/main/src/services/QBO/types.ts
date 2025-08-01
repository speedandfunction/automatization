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
