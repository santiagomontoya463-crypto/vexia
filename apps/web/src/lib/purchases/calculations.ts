import type {
  Purchase,
  PurchaseItem,
  PurchasePayment,
  PurchasePaymentStatus,
} from "./types";

export function calculatePurchaseItemTotal(
  item: Omit<PurchaseItem, "total">,
): number {
  const base =
    item.quantity * item.unitCost;

  const discount = Math.max(
    item.discount ?? 0,
    0,
  );

  const tax = Math.max(
    item.tax ?? 0,
    0,
  );

  return Math.max(
    base - discount + tax,
    0,
  );
}

export function calculatePurchaseSubtotal(
  items: PurchaseItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + item.quantity * item.unitCost,
    0,
  );
}

export function calculatePurchaseDiscount(
  items: PurchaseItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + Math.max(item.discount ?? 0, 0),
    0,
  );
}

export function calculatePurchaseTax(
  items: PurchaseItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + Math.max(item.tax ?? 0, 0),
    0,
  );
}

export function calculatePurchaseTotal(
  items: PurchaseItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + calculatePurchaseItemTotal(item),
    0,
  );
}

export function calculatePurchasePaidAmount(
  purchase: Purchase,
  payments: PurchasePayment[],
): number {
  return payments
    .filter(
      (payment) =>
        payment.purchaseId === purchase.id &&
        payment.status === "completed",
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );
}

export function calculatePurchasePendingAmount(
  purchase: Purchase,
  payments: PurchasePayment[],
): number {
  const paidAmount =
    calculatePurchasePaidAmount(
      purchase,
      payments,
    );

  return Math.max(
    purchase.total - paidAmount,
    0,
  );
}

export function calculatePurchasePaymentStatus(
  total: number,
  paid: number,
): PurchasePaymentStatus {
  if (total <= 0) {
    return "cancelled";
  }

  if (paid <= 0) {
    return "pending";
  }

  if (paid < total) {
    return "partial";
  }

  return "paid";
}

export function calculatePurchaseAmounts(
  items: PurchaseItem[],
) {
  const subtotal =
    calculatePurchaseSubtotal(items);

  const discount =
    calculatePurchaseDiscount(items);

  const tax =
    calculatePurchaseTax(items);

  const total =
    calculatePurchaseTotal(items);

  return {
    subtotal,
    discount,
    tax,
    total,
  };
}

export function canRegisterPurchasePayment(
  purchase: Purchase,
  amount: number,
): boolean {
  return (
    purchase.status !== "cancelled" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= purchase.pendingAmount
  );
}
