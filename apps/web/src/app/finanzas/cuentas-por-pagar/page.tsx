"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculatePurchasePaidAmount,
  calculatePurchasePaymentStatus,
  calculatePurchasePendingAmount,
} from "@/lib/purchases/calculations";
import {
  loadPurchasePayments,
  loadPurchases,
} from "@/lib/purchases/storage";
import {
  registerPurchasePayment,
  receivePurchase,
} from "@/lib/purchases/register";
import type {
  Purchase,
  PurchasePayment,
  PurchasePaymentMethod,
} from "@/lib/purchases/types";

const BUSINESS_ID = "current-business";

type FilterStatus = "all" | "pending" | "partial" | "paid";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getStatusLabel(status: Purchase["paymentStatus"]) {
  switch (status) {
    case "paid":
      return "Pagada";
    case "partial":
      return "Pago parcial";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}

function getStatusClasses(status: Purchase["paymentStatus"]) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "partial":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300";

    case "pending":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";

    case "cancelled":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getPaymentMethodLabel(method: PurchasePaymentMethod) {
  switch (method) {
    case "cash":
      return "Efectivo";
    case "card":
      return "Tarjeta";
    case "transfer":
      return "Transferencia";
    case "other":
      return "Otro";
    default:
      return method;
  }
}

export default function CuentasPorPagarPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<PurchasePayment[]>([]);

  useEffect(() => {
    setPurchases(
      loadPurchases().filter(
        (purchase) => purchase.businessId === BUSINESS_ID,
      ),
    );
    setPayments(
      loadPurchasePayments().filter(
        (payment) => payment.businessId === BUSINESS_ID,
      ),
    );
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");

  const [selectedPurchase, setSelectedPurchase] =
    useState<Purchase | null>(null);

  const [paymentPurchase, setPaymentPurchase] =
    useState<Purchase | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PurchasePaymentMethod>("transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [message, setMessage] = useState("");

  function handleReceivePurchase(purchase: Purchase) {
    if (purchase.businessId !== BUSINESS_ID || purchase.status !== "pending") {
      setMessage("Solo puedes recibir compras pendientes de este negocio.");
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmas la recepción de la compra de ${purchase.supplierName}? Esta acción actualizará las existencias del inventario.`,
    );
    if (!confirmed) return;

    try {
      const result = receivePurchase(BUSINESS_ID, purchase.id, "Usuario VEXIA");
      refreshData();
      setSelectedPurchase(result.purchase);
      setMessage(
        result.inventoryMovements.length > 0
          ? "Recepción registrada. El inventario y el costo de los productos fueron actualizados."
          : "La compra ya estaba recibida; no se duplicaron las existencias.",
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "No fue posible registrar la recepción de la compra.",
      );
    }
  }

  const purchasesWithBalances = useMemo(() => {
    return purchases.map((purchase) => {
      const paidAmount = calculatePurchasePaidAmount(
        purchase,
        payments,
      );

      const pendingAmount = calculatePurchasePendingAmount(
        purchase,
        payments,
      );

      const paymentStatus = calculatePurchasePaymentStatus(
        purchase.total,
        paidAmount,
      );

      return {
        ...purchase,
        paidAmount,
        pendingAmount,
        paymentStatus,
      };
    });
  }, [purchases, payments]);

  const filteredPurchases = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return purchasesWithBalances.filter((purchase) => {
      const matchesSearch =
        !normalizedSearch ||
        purchase.supplierName
          .toLowerCase()
          .includes(normalizedSearch) ||
        purchase.reference
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        purchase.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchasesWithBalances, search, statusFilter]);

  const metrics = useMemo(() => {
    const totalPurchased = purchasesWithBalances
      .filter((purchase) => purchase.status !== "cancelled")
      .reduce((total, purchase) => total + purchase.total, 0);

    const totalPaid = purchasesWithBalances
      .filter((purchase) => purchase.status !== "cancelled")
      .reduce((total, purchase) => total + purchase.paidAmount, 0);

    const totalPending = purchasesWithBalances
      .filter((purchase) => purchase.status !== "cancelled")
      .reduce((total, purchase) => total + purchase.pendingAmount, 0);

    const pendingDocuments = purchasesWithBalances.filter(
      (purchase) =>
        purchase.status !== "cancelled" &&
        purchase.pendingAmount > 0,
    ).length;

    return {
      totalPurchased,
      totalPaid,
      totalPending,
      pendingDocuments,
    };
  }, [purchasesWithBalances]);

  function refreshData() {
    setPurchases(
      loadPurchases().filter(
        (purchase) => purchase.businessId === BUSINESS_ID,
      ),
    );

    setPayments(
      loadPurchasePayments().filter(
        (payment) => payment.businessId === BUSINESS_ID,
      ),
    );
  }

  function openPaymentModal(purchase: Purchase) {
    setPaymentPurchase(purchase);
    setPaymentAmount(
      purchase.pendingAmount > 0
        ? String(purchase.pendingAmount)
        : "",
    );
    setPaymentMethod("transfer");
    setPaymentReference("");
    setPaymentNotes("");
    setMessage("");
  }

  async function handleRegisterPayment() {
    if (!paymentPurchase) return;

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Ingresa un valor de pago válido.");
      return;
    }

    if (amount > paymentPurchase.pendingAmount) {
      setMessage(
        "El pago no puede ser superior al saldo pendiente.",
      );
      return;
    }

    setSavingPayment(true);
    setMessage("");

    try {
      const paymentId = `purchase-payment-${paymentPurchase.id}-${Date.now()}`;

      registerPurchasePayment({
        businessId: BUSINESS_ID,
        purchaseId: paymentPurchase.id,
        paymentId,
        amount,
        method: paymentMethod,
        date: new Date().toISOString(),
        supplierId: paymentPurchase.supplierId,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        receivedBy: "current-user",
      });

      refreshData();

      setPaymentPurchase(null);
      setSelectedPurchase(null);

      setMessage("Pago registrado correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el pago.",
      );
    } finally {
      setSavingPayment(false);
    }
  }

  function getPurchasePayments(purchaseId: string) {
    return payments
      .filter((payment) => payment.purchaseId === purchaseId)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Finanzas
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Cuentas por pagar
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Controla las compras pendientes de pago,
              abonos realizados y saldos pendientes con tus
              proveedores.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshData}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Actualizar
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
            {message}
          </div>
        )}

        {/* Metrics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compras registradas
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(metrics.totalPurchased)}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Valor total de las compras
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pagado
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalPaid)}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Pagos registrados
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pendiente
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(metrics.totalPending)}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Saldo por pagar
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Documentos pendientes
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.pendingDocuments}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Compras con saldo pendiente
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar proveedor o referencia..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as FilterStatus,
                )
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="partial">Pago parcial</option>
              <option value="paid">Pagadas</option>
            </select>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="font-semibold">
              Compras y saldos
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filteredPurchases.length} registro
              {filteredPurchases.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl dark:bg-gray-800">
                $
              </div>

              <h3 className="font-semibold">
                No hay cuentas por pagar
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Cuando registres compras a proveedores,
                aparecerán aquí sus valores pagados y
                pendientes.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Proveedor
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Fecha
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Total
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Pagado
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Pendiente
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Estado
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPurchases.map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="transition hover:bg-gray-50 dark:hover:bg-gray-950/50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold">
                            {purchase.supplierName}
                          </div>

                          {purchase.reference && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              Ref. {purchase.reference}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                          {formatDate(purchase.date)}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatCurrency(purchase.total)}
                        </td>

                        <td className="px-5 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(
                            purchase.paidAmount,
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium text-orange-600 dark:text-orange-400">
                          {formatCurrency(
                            purchase.pendingAmount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              purchase.paymentStatus,
                            )}`}
                          >
                            {getStatusLabel(
                              purchase.paymentStatus,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPurchase(
                                  purchase,
                                )
                              }
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              Ver
                            </button>

                            {purchase.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleReceivePurchase(purchase)}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Registrar recepción
                              </button>
                            )}

                            {purchase.pendingAmount > 0 &&
                              purchase.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(purchase)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                  Registrar pago
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
                {filteredPurchases.map((purchase) => (
                  <div key={purchase.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {purchase.supplierName}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(purchase.date)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          purchase.paymentStatus,
                        )}`}
                      >
                        {getStatusLabel(
                          purchase.paymentStatus,
                        )}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Total
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatCurrency(purchase.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Pendiente
                        </p>

                        <p className="mt-1 font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(
                            purchase.pendingAmount,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPurchase(purchase)
                        }
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"
                      >
                        Ver detalle
                      </button>

                      {purchase.pendingAmount > 0 &&
                        purchase.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() =>
                              openPaymentModal(purchase)
                            }
                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Registrar pago
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Detail modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold">
                  Detalle de la compra
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedPurchase.supplierName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Total
                  </p>

                  <p className="mt-1 font-semibold">
                    {formatCurrency(
                      selectedPurchase.total,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Pagado
                  </p>

                  <p className="mt-1 font-semibold text-emerald-600">
                    {formatCurrency(
                      selectedPurchase.paidAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Pendiente
                  </p>

                  <p className="mt-1 font-semibold text-orange-600">
                    {formatCurrency(
                      selectedPurchase.pendingAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Fecha
                  </p>

                  <p className="mt-1 font-semibold">
                    {formatDate(selectedPurchase.date)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">
                  Productos
                </h3>

                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  {selectedPurchase.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 p-3 last:border-b-0 dark:border-gray-800"
                    >
                      <div>
                        <p className="font-medium">
                          {item.productName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.quantity} ×{" "}
                          {formatCurrency(item.unitCost)}
                        </p>
                      </div>

                      <p className="font-semibold">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">
                  Historial de pagos
                </h3>

                {getPurchasePayments(
                  selectedPurchase.id,
                ).length === 0 ? (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-950">
                    No hay pagos registrados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getPurchasePayments(
                      selectedPurchase.id,
                    ).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>

                          <p className="text-xs text-gray-500">
                            {getPaymentMethodLabel(
                              payment.method,
                            )}{" "}
                            · {formatDate(payment.date)}
                          </p>

                          {payment.reference && (
                            <p className="mt-1 text-xs text-gray-500">
                              Ref. {payment.reference}
                            </p>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-emerald-600">
                          Completado
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPurchase.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleReceivePurchase(selectedPurchase)}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                >
                  Registrar recepción y actualizar inventario
                </button>
              )}

              {selectedPurchase.pendingAmount > 0 &&
                selectedPurchase.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      openPaymentModal(selectedPurchase);
                      setSelectedPurchase(null);
                    }}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Registrar pago
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {paymentPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold">
                  Registrar pago
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {paymentPurchase.supplierName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPaymentPurchase(null)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-950">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Saldo pendiente
                  </span>

                  <span className="font-bold text-orange-600">
                    {formatCurrency(
                      paymentPurchase.pendingAmount,
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Valor del pago
                </label>

                <input
                  type="number"
                  min="1"
                  max={paymentPurchase.pendingAmount}
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Método de pago
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value as PurchasePaymentMethod,
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">
                    Transferencia
                  </option>
                  <option value="card">Tarjeta</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Referencia
                </label>

                <input
                  type="text"
                  value={paymentReference}
                  onChange={(event) =>
                    setPaymentReference(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
                  placeholder="Número de comprobante..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Notas
                </label>

                <textarea
                  value={paymentNotes}
                  onChange={(event) =>
                    setPaymentNotes(event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
                  placeholder="Información adicional..."
                />
              </div>

              {message && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentPurchase(null)}
                  disabled={savingPayment}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleRegisterPayment}
                  disabled={savingPayment}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPayment
                    ? "Registrando..."
                    : "Registrar pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}