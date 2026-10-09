import type { PurchaseRequest } from "./types";

const STORAGE_KEY = "vexia:purchase-requests";

export function loadPurchaseRequests(): PurchaseRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as PurchaseRequest[] : [];
  } catch {
    return [];
  }
}

export function savePurchaseRequests(
  requests: PurchaseRequest[],
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(requests),
  );
}
