export type FinancialMovementType =
  | "income"
  | "expense"
  | "refund"
  | "transfer"
  | "adjustment";

export type FinancialSourceType =
  | "sale"
  | "service"
  | "work_order"
  | "purchase"
  | "expense"
  | "payment"
  | "refund"
  | "delivery"
  | "payroll"
  | "credit"
  | "other";

export type FinancialMovementStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "credit"
  | "other";

export interface FinancialMovement {
  id: string;

  businessId: string;

  type: FinancialMovementType;

  sourceType: FinancialSourceType;
  sourceId?: string;

  status: FinancialMovementStatus;

  amount: number;

  description: string;

  date: string;

  paymentMethod?: PaymentMethod;

  category?: string;

  customerId?: string;
  workerId?: string;

  branchId?: string;

  notes?: string;

  createdBy?: string;

  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  totalRefunds: number;
  netResult: number;
}
