"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBillingDocuments } from "../../lib/billing";
import { getActiveBusiness } from "../../lib/business";
import { loadClients } from "../../lib/clients";
import { loadFinancialMovements } from "../../lib/finance";
import { loadProducts } from "../../lib/inventory/storage";
import { loadPurchases } from "../../lib/purchases";
import { loadSales } from "../../lib/sales";
import { loadServices } from "../../lib/services/storage";
import { lower, useIndustry } from "../../lib/industry";
import { readStoredList } from "../../lib/sync/usePersistentList";

type MonthBar = { label: string; income: number; expense: number };

type RecentSale = {
  id: string;
  date: string;
  total: number;
  pending: number;
  status: string;
};

type LowStockProduct = { id: string; name: string; stock: number; min: number };

type UpcomingReservation = {
  id: string;
  date: string;
  time: string;
  client: string;
  service: string;
  professional: string;
  status: string;
};

type DashboardData = {
  reservationsToday: number;
  reservationsWeek: number;
  upcoming: UpcomingReservation[];
  businessName: string;
  hasBusiness: boolean;
  salesMonth: number;
  salesCount: number;
  salesChange: number | null;
  incomeMonth: number;
  expenseMonth: number;
  receivable: number;
  payable: number;
  clientsTotal: number;
  clientsActive: number;
  clientsNew: number;
  productsTotal: number;
  servicesTotal: number;
  lowStock: LowStockProduct[];
  invoicesIssued: number;
  invoicesDraft: number;
  months: MonthBar[];
  recentSales: RecentSale[];
  hasClients: boolean;
  hasProducts: boolean;
  hasSales: boolean;
};

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function sameMonth(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    confirmed: "Confirmada",
    draft: "Borrador",
    cancelled: "Cancelada",
    refunded: "Reembolsada",
  };

  return labels[status] ?? status;
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function computeDashboard(): DashboardData {
  const now = new Date();
  const todayKey = dateKey(now);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekKey = dateKey(weekEnd);

  const activeReservations = readStoredList<
    UpcomingReservation & { id: string | number }
  >("stian:reservations").filter((item) => item.status !== "Cancelada");

  const upcomingReservations = activeReservations
    .filter((item) => item.date >= todayKey)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const business = getActiveBusiness();
  const sales = loadSales();
  const movements = loadFinancialMovements();
  const purchases = loadPurchases();
  const products = loadProducts();
  const storedClients = loadClients();
  const clients = storedClients ?? [];
  const documents = loadBillingDocuments();

  const confirmedSales = sales.filter((sale) => sale.status === "confirmed");

  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const salesThisMonth = confirmedSales.filter((sale) =>
    sameMonth(new Date(sale.date), now),
  );
  const salesPrevMonth = confirmedSales.filter((sale) =>
    sameMonth(new Date(sale.date), previousMonth),
  );

  const salesMonth = salesThisMonth.reduce((sum, sale) => sum + sale.total, 0);
  const salesPrev = salesPrevMonth.reduce((sum, sale) => sum + sale.total, 0);
  const salesChange =
    salesPrev > 0 ? Math.round(((salesMonth - salesPrev) / salesPrev) * 100) : null;

  const completed = movements.filter(
    (movement) => movement.status === "completed",
  );

  const months: MonthBar[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const reference = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const inMonth = completed.filter((movement) =>
      sameMonth(new Date(movement.date), reference),
    );

    months.push({
      label: reference.toLocaleDateString("es-CO", { month: "short" }),
      income: inMonth
        .filter((movement) => movement.type === "income")
        .reduce((sum, movement) => sum + movement.amount, 0),
      expense: inMonth
        .filter((movement) => movement.type === "expense")
        .reduce((sum, movement) => sum + movement.amount, 0),
    });
  }

  const currentMonth = months[months.length - 1];

  const activeProducts = products.filter((product) => product.active);

  return {
    reservationsToday: activeReservations.filter((item) => item.date === todayKey).length,
    reservationsWeek: upcomingReservations.filter((item) => item.date <= weekKey).length,
    upcoming: upcomingReservations.slice(0, 5).map((item) => ({
      id: String(item.id),
      date: item.date,
      time: item.time,
      client: item.client,
      service: item.service,
      professional: item.professional,
      status: item.status,
    })),
    businessName: business?.name ?? "tu negocio",
    hasBusiness: Boolean(business),
    salesMonth,
    salesCount: salesThisMonth.length,
    salesChange,
    incomeMonth: currentMonth.income,
    expenseMonth: currentMonth.expense,
    receivable: confirmedSales.reduce(
      (sum, sale) => sum + Math.max(sale.pending, 0),
      0,
    ),
    payable: purchases
      .filter((purchase) => purchase.status !== "cancelled")
      .reduce((sum, purchase) => sum + Math.max(purchase.pendingAmount, 0), 0),
    clientsTotal: clients.length,
    clientsActive: clients.filter((client) => client.status === "Activo").length,
    clientsNew: clients.filter((client) =>
      sameMonth(new Date(client.createdAt), now),
    ).length,
    productsTotal: activeProducts.length,
    servicesTotal: loadServices().length,
    lowStock: activeProducts
      .filter((product) => product.stock <= product.minimumStock)
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        min: product.minimumStock,
      })),
    invoicesIssued: documents.filter((doc) => doc.status === "issued").length,
    invoicesDraft: documents.filter((doc) => doc.status === "draft").length,
    months,
    recentSales: [...sales]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 5)
      .map((sale) => ({
        id: sale.id,
        date: sale.date,
        total: sale.total,
        pending: sale.pending,
        status: sale.status,
      })),
    hasClients: storedClients !== null && storedClients.length > 0,
    hasProducts: products.length > 0,
    hasSales: sales.length > 0,
  };
}

function Kpi({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "violet" | "emerald" | "rose" | "amber" | "cyan" | "indigo";
}) {
  const tones: Record<string, string> = {
    violet: "from-violet-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    amber: "from-amber-500 to-orange-500",
    cyan: "from-cyan-500 to-sky-500",
    indigo: "from-indigo-500 to-blue-500",
  };

  return (
    <div className={`${cardClass} relative overflow-hidden`}>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tones[tone]}`}
      />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}


export default function HomePage() {
  const industry = useIndustry();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setData(computeDashboard());
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f5f6fc] p-10 text-sm text-slate-500 dark:bg-[#080d19] dark:text-slate-400">
        Cargando tu panel...
      </main>
    );
  }

  const net = data.incomeMonth - data.expenseMonth;
  const maxBar = Math.max(
    1,
    ...data.months.flatMap((month) => [month.income, month.expense]),
  );

  const checklist = [
    { done: data.hasBusiness, text: "Registra los datos de tu negocio", href: "/negocio" },
    { done: data.servicesTotal > 0, text: `Agrega tus ${lower(industry.services)}`, href: "/servicios" },
    { done: data.hasClients, text: `Agrega tu primer ${lower(industry.client)}`, href: "/clientes" },
    { done: data.hasSales, text: "Registra tu primera venta", href: "/ventas" },
    { done: data.invoicesIssued > 0, text: "Emite tu primer documento", href: "/facturacion" },
  ];

  const quickActions = [
    { text: industry.newReservation, description: `Organiza tus ${lower(industry.reservations)}`, href: "/reservas", icon: "◷" },
    { text: industry.newClient, description: "Gestiona tus contactos", href: "/clientes", icon: "◎" },
    { text: "Nueva venta", description: "Registra un cobro", href: "/ventas", icon: "↗" },
    { text: "Nuevo documento", description: "Factura, recibo y más", href: "/facturacion", icon: "▤" },
    { text: industry.newService, description: "Edita tu catálogo", href: "/servicios", icon: "✳" },
    { text: "Ver finanzas", description: "Ingresos y egresos", href: "/finanzas", icon: "$" },
  ];
  const pendingSteps = checklist.filter((step) => !step.done);

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 transition-colors dark:bg-[#080d19] dark:text-slate-100">
      <section className="relative min-w-0 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-400/10 blur-[110px] dark:bg-violet-600/10"
        />

        <header className="relative border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                Centro de operaciones
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Inicio
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Resumen real de {data.businessName}.
              </p>
            </div>

            <Link
              href="/configuracion"
              aria-label="Abrir configuración"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-violet-400/10"
            >
              ⚙
            </Link>
          </div>
        </header>

        <div className="relative mx-auto max-w-[1500px] space-y-8 p-5 sm:p-8 lg:p-10">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#29215f] via-[#4937a9] to-[#087b99] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
            <p className="text-sm font-medium text-white/70">
              Este mes en {data.businessName}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {money(data.salesMonth)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {data.salesCount} {data.salesCount === 1 ? "venta" : "ventas"}{" "}
              confirmadas
              {data.salesChange !== null &&
                ` · ${data.salesChange >= 0 ? "+" : ""}${data.salesChange}% frente al mes anterior`}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ventas"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-white/90"
              >
                Nueva venta
              </Link>
              <Link
                href="/facturacion"
                className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Facturación
              </Link>
            </div>
          </section>

          {pendingSteps.length > 0 && (
            <section className={cardClass}>
              <h2 className="font-bold">Primeros pasos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Completa estos pasos para dejar tu negocio listo para operar.
              </p>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {checklist.map((step) => (
                  <li key={step.text}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          step.done
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-300 text-transparent dark:border-white/20"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={
                          step.done
                            ? "text-slate-400 line-through"
                            : "font-medium"
                        }
                      >
                        {step.text}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              title="Ingresos del mes"
              value={money(data.incomeMonth)}
              detail="Movimientos completados"
              tone="emerald"
            />
            <Kpi
              title="Egresos del mes"
              value={money(data.expenseMonth)}
              detail="Gastos y compras pagadas"
              tone="rose"
            />
            <Kpi
              title="Utilidad del mes"
              value={money(net)}
              detail={net >= 0 ? "Resultado positivo" : "Resultado negativo"}
              tone={net >= 0 ? "violet" : "amber"}
            />
            <Kpi
              title="Por cobrar"
              value={money(data.receivable)}
              detail="Saldo pendiente de clientes"
              tone="cyan"
            />
            <Kpi
              title="Por pagar"
              value={money(data.payable)}
              detail="Saldo pendiente a proveedores"
              tone="amber"
            />
            <Kpi
              title={`${industry.clients} activos`}
              value={String(data.clientsActive)}
              detail={`${data.clientsTotal} en total · ${data.clientsNew} nuevos este mes`}
              tone="indigo"
            />
            <Kpi
              title={`${industry.reservations} de hoy`}
              value={String(data.reservationsToday)}
              detail="Sin contar las canceladas"
              tone="violet"
            />
            <Kpi
              title={`${industry.reservations} próximos 7 días`}
              value={String(data.reservationsWeek)}
              detail="Agenda de la semana"
              tone="cyan"
            />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={`${cardClass} xl:col-span-2`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">Ingresos y egresos</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Últimos 6 meses
                  </p>
                </div>

                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Ingresos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Egresos
                  </span>
                </div>
              </div>

              <div className="mt-6 flex h-56 items-end gap-3 sm:gap-5">
                {data.months.map((month) => (
                  <div
                    key={month.label}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-full w-full items-end justify-center gap-1.5">
                      <div
                        title={`Ingresos: ${money(month.income)}`}
                        className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                        style={{
                          height: `${Math.max((month.income / maxBar) * 100, month.income > 0 ? 3 : 0)}%`,
                        }}
                      />
                      <div
                        title={`Egresos: ${money(month.expense)}`}
                        className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400"
                        style={{
                          height: `${Math.max((month.expense / maxBar) * 100, month.expense > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>

              {maxBar === 1 && (
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aún no hay movimientos financieros. Registra una venta o un
                  gasto para ver el gráfico.
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className={cardClass}>
                <h2 className="font-bold">Alertas</h2>

                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-3">
                    <span>Documentos en borrador</span>
                    <Link
                      href="/facturacion"
                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"
                    >
                      {data.invoicesDraft}
                    </Link>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Documentos emitidos</span>
                    <Link
                      href="/facturacion"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"
                    >
                      {data.invoicesIssued}
                    </Link>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span>Productos con stock bajo</span>
                    <Link
                      href="/productos"
                      className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800"
                    >
                      {data.lowStock.length}
                    </Link>
                  </li>
                </ul>

                {data.lowStock.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
                    {data.lowStock.map((product) => (
                      <li
                        key={product.id}
                        className="flex justify-between gap-3 text-slate-600 dark:text-slate-300"
                      >
                        <span className="truncate">{product.name}</span>
                        <span className="shrink-0 font-semibold">
                          {product.stock} / mín. {product.min}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={cardClass}>
                <h2 className="font-bold">Catálogo</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">
                      {industry.products}
                    </dt>
                    <dd className="text-2xl font-bold">{data.productsTotal}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">
                      {industry.services}
                    </dt>
                    <dd className="text-2xl font-bold">{data.servicesTotal}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Próximas {lower(industry.reservations)}</h2>
              <Link
                href="/reservas"
                className="text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300"
              >
                Ver agenda
              </Link>
            </div>

            {data.upcoming.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No hay {lower(industry.reservations)} programadas.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-white/10">
                {data.upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-semibold">{item.client}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.service} · {item.professional}
                      </p>
                    </div>
                    <p className="text-xs font-semibold">
                      {item.date} · {item.time}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={`${cardClass} xl:col-span-2`}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Últimas ventas</h2>
                <Link
                  href="/ventas"
                  className="text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300"
                >
                  Ver todas
                </Link>
              </div>

              {data.recentSales.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Todavía no hay ventas registradas.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-white/10">
                  {data.recentSales.map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">{money(sale.total)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(sale.date).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold">
                          {statusLabel(sale.status)}
                        </p>
                        {sale.pending > 0 && (
                          <p className="text-xs text-amber-600">
                            Pendiente {money(sale.pending)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardClass}>
              <h2 className="font-bold">Accesos rápidos</h2>
              <div className="mt-4 grid gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.text}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-cyan-200">
                      {action.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {action.text}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {action.description}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
