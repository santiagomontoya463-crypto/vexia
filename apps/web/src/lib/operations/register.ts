import type {
  Operation,
  Payment,
  PaymentMethod,
} from "./types";

import {
  loadOperations,
  saveOperations,
  recordPayment,
} from "./storage";

import { registerIncome } from "../finance/register";

interface RegisterPaymentParams {
  operationId: string;
  amount: number;
  method: PaymentMethod;
  receivedBy?: string;
  reference?: string;
  notes?: string;
  paymentId?: string;
}

export interface RegisterPaymentResult {
  payment: Payment;
  operation: Operation;
}

function createPaymentId(operationId: string, paymentId?: string): string {
  if (paymentId) {
    return paymentId;
  }
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `payment-${crypto.randomUUID()}`;
  }

  return `payment-${operationId}-${Date.now()}`;
}

export function registerPayment(
  params: RegisterPaymentParams,
): RegisterPaymentResult {
  const operations = loadOperations();

  const operation = operations.find(
    (item) => item.id === params.operationId,
  );

  if (!operation) {
    throw new Error("La operación no existe.");
  }

  if (operation.status === "cancelled") {
    throw new Error(
      "No se puede registrar un pago sobre una operación cancelada.",
    );
  }

  if (params.method === "credit") {
    throw new Error(
      "El crédito no representa dinero recibido. Debe registrarse como cuenta por cobrar.",
    );
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error(
      "El valor del pago debe ser mayor que cero.",
    );
  }

  const pendingAmount = Math.max(
    operation.total - operation.paidAmount,
    0,
  );

  if (pendingAmount <= 0) {
    throw new Error(
      "La operación ya está completamente pagada.",
    );
  }

  if (params.amount > pendingAmount) {
    throw new Error(
      `El pago supera el saldo pendiente de ${pendingAmount}.`,
    );
  }

  const now = new Date().toISOString();

  const payment: Payment = {
    id: createPaymentId(operation.id, params.paymentId),
    businessId: operation.businessId,
    operationId: operation.id,
    amount: params.amount,
    method: params.method,
    status: "completed",
    date: now,
    customerId: operation.customerId,
    branchId: operation.branchId,
    receivedBy: params.receivedBy,
    reference: params.reference,
    notes: params.notes,
    createdAt: now,
  };

  recordPayment(payment);

  const newPaidAmount =
    operation.paidAmount + payment.amount;

  const newPendingAmount = Math.max(
    operation.total - newPaidAmount,
    0,
  );

  const newPaymentStatus =
    newPaidAmount >= operation.total
      ? "paid"
      : "partial";

  const updatedOperation: Operation = {
    ...operation,
    paidAmount: newPaidAmount,
    pendingAmount: newPendingAmount,
    paymentStatus: newPaymentStatus,
    updatedAt: now,
  };

  saveOperations(
    operations.map((item) =>
      item.id === updatedOperation.id
        ? updatedOperation
        : item,
    ),
  );

  registerIncome({
    businessId: operation.businessId,
    sourceType: "payment",
    sourceId: payment.id,
    amount: payment.amount,
    description: `Pago de operación ${operation.id}`,
    date: payment.date,
    paymentMethod: payment.method,
    customerId: payment.customerId,
    branchId: payment.branchId,
    createdBy: payment.receivedBy,
    notes: payment.notes,
  });

  return {
    payment,
    operation: updatedOperation,
  };
}
