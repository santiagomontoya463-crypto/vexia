import type {
  FinancialMovement,
  FinancialSourceType,
  PaymentMethod,
} from "./types";

import { recordFinancialMovement } from "./storage";

interface RegisterIncomeParams {
  businessId: string;
  sourceType: FinancialSourceType;
  sourceId: string;
  amount: number;
  description: string;
  date?: string;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  workerId?: string;
  branchId?: string;
  category?: string;
  createdBy?: string;
  notes?: string;
  status?: "pending" | "completed" | "cancelled";
}

export function registerIncome(
  params: RegisterIncomeParams,
): FinancialMovement {
  const movement: FinancialMovement = {
    id: `income-${params.sourceType}-${params.sourceId}`,
    businessId: params.businessId,

    type: "income",

    sourceType: params.sourceType,
    sourceId: params.sourceId,

    status: params.status ?? "completed",

    amount: params.amount,

    description: params.description,

    date: params.date ?? new Date().toISOString(),

    paymentMethod: params.paymentMethod,

    category: params.category,

    customerId: params.customerId,
    workerId: params.workerId,

    branchId: params.branchId,

    notes: params.notes,

    createdBy: params.createdBy,

    createdAt: new Date().toISOString(),
  };

  recordFinancialMovement(movement);

  return movement;
}

interface RegisterExpenseParams {
  businessId: string;
  sourceType: FinancialSourceType;
  sourceId: string;
  amount: number;
  description: string;
  date?: string;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  category?: string;
  createdBy?: string;
  notes?: string;
  status?: "pending" | "completed" | "cancelled";
}

export function registerExpense(
  params: RegisterExpenseParams,
): FinancialMovement {
  if (
    !Number.isFinite(params.amount) ||
    params.amount <= 0
  ) {
    throw new Error(
      "El valor del egreso debe ser mayor que cero.",
    );
  }

  const movement: FinancialMovement = {
    id: `expense-${params.sourceType}-${params.sourceId}`,
    businessId: params.businessId,

    type: "expense",

    sourceType: params.sourceType,
    sourceId: params.sourceId,

    status: params.status ?? "completed",

    amount: params.amount,

    description: params.description,

    date: params.date ?? new Date().toISOString(),

    paymentMethod: params.paymentMethod,

    category: params.category,

    branchId: params.branchId,

    notes: params.notes,

    createdBy: params.createdBy,

    createdAt: new Date().toISOString(),
  };

  recordFinancialMovement(movement);

  return movement;
}
