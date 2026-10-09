import type {
  Operation,
  OperationItem,
  Payment,
} from "./types";

export function calculateItemTotal(
  item: Omit<OperationItem, "total">,
): number {
  const base =
    item.quantity * item.unitPrice;

  const discount = item.discount ?? 0;

  return Math.max(
    0,
    base - discount,
  );
}

export function calculateOperationSubtotal(
  items: OperationItem[],
): number {
  return items.reduce(
    (total, item) => total + item.total,
    0,
  );
}

export function calculateOperationPending(
  operation: Operation,
  payments: Payment[],
): number {
  const paid = payments
    .filter(
      (payment) =>
        payment.operationId === operation.id &&
        payment.status === "completed",
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  return Math.max(
    0,
    operation.total - paid,
  );
}

export function calculatePaymentStatus(
  total: number,
  paid: number,
): Operation["paymentStatus"] {
  if (paid <= 0) {
    return "pending";
  }

  if (paid < total) {
    return "partial";
  }

  return "paid";
}
