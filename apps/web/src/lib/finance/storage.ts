import type { FinancialMovement } from "./types";

const FINANCIAL_MOVEMENTS_KEY =
  "vexia:financial-movements";

export function loadFinancialMovements(): FinancialMovement[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      FINANCIAL_MOVEMENTS_KEY,
    );

    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFinancialMovements(
  movements: FinancialMovement[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    FINANCIAL_MOVEMENTS_KEY,
    JSON.stringify(movements),
  );
}

export function recordFinancialMovement(
  movement: FinancialMovement,
): void {
  const movements = loadFinancialMovements();

  const alreadyExists = movements.some(
    (item) => item.id === movement.id,
  );

  if (alreadyExists) {
    return;
  }

  saveFinancialMovements([
    ...movements,
    movement,
  ]);
}
