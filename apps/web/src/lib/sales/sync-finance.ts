import type { Sale } from "./types";
import { saleToOperation } from "./to-operation";
import {
  loadOperations,
  saveOperations,
  loadPayments,
} from "../operations/storage";
import { registerPayment } from "../operations/register";

export function syncSaleWithFinance(
  sale: Sale,
): void {
  const operation = saleToOperation(sale);

  const operations = loadOperations();

  const existingOperation = operations.find(
    (item) => item.id === operation.id,
  );

  if (!existingOperation) {
    saveOperations([
      ...operations,
      {
        ...operation,
        paidAmount: 0,
        pendingAmount: operation.total,
        paymentStatus: "pending",
      },
    ]);
  }

  for (const salePayment of sale.payments) {
    if (salePayment.amount <= 0) {
      continue;
    }

    const currentOperations = loadOperations();

    const currentOperation = currentOperations.find(
      (item) => item.id === operation.id,
    );

    if (!currentOperation) {
      continue;
    }

    const existingPayments = loadPayments();

    const alreadyApplied = existingPayments.some(
      (payment) => payment.id === salePayment.id,
    );

    if (alreadyApplied) {
      continue;
    }

    try {
      registerPayment({
        operationId: operation.id,
        amount: salePayment.amount,
        method: salePayment.method,
        reference: salePayment.reference,
        paymentId: salePayment.id,
      });
    } catch {
      // No detenemos la sincronización de los demás pagos.
    }
  }
}
