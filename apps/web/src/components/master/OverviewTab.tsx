"use client";

import {
  STATE_LABELS,
  STATE_STYLES,
  cardClass,
  daysUntil,
  effectiveState,
  formatDate,
  ghostButton,
  money,
  type MasterBusiness,
  type Metrics,
  type Overview,
} from "./shared";

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function monthLabel(month: string): string {
  const [year, number] = month.split("-");

  return new Date(Number(year), Number(number) - 1, 1).toLocaleDateString("es-CO", {
    month: "short",
  });
}

function Bars({
  title,
  items,
  color,
  format,
}: {
  title: string;
  items: { label: string; value: number }[];
  color: string;
  format: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className={cardClass}>
      <h3 className="font-bold">{title}</h3>

      <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-slate-500">
              {item.value > 0 ? format(item.value) : ""}
            </span>
            <div
              title={`${item.label}: ${format(item.value)}`}
              className={`w-full max-w-[26px] rounded-t-md ${color}`}
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
            />
            <span className="text-[10px] capitalize text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewTab({
  overview,
  metrics,
  businesses,
  loading,
  onPayment,
  onExtend,
  onDetail,
}: {
  overview: Overview | null;
  metrics: Metrics | null;
  businesses: MasterBusiness[];
  loading: boolean;
  onPayment: (businessId: string) => void;
  onExtend: (business: MasterBusiness) => void;
  onDetail: (business: MasterBusiness) => void;
}) {
  const kpis = overview
    ? [
        { label: "Empresas", value: String(overview.total) },
        { label: "Activas", value: String(overview.active) },
        { label: "En prueba", value: String(overview.trial) },
        { label: "Pruebas vencidas", value: String(overview.trials_expired), alert: overview.trials_expired > 0 },
        { label: "Suscripciones vencidas", value: String(overview.subs_expired), alert: overview.subs_expired > 0 },
        { label: "Suspendidas", value: String(overview.suspended) },
        { label: "Usuarios registrados", value: String(overview.users) },
        { label: "Ingreso del mes", value: money(Number(overview.revenue_month)) },
        { label: "Ingreso total", value: money(Number(overview.revenue_total)) },
        { label: "Ingreso mensual estimado", value: money(Number(overview.mrr)) },
      ]
    : [];

  // Empresas que necesitan atención: vencidas o por vencer en 7 días.
  const attention = businesses
    .map((business) => {
      const state = effectiveState(business);
      const reference =
        business.status === "trial" ? business.trial_ends_at : business.subscription_ends_at;
      const days = daysUntil(reference);

      return { business, state, days };
    })
    .filter(
      ({ state, days }) =>
        state === "trial_expired" ||
        state === "subscription_expired" ||
        ((state === "trial" || state === "active") && days !== null && days <= 7),
    )
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`${cardClass} ${kpi.alert ? "border-orange-300 dark:border-orange-400/40" : ""}`}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className={`mt-2 text-2xl font-bold ${kpi.alert ? "text-orange-600" : ""}`}>
              {kpi.value}
            </p>
          </div>
        ))}

        {!loading && !overview && (
          <p className="text-sm text-slate-500">Aún no hay datos para mostrar.</p>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="font-bold">Requieren atención</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Empresas con la prueba o la suscripción vencida, o que vencen en los próximos 7 días.
        </p>

        {attention.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">Todo al día. No hay empresas pendientes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            {attention.map(({ business, state, days }) => (
              <li
                key={business.id}
                className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onDetail(business)}
                    className="truncate text-left font-semibold hover:underline"
                  >
                    {business.name}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {business.owner_email ?? "Sin propietario"} ·{" "}
                    {formatDate(
                      business.status === "trial"
                        ? business.trial_ends_at
                        : business.subscription_ends_at,
                    )}
                    {days !== null &&
                      ` (${days < 0 ? `hace ${Math.abs(days)} d` : `en ${days} d`})`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATE_STYLES[state]}`}>
                    {STATE_LABELS[state]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPayment(business.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Registrar pago
                  </button>
                  <button type="button" onClick={() => onExtend(business)} className={ghostButton}>
                    Extender prueba
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {metrics && (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Bars
            title="Empresas nuevas por mes"
            color="bg-gradient-to-t from-violet-600 to-indigo-400"
            items={metrics.growth.map((item) => ({
              label: monthLabel(item.month),
              value: item.businesses,
            }))}
            format={(value) => String(value)}
          />

          <Bars
            title="Ingresos por mes"
            color="bg-gradient-to-t from-emerald-600 to-emerald-400"
            items={metrics.growth.map((item) => ({
              label: monthLabel(item.month),
              value: Number(item.revenue),
            }))}
            format={compactMoney}
          />

          <div className={cardClass}>
            <h3 className="font-bold">Empresas por tipo de negocio</h3>

            {metrics.by_type.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Sin datos todavía.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {metrics.by_type.slice(0, 8).map((item) => {
                  const max = Math.max(1, ...metrics.by_type.map((row) => row.count));

                  return (
                    <li key={item.type}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{item.type}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                          style={{ width: `${(item.count / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
