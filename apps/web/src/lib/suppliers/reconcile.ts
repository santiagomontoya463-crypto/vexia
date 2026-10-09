import { loadPurchases, loadPurchasePayments } from "../purchases/storage";
import { loadSuppliers, saveSuppliers } from "./storage";

/**
 * Reconstruye los saldos desde compras y pagos guardados.
 * Solo considera compras pendientes/completadas y pagos confirmados.
 */
export function reconcileSupplierBalances(businessId: string): void {
  if (!businessId.trim() || typeof window === "undefined") return;

  const suppliers = loadSuppliers();
  const purchases = loadPurchases().filter(
    (purchase) =>
      purchase.businessId === businessId &&
      (purchase.status === "pending" || purchase.status === "completed") &&
      Boolean(purchase.supplierId),
  );
  const payments = loadPurchasePayments().filter(
    (payment) =>
      payment.businessId === businessId &&
      payment.status === "completed",
  );

  let changed = false;

  const reconciled = suppliers.map((supplier) => {
    if (supplier.businessId !== businessId) return supplier;

    const supplierPurchases = purchases.filter(
      (purchase) => purchase.supplierId === supplier.id,
    );
    const purchaseIds = new Set(supplierPurchases.map((purchase) => purchase.id));

    const totalPurchases = supplierPurchases.reduce(
      (sum, purchase) => sum + Math.max(Number(purchase.total) || 0, 0),
      0,
    );
    const totalPaid = payments
      .filter((payment) => purchaseIds.has(payment.purchaseId))
      .reduce((sum, payment) => sum + Math.max(Number(payment.amount) || 0, 0), 0);
    const pendingBalance = Math.max(totalPurchases - totalPaid, 0);

    if (
      supplier.totalPurchases === totalPurchases &&
      supplier.totalPaid === totalPaid &&
      supplier.pendingBalance === pendingBalance
    ) {
      return supplier;
    }

    changed = true;
    return {
      ...supplier,
      totalPurchases,
      totalPaid,
      pendingBalance,
      // No se calcula overdueBalance sin vencimientos reales.
      updatedAt: new Date().toISOString(),
    };
  });

  if (changed) saveSuppliers(reconciled);
}
