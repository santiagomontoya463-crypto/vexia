"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  calculateFinancialSummary,
  loadFinancialMovements,
} from "../../lib/finance";

import type {
  FinancialMovement,
  FinancialMovementType,
  FinancialMovementStatus,
} from "../../lib/finance";

import {
  calculateOperationPending,
  loadOperations,
  loadPayments,
} from "../../lib/operations";

import type {
  Operation,
  Payment,
} from "../../lib/operations";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

type PeriodType =
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

type ChartPoint = {
  label: string;
  income: number;
  expense: number;
  net: number;
  sortValue: number;
};

function getPeriodRange(
  period: PeriodType,
  customStart: string,
  customEnd: string,
) {
  const now = new Date();

  if (period === "custom") {
    const start = customStart
      ? new Date(`${customStart}T00:00:00`)
      : new Date(0);

    const end = customEnd
      ? new Date(`${customEnd}T23:59:59.999`)
      : new Date();

    return { start, end };
  }

  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() + diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (period === "quarter") {
    const quarterStartMonth =
      Math.floor(now.getMonth() / 3) * 3;

    const start = new Date(
      now.getFullYear(),
      quarterStartMonth,
      1,
      0,
      0,
      0,
      0,
    );

    const end = new Date(
      now.getFullYear(),
      quarterStartMonth + 3,
      0,
      23,
      59,
      59,
      999,
    );

    return { start, end };
  }

  if (period === "year") {
    const start = new Date(
      now.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0,
    );

    const end = new Date(
      now.getFullYear(),
      11,
      31,
      23,
      59,
      59,
      999,
    );

    return { start, end };
  }

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

function isMovementInsidePeriod(
  movement: FinancialMovement,
  range: { start: Date; end: Date },
) {
  const date = new Date(movement.date);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date >= range.start && date <= range.end;
}

function getSourceLabel(sourceType: string) {
  const labels: Record<string, string> = {
    sale: "Ventas",
    service: "Servicios",
    work_order: "Órdenes de trabajo",
    purchase: "Compras",
    expense: "Gastos",
    payment: "Pagos",
    refund: "Devoluciones",
    delivery: "Entregas",
    payroll: "Nómina",
    other: "Otros",
  };

  return labels[sourceType] ?? "Otros";
}

function getPaymentMethodLabel(
  paymentMethod?: string,
) {
  const labels: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    bank_transfer: "Transferencia",
    digital_wallet: "Billetera digital",
    credit: "Crédito",
    other: "Otro",
  };

  if (!paymentMethod) {
    return "—";
  }

  return labels[paymentMethod] ?? paymentMethod;
}

function getMovementTypeLabel(
  type: FinancialMovementType,
) {
  const labels: Record<
    FinancialMovementType,
    string
  > = {
    income: "Ingreso",
    expense: "Egreso",
    refund: "Devolución",
    transfer: "Transferencia",
    adjustment: "Ajuste",
  };

  return labels[type];
}

function getMovementStatusLabel(
  status: FinancialMovementStatus,
) {
  const labels: Record<
    FinancialMovementStatus,
    string
  > = {
    pending: "Pendiente",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return labels[status];
}

function getMovementStatusClasses(
  status: FinancialMovementStatus,
) {
  if (status === "completed") {
    return "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400";
  }

  if (status === "pending") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  }

  return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";
}

function getMovementValueClasses(
  movement: FinancialMovement,
) {
  if (movement.type === "income") {
    return "text-green-600 dark:text-green-400";
  }

  if (
    movement.type === "expense" ||
    movement.type === "refund"
  ) {
    return "text-red-600 dark:text-red-400";
  }

  if (movement.type === "transfer") {
    return "text-blue-600 dark:text-blue-400";
  }

  return "text-slate-700 dark:text-slate-200";
}

function getChartPoints(
  movements: FinancialMovement[],
  period: PeriodType,
  customStart: string,
  customEnd: string,
): ChartPoint[] {
  if (movements.length === 0) {
    return [];
  }

  const range = getPeriodRange(
    period,
    customStart,
    customEnd,
  );

  const visible = movements.filter((movement) =>
    isMovementInsidePeriod(movement, range),
  );

  if (visible.length === 0) {
    return [];
  }

  const buckets = new Map<string, ChartPoint>();

  const addBucket = (
    key: string,
    label: string,
    sortValue: number,
  ) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        label,
        income: 0,
        expense: 0,
        net: 0,
        sortValue,
      });
    }

    return buckets.get(key)!;
  };

  for (const movement of visible) {
    if (movement.status !== "completed") {
      continue;
    }

    const date = new Date(movement.date);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    let key = "";
    let label = "";
    let sortValue = date.getTime();

    if (period === "week") {
      key = date.toISOString().slice(0, 10);

      label = new Intl.DateTimeFormat("es-CO", {
        weekday: "short",
        day: "numeric",
      }).format(date);

      sortValue = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime();
    } else if (
      period === "month" ||
      period === "custom"
    ) {
      key = date.toISOString().slice(0, 10);

      label = new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
      }).format(date);

      sortValue = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime();
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;

      label = new Intl.DateTimeFormat("es-CO", {
        month: "short",
      }).format(date);

      sortValue = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
      ).getTime();
    }

    const bucket = addBucket(
      key,
      label,
      sortValue,
    );

    if (movement.type === "income") {
      bucket.income += movement.amount;
    }

    if (movement.type === "expense") {
      bucket.expense += movement.amount;
    }

    if (movement.type === "refund") {
      bucket.expense += movement.amount;
    }
  }

  return Array.from(buckets.values())
    .map((point) => ({
      ...point,
      net: point.income - point.expense,
    }))
    .sort(
      (a, b) => a.sortValue - b.sortValue,
    );
}

function ChartEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center dark:border-slate-700 dark:bg-slate-950/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400 dark:bg-slate-800">
        $
      </div>

      <h3 className="mt-4 text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function LineChart({
  data,
}: {
  data: ChartPoint[];
}) {
  if (data.length === 0) {
    return (
      <ChartEmptyState
        title="Sin información para graficar"
        description="Cuando VEXIA registre movimientos financieros dentro del período seleccionado, aquí aparecerá su evolución."
      />
    );
  }

  const width = 760;
  const height = 300;

  const padding = {
    top: 24,
    right: 24,
    bottom: 48,
    left: 68,
  };

  const values = data.flatMap((point) => [
    point.income,
    point.expense,
    Math.max(0, point.net),
  ]);

  const maxValue = Math.max(...values, 1);

  const chartWidth =
    width - padding.left - padding.right;

  const chartHeight =
    height - padding.top - padding.bottom;

  const x = (index: number) =>
    data.length === 1
      ? padding.left + chartWidth / 2
      : padding.left +
        (index / (data.length - 1)) *
          chartWidth;

  const y = (value: number) =>
    padding.top +
    chartHeight -
    (value / maxValue) * chartHeight;

  const createPath = (
    key: "income" | "expense" | "net",
  ) =>
    data
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${x(index)} ${y(
            Math.max(0, point[key]),
          )}`,
      )
      .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[300px] min-w-[680px] w-full"
        role="img"
        aria-label="Evolución financiera del período seleccionado"
      >
        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio) => {
            const value = maxValue * ratio;

            const yPosition =
              padding.top +
              chartHeight -
              ratio * chartHeight;

            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yPosition}
                  y2={yPosition}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                />

                <text
                  x={padding.left - 10}
                  y={yPosition + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {formatCurrency(value)
                    .replace("$", "")
                    .replace(/\s/g, "")}
                </text>
              </g>
            );
          },
        )}

        <path
          d={createPath("income")}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={createPath("expense")}
          fill="none"
          stroke="#dc2626"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={createPath("net")}
          fill="none"
          stroke="#15803d"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={x(index)}
              cy={y(point.income)}
              r="4"
              fill="#16a34a"
            />

            <circle
              cx={x(index)}
              cy={y(point.expense)}
              r="4"
              fill="#dc2626"
            />

            <circle
              cx={x(index)}
              cy={y(Math.max(0, point.net))}
              r="3"
              fill="#15803d"
            />

            <text
              x={x(index)}
              y={height - 18}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          Ingresos
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          Egresos
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-700" />
          Resultado neto
        </span>
      </div>
    </div>
  );
}

function DonutChart({
  data,
}: {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
}) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (total <= 0) {
    return (
      <ChartEmptyState
        title="Sin ingresos registrados"
        description="La composición de ingresos aparecerá automáticamente cuando existan operaciones financieras completadas."
      />
    );
  }

  const radius = 76;
  const circumference =
    2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-6 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Composición de ingresos"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="28"
            className="text-slate-100 dark:text-slate-800"
          />

          {data.map((item) => {
            const percentage =
              item.value / total;

            const dash =
              percentage * circumference;

            const offset = -accumulated;

            accumulated += dash;

            return (
              <circle
                key={item.label}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="28"
                strokeDasharray={`${dash} ${
                  circumference - dash
                }`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Ingresos
          </span>

          <span className="mt-1 text-sm font-bold">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span>{item.label}</span>
            </span>

            <span className="font-semibold">
              {Math.round(
                (item.value / total) * 100,
              )}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: {
    label: string;
    value: number;
  }[];
}) {
  if (data.length === 0) {
    return (
      <ChartEmptyState
        title="Sin egresos registrados"
        description="Las categorías de egresos se mostrarán aquí cuando existan movimientos financieros completados."
      />
    );
  }

  const max = Math.max(
    ...data.map((item) => item.value),
    1,
  );

  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="truncate font-medium">
              {item.label}
            </span>

            <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
              {formatCurrency(item.value)}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{
                width: `${Math.max(
                  3,
                  (item.value / max) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReceivablesCard({
  totalPending,
  accountCount,
}: {
  totalPending: number;
  accountCount: number;
}) {
  const hasReceivables =
    totalPending > 0 || accountCount > 0;

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              $
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Control de cartera
              </p>

              <h2 className="text-lg font-bold">
                Cuentas por cobrar
              </h2>
            </div>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Saldo pendiente que los clientes todavía deben al
            negocio. Este indicador representa la cartera actual,
            independientemente del período seleccionado arriba.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
          <div className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total por cobrar
            </p>

            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalPending)}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cuentas pendientes
            </p>

            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
              {accountCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-amber-200 pt-4 dark:border-amber-900/50 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {hasReceivables
            ? "Existen saldos pendientes que requieren seguimiento."
            : "No existen cuentas pendientes en este momento."}
        </p>

        <Link
          href="/finanzas/cuentas-por-cobrar"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Gestionar cartera
          <span className="ml-2">→</span>
        </Link>
      </div>
    </section>
  );
}

export default function FinanzasPage() {
  const [movements, setMovements] =
    useState<FinancialMovement[]>([]);

  const [operations, setOperations] =
    useState<Operation[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [typeFilter, setTypeFilter] =
    useState<
      "all" | FinancialMovementType
    >("all");

  const [statusFilter, setStatusFilter] =
    useState<
      "all" | FinancialMovementStatus
    >("all");

  const [period, setPeriod] =
    useState<PeriodType>("month");

  const [customStart, setCustomStart] =
    useState("");

  const [customEnd, setCustomEnd] =
    useState("");

  useEffect(() => {
    setMovements(loadFinancialMovements());
    setOperations(loadOperations());
    setPayments(loadPayments());
  }, []);

  const periodRange = useMemo(
    () =>
      getPeriodRange(
        period,
        customStart,
        customEnd,
      ),
    [period, customStart, customEnd],
  );

  const periodMovements = useMemo(
    () =>
      movements.filter((movement) =>
        isMovementInsidePeriod(
          movement,
          periodRange,
        ),
      ),
    [movements, periodRange],
  );

  const summary = useMemo(
    () =>
      calculateFinancialSummary(
        periodMovements,
      ),
    [periodMovements],
  );

  const filteredMovements = useMemo(() => {
    return periodMovements.filter(
      (movement) => {
        const matchesType =
          typeFilter === "all" ||
          movement.type === typeFilter;

        const matchesStatus =
          statusFilter === "all" ||
          movement.status === statusFilter;

        return (
          matchesType &&
          matchesStatus
        );
      },
    );
  }, [
    periodMovements,
    typeFilter,
    statusFilter,
  ]);

  const chartPoints = useMemo(
    () =>
      getChartPoints(
        movements,
        period,
        customStart,
        customEnd,
      ),
    [
      movements,
      period,
      customStart,
      customEnd,
    ],
  );

  const revenueComposition = useMemo(() => {
    const groups = new Map<
      string,
      number
    >();

    for (const movement of periodMovements) {
      if (
        movement.status !==
          "completed" ||
        movement.type !== "income"
      ) {
        continue;
      }

      const label = getSourceLabel(
        movement.sourceType,
      );

      groups.set(
        label,
        (groups.get(label) ?? 0) +
          movement.amount,
      );
    }

    const colors = [
      "#16a34a",
      "#2563eb",
      "#64748b",
      "#0f766e",
      "#9333ea",
      "#475569",
    ];

    return Array.from(
      groups.entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(
        ([label, value], index) => ({
          label,
          value,
          color:
            colors[
              index % colors.length
            ],
        }),
      );
  }, [periodMovements]);

  const expenseCategories = useMemo(() => {
    const groups = new Map<
      string,
      number
    >();

    for (const movement of periodMovements) {
      if (
        movement.status !==
          "completed" ||
        (movement.type !== "expense" &&
          movement.type !== "refund")
      ) {
        continue;
      }

      const label =
        movement.category?.trim() ||
        getSourceLabel(
          movement.sourceType,
        );

      groups.set(
        label,
        (groups.get(label) ?? 0) +
          movement.amount,
      );
    }

    return Array.from(
      groups.entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value,
      }));
  }, [periodMovements]);

  const receivablesSummary =
    useMemo(() => {
      const receivableOperations =
        operations.filter(
          (operation) =>
            operation.type === "sale" &&
            operation.status !==
              "cancelled",
        );

      let totalPending = 0;
      let accountCount = 0;

      for (const operation of receivableOperations) {
        const pending =
          calculateOperationPending(
            operation,
            payments,
          );

        if (pending > 0) {
          totalPending += pending;
          accountCount += 1;
        }
      }

      return {
        totalPending,
        accountCount,
      };
    }, [operations, payments]);

  function reloadFinance() {
    setMovements(
      loadFinancialMovements(),
    );

    setOperations(
      loadOperations(),
    );

    setPayments(
      loadPayments(),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Control financiero
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Finanzas
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Consulta y controla los movimientos financieros
              generados por las operaciones de VEXIA.
            </p>
          </div>

          <button
            type="button"
            onClick={reloadFinance}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Actualizar
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Período financiero
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Selecciona el período que quieres analizar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["week", "Semanal"],
                ["month", "Mensual"],
                ["quarter", "Trimestral"],
                ["year", "Anual"],
                ["custom", "Personalizado"],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setPeriod(
                        value as PeriodType,
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      period === value
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          {period === "custom" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Desde

                <input
                  type="date"
                  value={customStart}
                  onChange={(event) =>
                    setCustomStart(
                      event.target.value,
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <label className="text-sm font-medium">
                Hasta

                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) =>
                    setCustomEnd(
                      event.target.value,
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ingresos
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                summary.totalIncome,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Dinero recibido dentro del período
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Egresos
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(
                summary.totalExpense,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gastos y salidas registradas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Devoluciones
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(
                summary.totalRefunds,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Dinero devuelto a clientes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Resultado neto
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                summary.netResult >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(
                summary.netResult,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Resultado del período seleccionado
            </p>
          </div>

        </section>

        <ReceivablesCard
          totalPending={
            receivablesSummary.totalPending
          }
          accountCount={
            receivablesSummary.accountCount
          }
        />

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Análisis financiero
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Visualiza cómo se comporta el negocio durante el período seleccionado.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
              <div className="mb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">
                      Evolución financiera
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Compara ingresos, egresos y resultado neto.
                    </p>
                  </div>

                  <span
                    title="Cada línea representa un indicador financiero del período."
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800"
                  >
                    i
                  </span>
                </div>
              </div>

              <LineChart
                data={chartPoints}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Composición de ingresos
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Identifica de dónde provienen los ingresos.
                </p>
              </div>

              <DonutChart
                data={
                  revenueComposition
                }
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h3 className="font-semibold">
                  Egresos por categoría
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Muestra qué categorías concentran el gasto.
                </p>
              </div>

              <BarChart
                data={expenseCategories}
              />
            </div>

          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Movimientos financieros
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Registro central de los movimientos económicos de VEXIA.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | "all"
                      | FinancialMovementType,
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">
                  Todos los tipos
                </option>

                <option value="income">
                  Ingresos
                </option>

                <option value="expense">
                  Egresos
                </option>

                <option value="refund">
                  Devoluciones
                </option>

                <option value="transfer">
                  Transferencias
                </option>

                <option value="adjustment">
                  Ajustes
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | FinancialMovementStatus,
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">
                  Todos los estados
                </option>

                <option value="pending">
                  Pendientes
                </option>

                <option value="completed">
                  Completados
                </option>

                <option value="cancelled">
                  Cancelados
                </option>
              </select>

            </div>
          </div>

          {filteredMovements.length ===
          0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                $
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                Aún no hay movimientos financieros
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Los ingresos, egresos, pagos,
                devoluciones y demás movimientos
                aparecerán aquí cuando sean generados
                por los módulos correspondientes de VEXIA.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">

                    <th className="px-5 py-4 font-semibold">
                      Fecha
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Concepto
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Origen
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Método
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Valor
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredMovements.map(
                    (movement) => (
                      <tr
                        key={movement.id}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatDate(
                            movement.date,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium">
                              {movement.description}
                            </p>

                            {movement.category && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {movement.category}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-slate-600 dark:text-slate-300">
                            {getSourceLabel(
                              movement.sourceType,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {getPaymentMethodLabel(
                            movement.paymentMethod,
                          )}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-bold ${getMovementValueClasses(
                            movement,
                          )}`}
                        >
                          {movement.type ===
                            "expense" ||
                          movement.type ===
                            "refund"
                            ? "-"
                            : ""}
                          {formatCurrency(
                            movement.amount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getMovementStatusClasses(
                                movement.status,
                              )}`}
                            >
                              {getMovementStatusLabel(
                                movement.status,
                              )}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              {getMovementTypeLabel(
                                movement.type,
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}