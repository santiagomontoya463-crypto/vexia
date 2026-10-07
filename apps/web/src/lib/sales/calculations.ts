import type { SaleItem } from "./types";

export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  discount = 0,
  tax = 0,
): number {
  const base = quantity * unitPrice;
  const discounted = Math.max(base - discount, 0);
  return discounted + tax;
}

export function calculateSaleTotals(items: SaleItem[]) {
  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const discount = items.reduce(
    (total, item) => total + item.discount,
    0,
  );

  const tax = items.reduce(
    (total, item) => total + item.tax,
    0,
  );

  const total = Math.max(subtotal - discount + tax, 0);

  return {
    subtotal,
    discount,
    tax,
    total,
  };
}

export function calculatePaidAmount(
  payments: { amount: number }[],
): number {
  return payments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );
}

export function calculatePendingAmount(
  total: number,
  paid: number,
): number {
  return Math.max(total - paid, 0);
}
