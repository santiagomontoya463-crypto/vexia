import type { PaymentMethod } from "../finance";
import { loadClients, saveClients } from "../clients";
import type { Sale, SaleItem, SalePayment } from "./types";
import { calculatePendingAmount, calculateSaleTotals } from "./calculations";
import { loadSales, saveSales } from "./storage";
import { syncSaleWithFinance } from "./sync-finance";

export type QuickSaleInput = {
  customerName: string;
  workerName?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    type?: "service" | "product";
    referenceId?: string;
  }[];
  paymentMethod: PaymentMethod;
  amountReceived: number;
  notes?: string;
};

/**
 * Registra una venta completa (conceptos, pago, finanzas y visita del
 * cliente). Es el mismo camino que usa «Ventas», pensado para cobrar
 * directamente desde una cita u otro módulo.
 */
export function registerQuickSale(input: QuickSaleInput): Sale {
  if (input.items.length === 0) {
    throw new Error("Agrega al menos un concepto para cobrar.");
  }

  const saleId = crypto.randomUUID();
  const now = new Date().toISOString();

  const items: SaleItem[] = input.items.map((item) => ({
    id: crypto.randomUUID(),
    saleId,
    type: item.type ?? "service",
    referenceId: item.referenceId ?? crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: 0,
    tax: 0,
    total: item.quantity * item.unitPrice,
    workerId: input.workerName || undefined,
  }));

  const totals = calculateSaleTotals(items);

  // El crédito no genera ingreso: solo entra el dinero realmente recibido.
  const paymentAmount =
    input.paymentMethod === "credit"
      ? 0
      : Math.min(Math.max(input.amountReceived, 0), totals.total);

  const payments: SalePayment[] =
    paymentAmount > 0
      ? [
          {
            id: crypto.randomUUID(),
            saleId,
            amount: paymentAmount,
            method: input.paymentMethod,
            date: now,
          },
        ]
      : [];

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pending = calculatePendingAmount(totals.total, paid);

  const sale: Sale = {
    id: saleId,
    businessId: "current-business",
    customerId: input.customerName || undefined,
    workerId: input.workerName || undefined,
    items,
    payments,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    paid,
    pending,
    status: "confirmed",
    date: now,
    createdBy: "current-user",
    notes: input.notes,
  };

  saveSales([sale, ...loadSales()]);
  syncSaleWithFinance(sale);

  // Si el cliente existe en Clientes, se suma la visita.
  const storedClients = loadClients();

  if (storedClients && input.customerName.trim()) {
    const wanted = input.customerName.trim().toLowerCase();
    let touched = false;

    const updated = storedClients.map((client) => {
      if (touched || client.name.trim().toLowerCase() !== wanted) return client;

      touched = true;

      return {
        ...client,
        visits: client.visits + 1,
        lastVisit: new Date().toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      };
    });

    if (touched) saveClients(updated);
  }

  return sale;
}
