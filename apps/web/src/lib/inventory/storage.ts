import type { InventoryMovement, Product } from "./types";

const PRODUCTS_KEY = "vexia:products";
const MOVEMENTS_KEY = "vexia:inventory-movements";

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PRODUCTS_KEY,
    JSON.stringify(products),
  );
}

export function loadInventoryMovements(): InventoryMovement[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(MOVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInventoryMovements(
  movements: InventoryMovement[],
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    MOVEMENTS_KEY,
    JSON.stringify(movements),
  );
}

export function recordInventoryMovement(
  movement: InventoryMovement,
): void {
  const movements = loadInventoryMovements();

  saveInventoryMovements([
    ...movements,
    movement,
  ]);
}
