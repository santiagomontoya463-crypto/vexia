import type { Sale } from "./types";
import type {
  Operation,
  OperationItem,
} from "../operations/types";

export function saleToOperation(
  sale: Sale,
): Operation {
  const items: OperationItem[] = sale.items.map(
    (item) => ({
      id: item.id,
      type: item.type,
      referenceId: item.referenceId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: item.total,
    }),
  );

  const operationStatus =
    sale.status === "cancelled"
      ? "cancelled"
      : sale.pending > 0
        ? "pending"
        : "completed";

  const paymentStatus =
    sale.status === "cancelled"
      ? "cancelled"
      : sale.paid <= 0
        ? "pending"
        : sale.pending > 0
          ? "partial"
          : "paid";

  return {
    id: `sale-operation-${sale.id}`,
    businessId: sale.businessId,
    type: "sale",
    status: operationStatus,
    customerId: sale.customerId,
    workerId: sale.workerId,
    items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    tax: sale.tax,
    total: sale.total,
    paidAmount: sale.paid,
    pendingAmount: sale.pending,
    paymentStatus,
    date: sale.date,
    createdAt: sale.date,
    updatedAt: sale.date,
    notes: sale.notes,
    createdBy: sale.createdBy,
  };
}
