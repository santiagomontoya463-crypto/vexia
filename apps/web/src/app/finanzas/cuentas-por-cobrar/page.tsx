"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type {
  Operation,
  Payment,
  PaymentMethod,
} from "../../../lib/operations";

import {
  loadOperations,
  loadPayments,
} from "../../../lib/operations";

import {
  registerPayment,
} from "../../../lib/operations/register";

import type {
  Sale,
  SalePayment,
} from "../../../lib/sales";

import {
  loadSales,
  saveSales,
} from "../../../lib/sales/storage";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const paymentLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  bank_transfer: "Transferencia",
  digital_wallet: "Billetera digital",
  other: "Otro",
};

function normalizePaymentMethod(
  method: string,
): PaymentMethod {
  if (method === "cash") return "cash";
  if (method === "card") return "card";

  if (
    method === "transfer" ||
    method === "bank_transfer" ||
    method === "digital_wallet"
  ) {
    return "transfer";
  }

  return "other";
}

function getSaleIdFromOperation(
  operationId: string,
): string | null {
  const prefix = "sale-operation-";

  if (!operationId.startsWith(prefix)) {
    return null;
  }

  return operationId.slice(prefix.length);
}

export default function CuentasPorCobrarPage() {
  const [operations, setOperations] =
    useState<Operation[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [selectedOperation, setSelectedOperation] =
    useState<Operation | null>(null);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<SalePayment["method"]>("cash");

  const [paymentReference, setPaymentReference] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function reloadData() {
    setOperations(loadOperations());
    setPayments(loadPayments());
    setSales(loadSales());
  }

  useEffect(() => {
    reloadData();
  }, []);

  const receivables = useMemo(() => {
    return operations
      .filter(
        (operation) =>
          operation.type === "sale" &&
          operation.status !== "cancelled" &&
          operation.pendingAmount > 0,
      )
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime(),
      );
  }, [operations]);

  const summary = useMemo(() => {
    const pending = receivables.reduce(
      (total, operation) =>
        total + Math.max(operation.pendingAmount, 0),
      0,
    );

    const totalOriginal = receivables.reduce(
      (total, operation) =>
        total + operation.total,
      0,
    );

    const totalPaid = receivables.reduce(
      (total, operation) =>
        total + operation.paidAmount,
      0,
    );

    return {
      accounts: receivables.length,
      pending,
      totalOriginal,
      totalPaid,
    };
  }, [receivables]);

  function getOperationPayments(
    operationId: string,
  ) {
    return payments
      .filter(
        (payment) =>
          payment.operationId ===
            operationId &&
          payment.status === "completed",
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      );
  }

  function openPayment(
    operation: Operation,
  ) {
    setSelectedOperation(operation);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentReference("");
    setError("");
    setSuccess("");
  }

  function closePayment() {
    setSelectedOperation(null);
    setPaymentAmount("");
    setPaymentReference("");
    setError("");
  }

  function registerAbono() {
    if (!selectedOperation) {
      return;
    }

    setError("");
    setSuccess("");

    const amount = Number(
      paymentAmount,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Ingresa un valor de abono mayor que $0.",
      );
      return;
    }

    if (
      amount >
      selectedOperation.pendingAmount
    ) {
      setError(
        `El abono no puede superar el saldo pendiente de ${formatMoney(
          selectedOperation.pendingAmount,
        )}.`,
      );
      return;
    }

    try {
      const normalizedMethod =
        normalizePaymentMethod(
          paymentMethod,
        );

      const result =
        registerPayment({
          operationId:
            selectedOperation.id,
          amount,
          method:
            normalizedMethod,
          reference:
            paymentReference.trim() ||
            undefined,
          notes:
            "Abono registrado desde Cuentas por cobrar.",
          receivedBy:
            "current-user",
        });

      const saleId =
        getSaleIdFromOperation(
          selectedOperation.id,
        );

      if (saleId) {
        const currentSales =
          loadSales();

        const sale =
          currentSales.find(
            (item) =>
              item.id === saleId,
          );

        if (sale) {
          const salePayment: SalePayment = {
            id:
              result.payment.id,
            saleId: sale.id,
            amount,
            method:
              paymentMethod,
            date:
              result.payment.date,
            reference:
              paymentReference.trim() ||
              undefined,
          };

          const updatedPaid =
            sale.paid + amount;

          const updatedPending =
            Math.max(
              sale.total -
                updatedPaid,
              0,
            );

          const updatedSale: Sale = {
            ...sale,
            payments: [
              ...sale.payments,
              salePayment,
            ],
            paid:
              updatedPaid,
            pending:
              updatedPending,
          };

          saveSales(
            currentSales.map(
              (item) =>
                item.id === sale.id
                  ? updatedSale
                  : item,
            ),
          );
        }
      }

      setSuccess(
        `Abono de ${formatMoney(
          amount,
        )} registrado correctamente.`,
      );

      setPaymentAmount("");
      setPaymentReference("");

      reloadData();

      const updatedOperations =
        loadOperations();

      const updatedOperation =
        updatedOperations.find(
          (operation) =>
            operation.id ===
            selectedOperation.id,
        );

      if (
        updatedOperation &&
        updatedOperation.pendingAmount >
          0
      ) {
        setSelectedOperation(
          updatedOperation,
        );
      } else {
        setSelectedOperation(null);
      }
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "No fue posible registrar el abono.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/finanzas"
              className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              ← Volver a Finanzas
            </Link>

            <p className="mt-3 text-sm font-medium text-sky-600 dark:text-sky-400">
              VEXIA · Finanzas
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cuentas por cobrar
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Controla el dinero que tus clientes aún
              deben pagar y registra sus abonos sin
              duplicar ventas ni ingresos.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">

          <MetricCard
            title="Total por cobrar"
            value={formatMoney(
              summary.pending,
            )}
            description="Dinero pendiente de recibir"
            tone="warning"
          />

          <MetricCard
            title="Cuentas pendientes"
            value={String(
              summary.accounts,
            )}
            description="Operaciones con saldo pendiente"
            tone="neutral"
          />

          <MetricCard
            title="Ya recibido"
            value={formatMoney(
              summary.totalPaid,
            )}
            description="Pagos recibidos de estas operaciones"
            tone="positive"
          />

        </section>

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Clientes con saldo pendiente
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cada registro corresponde a una operación
              existente en VEXIA.
            </p>
          </div>

          {receivables.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-600 dark:bg-green-950/30 dark:text-green-400">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                No hay cuentas por cobrar
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Cuando una venta tenga un saldo pendiente,
                aparecerá automáticamente en esta sección.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">

              {receivables.map(
                (operation) => {
                  const operationPayments =
                    getOperationPayments(
                      operation.id,
                    );

                  const sale =
                    sales.find(
                      (item) =>
                        item.id ===
                        getSaleIdFromOperation(
                          operation.id,
                        ),
                    );

                  const customerName =
                    sale?.customerId ||
                    operation.customerId ||
                    "Cliente sin identificar";

                  const percentage =
                    operation.total > 0
                      ? Math.min(
                          (operation.paidAmount /
                            operation.total) *
                            100,
                          100,
                        )
                      : 0;

                  return (
                    <article
                      key={operation.id}
                      className="p-5"
                    >

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {customerName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Venta #
                            {getSaleIdFromOperation(
                              operation.id,
                            )
                              ?.slice(0, 8)
                              .toUpperCase() ||
                              operation.id
                                .slice(0, 8)
                                .toUpperCase()}
                            {" · "}
                            {new Date(
                              operation.date,
                            ).toLocaleString(
                              "es-CO",
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openPayment(
                                operation,
                              )
                            }
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
                          >
                            Registrar abono
                          </button>
                        </div>

                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">

                        <AmountCard
                          label="Total venta"
                          value={formatMoney(
                            operation.total,
                          )}
                        />

                        <AmountCard
                          label="Pagado"
                          value={formatMoney(
                            operation.paidAmount,
                          )}
                          positive
                        />

                        <AmountCard
                          label="Pendiente"
                          value={formatMoney(
                            operation.pendingAmount,
                          )}
                          warning
                        />

                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            Progreso de pago
                          </span>

                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {Math.round(
                              percentage,
                            )}
                            %
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      {operationPayments.length >
                        0 && (
                        <details className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800">
                          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Ver historial de pagos (
                            {
                              operationPayments.length
                            }
                            )
                          </summary>

                          <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                            {operationPayments.map(
                              (payment) => (
                                <div
                                  key={
                                    payment.id
                                  }
                                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      {formatMoney(
                                        payment.amount,
                                      )}
                                    </p>

                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(
                                        payment.date,
                                      ).toLocaleString(
                                        "es-CO",
                                      )}
                                    </p>
                                  </div>

                                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                                    {paymentLabels[
                                      payment.method
                                    ] ||
                                      payment.method}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </details>
                      )}

                    </article>
                  );
                },
              )}

            </div>
          )}

        </section>

        {selectedOperation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
                    Registrar pago
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    Nuevo abono
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Total de la venta
                  </span>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(
                      selectedOperation.total,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Ya pagado
                  </span>

                  <span className="font-semibold text-green-600">
                    {formatMoney(
                      selectedOperation.paidAmount,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Saldo pendiente
                  </span>

                  <span className="font-bold text-amber-600">
                    {formatMoney(
                      selectedOperation.pendingAmount,
                    )}
                  </span>
                </div>

              </div>

              <div className="mt-5 space-y-4">

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Valor del abono
                  </span>

                  <input
                    type="number"
                    min="1"
                    max={
                      selectedOperation.pendingAmount
                    }
                    value={
                      paymentAmount
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentAmount(
                        event.target.value,
                      )
                    }
                    placeholder="0"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Método de pago
                  </span>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentMethod(
                        event.target
                          .value as SalePayment["method"],
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="cash">
                      Efectivo
                    </option>

                    <option value="card">
                      Tarjeta
                    </option>

                    <option value="bank_transfer">
                      Transferencia
                    </option>

                    <option value="digital_wallet">
                      Billetera digital
                    </option>

                    <option value="other">
                      Otro
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Referencia
                  </span>

                  <input
                    value={
                      paymentReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentReference(
                        event.target.value,
                      )
                    }
                    placeholder="Opcional"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>

              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closePayment
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    registerAbono
                  }
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
                >
                  Registrar abono
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone:
    | "positive"
    | "warning"
    | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-600 dark:text-green-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-900 dark:text-white";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${toneClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {description}
      </p>

    </article>
  );
}

function AmountCard({
  label,
  value,
  positive,
  warning,
}: {
  label: string;
  value: string;
  positive?: boolean;
  warning?: boolean;
}) {
  const valueClass =
    warning
      ? "text-amber-600 dark:text-amber-400"
      : positive
        ? "text-green-600 dark:text-green-400"
        : "text-slate-900 dark:text-white";

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">

      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}