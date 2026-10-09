import type {
  FinancialMovement,
  FinancialSummary,
} from "./types";

export function calculateFinancialSummary(
  movements: FinancialMovement[],
): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalRefunds = 0;

  for (const movement of movements) {
    if (movement.status !== "completed") {
      continue;
    }

    if (movement.type === "income") {
      totalIncome += movement.amount;
    }

    if (movement.type === "expense") {
      totalExpense += movement.amount;
    }

    if (movement.type === "refund") {
      totalRefunds += movement.amount;
    }
  }

  return {
    totalIncome,
    totalExpense,
    totalRefunds,
    netResult:
      totalIncome -
      totalExpense -
      totalRefunds,
  };
}
