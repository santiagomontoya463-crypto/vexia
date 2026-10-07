export type FinancialMovementType =
  | "income"
  | "expense"
  | "refund"
  | "transfer";

export type FinancialSourceType =
  | "sale"
  | "service"
  | "product"
  | "purchase"
  | "expense"
  | "payment"
  | "refund"
  | "other";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "digital_wallet"
  | "credit"
  | "other";

export type FinancialMovementStatus =
  | "pending"
  | "confirmed"
  | "cancelled";

export type AccountStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export interface FinancialMovement {
  id: string;
  businessId: string;
  type: FinancialMovementType;
  sourceType: FinancialSourceType;
  sourceId: string;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  status: FinancialMovementStatus;
  date: string;
  userId?: string;
  branchId?: string;
  category?: string;
  reference?: string;
}

export interface CashAccount {
  id: string;
  businessId: string;
  name: string;
  openingBalance: number;
  currency: string;
  active: boolean;
}

export interface CashMovement {
  id: string;
  businessId: string;
  cashAccountId: string;
  financialMovementId: string;
  direction: "in" | "out";
  amount: number;
  date: string;
  description: string;
}

export interface Receivable {
  id: string;
  businessId: string;
  customerId: string;
  sourceId: string;
  description: string;
  total: number;
  paid: number;
  dueDate?: string;
  status: AccountStatus;
}

export interface Payable {
  id: string;
  businessId: string;
  supplierId: string;
  sourceId: string;
  description: string;
  total: number;
  paid: number;
  dueDate?: string;
  status: AccountStatus;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: FinancialMovementStatus;
  userId?: string;
}

export interface FinancialPeriod {
  start: string;
  end: string;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  refunds: number;
  netResult: number;
  receivables: number;
  payables: number;
  cashBalance: number;
  marginPercent: number;
}
