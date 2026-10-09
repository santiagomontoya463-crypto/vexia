import type {
  Purchase,
  PurchasePayment,
} from "./types";

const PURCHASES_KEY = "vexia:purchases";
const PURCHASE_PAYMENTS_KEY = "vexia:purchase-payments";

export function loadPurchases(): Purchase[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      PURCHASES_KEY,
    );

    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchases(
  purchases: Purchase[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PURCHASES_KEY,
    JSON.stringify(purchases),
  );
}

export function loadPurchasePayments(): PurchasePayment[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      PURCHASE_PAYMENTS_KEY,
    );

    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchasePayments(
  payments: PurchasePayment[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PURCHASE_PAYMENTS_KEY,
    JSON.stringify(payments),
  );
}

export function recordPurchase(
  purchase: Purchase,
): void {
  const purchases = loadPurchases();

  const alreadyExists = purchases.some(
    (item) => item.id === purchase.id,
  );

  if (alreadyExists) {
    return;
  }

  savePurchases([
    ...purchases,
    purchase,
  ]);
}

export function recordPurchasePayment(
  payment: PurchasePayment,
): void {
  const payments = loadPurchasePayments();

  const alreadyExists = payments.some(
    (item) => item.id === payment.id,
  );

  if (alreadyExists) {
    return;
  }

  savePurchasePayments([
    ...payments,
    payment,
  ]);
}
