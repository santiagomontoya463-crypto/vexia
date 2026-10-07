import type { Sale } from "./types";

const SALES_KEY = "vexia:sales";

export function loadSales(): Sale[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSales(sales: Sale[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SALES_KEY,
    JSON.stringify(sales),
  );
}
