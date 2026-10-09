import type { Supplier, SupplierSummary } from "./types";

export function calculateSupplierPendingBalance(
  totalPurchases: number,
  totalPaid: number,
): number {
  return Math.max(totalPurchases - totalPaid, 0);
}

export function calculateSupplierSummary(
  suppliers: Supplier[],
): SupplierSummary {
  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.status === "active").length,
    inactiveSuppliers: suppliers.filter((s) => s.status === "inactive").length,
    suppliersWithPendingBalance: suppliers.filter((s) => s.pendingBalance > 0).length,
    suppliersWithOverdueBalance: suppliers.filter((s) => s.overdueBalance > 0).length,
    totalPurchases: suppliers.reduce((sum, s) => sum + Math.max(s.totalPurchases, 0), 0),
    totalPaid: suppliers.reduce((sum, s) => sum + Math.max(s.totalPaid, 0), 0),
    totalPending: suppliers.reduce((sum, s) => sum + Math.max(s.pendingBalance, 0), 0),
    totalOverdue: suppliers.reduce((sum, s) => sum + Math.max(s.overdueBalance, 0), 0),
  };
}

export function calculateSupplierBalance(supplier: Supplier): Supplier {
  return {
    ...supplier,
    pendingBalance: calculateSupplierPendingBalance(
      supplier.totalPurchases,
      supplier.totalPaid,
    ),
  };
}
