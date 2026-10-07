import type {
  CashMovement,
  FinancialMovement,
  FinancialPeriod,
  FinancialSummary,
  Payable,
  Receivable,
} from "./types";

export function isWithinPeriod(
  date: string,
  period: FinancialPeriod,
): boolean {
  const value = new Date(date).getTime();
  const start = new Date(period.start).getTime();
  const end = new Date(period.end).getTime();

  return value >= start && value <= end;
}

export function calculateFinancialSummary(
  movements: FinancialMovement[],
  cashMovements: CashMovement[],
  receivables: Receivable[],
  payables: Payable[],
  period: FinancialPeriod,
  openingCash = 0,
): FinancialSummary {
  const periodMovements = movements.filter((movement) =>
    isWithinPeriod(movement.date, period),
  );

  const confirmed = periodMovements.filter(
    (movement) => movement.status === "confirmed",
  );

  const income = confirmed
    .filter((movement) => movement.type === "income")
    .reduce((total, movement) => total + movement.amount, 0);

  const expenses = confirmed
    .filter((movement) => movement.type === "expense")
    .reduce((total, movement) => total + movement.amount, 0);

  const refunds = confirmed
    .filter((movement) => movement.type === "refund")
    .reduce((total, movement) => total + movement.amount, 0);

  const netResult = income - expenses - refunds;

  const periodCash = cashMovements
    .filter((movement) => isWithinPeriod(movement.date, period))
    .reduce(
      (balance, movement) =>
        movement.direction === "in"
          ? balance + movement.amount
          : balance - movement.amount,
      openingCash,
    );

  const pendingReceivables = receivables
    .filter((item) => item.status !== "cancelled")
    .reduce((total, item) => total + Math.max(item.total - item.paid, 0), 0);

  const pendingPayables = payables
    .filter((item) => item.status !== "cancelled")
    .reduce((total, item) => total + Math.max(item.total - item.paid, 0), 0);

  const marginPercent = income > 0 ? (netResult / income) * 100 : 0;

  return {
    income,
    expenses,
    refunds,
    netResult,
    receivables: pendingReceivables,
    payables: pendingPayables,
    cashBalance: periodCash,
    marginPercent,
  };
}

export function calculateExpectedCashBalance(
  openingBalance: number,
  movements: CashMovement[],
): number {
  return movements.reduce(
    (balance, movement) =>
      movement.direction === "in"
        ? balance + movement.amount
        : balance - movement.amount,
    openingBalance,
  );
}

export function calculatePendingAmount(total: number, paid: number): number {
  return Math.max(total - paid, 0);
}

export function calculatePercentage(
  value: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
