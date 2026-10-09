import type { Operation, Payment } from "./types";

const OPERATIONS_KEY = "vexia:operations";
const PAYMENTS_KEY = "vexia:payments";

export function loadOperations(): Operation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OPERATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOperations(
  operations: Operation[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    OPERATIONS_KEY,
    JSON.stringify(operations),
  );
}

export function loadPayments(): Payment[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePayments(
  payments: Payment[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PAYMENTS_KEY,
    JSON.stringify(payments),
  );
}

export function recordOperation(
  operation: Operation,
): void {
  const operations = loadOperations();

  if (
    operations.some(
      (item) => item.id === operation.id,
    )
  ) {
    return;
  }

  saveOperations([
    ...operations,
    operation,
  ]);
}

export function recordPayment(
  payment: Payment,
): void {
  const payments = loadPayments();

  if (
    payments.some(
      (item) => item.id === payment.id,
    )
  ) {
    return;
  }

  savePayments([
    ...payments,
    payment,
  ]);
}
