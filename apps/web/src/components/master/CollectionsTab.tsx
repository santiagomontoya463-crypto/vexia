"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { sendNotification, whatsappLink } from "./notify";
import {
  STATE_LABELS,
  STATE_STYLES,
  cardClass,
  daysUntil,
  effectiveState,
  formatDate,
  formatDateTime,
  ghostButton,
  money,
  type MasterBusiness,
  type Overview,
  type Plan,
} from "./shared";

export type PaymentRequest = {
  id: string;
  business_id: string;
  business_name: string;
  plan_name: string | null;
  months: number;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  requested_by_email: string | null;
  owner_email: string | null;
  phone: string | null;
  created_at: string;
};

const METHOD_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

type Filter = "cobrar" | "vencidas" | "porvencer" | "aldia" | "prueba" | "todas";

export default function CollectionsTab({
  businesses,
  plans,
  requests,
  overview,
  onChanged,
  onPayment,
  flash,
  setError,
}: {
  businesses: MasterBusiness[];
  plans: Plan[];
  requests: PaymentRequest[];
  overview: Overview | null;
  onChanged: () => Promise<void>;
  onPayment: (businessId: string) => void;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [filter, setFilter] = useState<Filter>("cobrar");
  const [working, setWorking] = useState<string | null>(null);

  async function approve(request: PaymentRequest) {
    if (!supabase) return;

    const answer = window.prompt(
      `Valor realmente recibido de ${request.business_name} (puedes corregirlo):`,
      String(request.amount),
    );

    if (answer === null) return;

    const amount = Number(answer);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("El valor no es válido.");
      return;
    }

    setWorking(request.id);

    const { data, error } = await supabase.rpc("master_approve_payment_request", {
      p_request: request.id,
      p_amount: amount,
    });

    if (error) {
      setError(error.message);
      setWorking(null);
      return;
    }

    setError("");

    // Se envía el comprobante al propietario (si el correo está configurado).
    const mail = await sendNotification("receipt", request.business_id, String(data));

    flash(
      `Pago confirmado: ${request.business_name} quedó activa. ${mail.ok ? mail.message : `No se envió el comprobante: ${mail.message}`}`,
    );

    setWorking(null);
    await onChanged();
  }

  async function reject(request: PaymentRequest) {
    if (!supabase) return;

    const reason = window.prompt(
      `Motivo del rechazo (lo verá ${request.business_name}):`,
      "No encontramos el pago",
    );

    if (reason === null) return;

    setWorking(request.id);

    const { error } = await supabase.rpc("master_reject_payment_request", {
      p_request: request.id,
      p_reason: reason,
    });

    setWorking(null);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash("Aviso rechazado.");
    await onChanged();
  }

  async function remind(business: MasterBusiness) {
    const result = await sendNotification("reminder", business.id);

    if (result.ok) {
      setError("");
      flash(result.message);
    } else {
      setError(result.message);
    }
  }

  const rows = businesses
    .filter((business) => business.status !== "cancelled")
    .map((business) => {
      const state = effectiveState(business);
      const reference =
        business.status === "trial" ? business.trial_ends_at : business.subscription_ends_at;
      const days = daysUntil(reference);
      const price = plans.find((plan) => plan.id === business.plan_id)?.price_monthly ?? 0;

      return { business, state, days, price, reference };
    });

  const overdue = rows.filter(
    (row) => row.state === "trial_expired" || row.state === "subscription_expired",
  );
  const soon = rows.filter(
    (row) =>
      (row.state === "trial" || row.state === "active") && row.days !== null && row.days <= 7,
  );
  const dueValue = [...overdue, ...soon].reduce((sum, row) => sum + row.price, 0);

  const visible = rows
    .filter((row) => {
      if (filter === "todas") return true;
      if (filter === "vencidas") return overdue.includes(row);
      if (filter === "porvencer") return soon.includes(row);
      if (filter === "prueba") return row.state === "trial";
      if (filter === "aldia") return row.state === "active" && !soon.includes(row);

      return overdue.includes(row) || soon.includes(row);
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));

  async function remindAllOverdue() {
    const targets = overdue.filter((row) => row.business.owner_email);

    if (targets.length === 0) {
      setError("No hay empresas vencidas con propietario para avisar.");
      return;
    }

    const confirmed = window.confirm(
      `¿Enviar un recordatorio de pago a ${targets.length} ${targets.length === 1 ? "empresa vencida" : "empresas vencidas"}?`,
    );

    if (!confirmed) return;

    let sent = 0;
    let lastFailure = "";

    for (const row of targets) {
      const result = await sendNotification("reminder", row.business.id);

      if (result.ok) sent += 1;
      else lastFailure = result.message;
    }

    if (sent === 0) setError(lastFailure);
    else setError("");

    flash(`Recordatorios enviados: ${sent} de ${targets.length}.`);
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "cobrar", label: "Por cobrar" },
    { id: "vencidas", label: "Vencidas" },
    { id: "porvencer", label: "Por vencer (7 días)" },
    { id: "aldia", label: "Al día" },
    { id: "prueba", label: "En prueba" },
    { id: "todas", label: "Todas" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <p className="text-sm text-slate-500">Avisos de pago por confirmar</p>
          <p className="mt-2 text-2xl font-bold">{requests.length}</p>
        </div>
        <div className={`${cardClass} ${overdue.length ? "border-orange-300" : ""}`}>
          <p className="text-sm text-slate-500">Empresas vencidas</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{overdue.length}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500">Por cobrar (vencidas + próximas 7 días)</p>
          <p className="mt-2 text-2xl font-bold">{money(dueValue)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-slate-500">Cobrado este mes</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {money(Number(overview?.revenue_month ?? 0))}
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-bold">Pagos por confirmar</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Las empresas avisan desde su cuenta cuando pagan. Revisa tu banco y confirma: la
          suscripción se activa sola y el propietario recibe su comprobante.
        </p>

        {requests.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">No hay avisos pendientes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            {requests.map((request) => (
              <li key={request.id} className="py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{request.business_name}</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {request.plan_name ?? "Sin plan"} · {request.months}{" "}
                      {request.months === 1 ? "mes" : "meses"} ·{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {money(Number(request.amount), request.currency)}
                      </strong>{" "}
                      · {METHOD_LABELS[request.method] ?? request.method}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(request.created_at)}
                      {request.requested_by_email ? ` · ${request.requested_by_email}` : ""}
                      {request.reference ? ` · Ref. ${request.reference}` : ""}
                    </p>
                    {request.notes && (
                      <p className="mt-1 text-xs text-slate-500">Nota: {request.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={working === request.id}
                      onClick={() => void approve(request)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Confirmar pago
                    </button>
                    <button
                      type="button"
                      disabled={working === request.id}
                      onClick={() => void reject(request)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Cartera de cobros</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Quién debe pagar y cuándo. Cobra, recuerda por correo o escribe por WhatsApp.
            </p>
          </div>

          <button type="button" onClick={() => void remindAllOverdue()} className={ghostButton}>
            Recordar a todas las vencidas
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === item.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "border border-slate-200 dark:border-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay empresas en este grupo.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            {visible.map(({ business, state, days, price, reference }) => {
              const text = `Hola, te escribimos de STIAN. ${
                state === "trial_expired" || state === "subscription_expired"
                  ? "Tu suscripción de " + business.name + " está vencida."
                  : "La suscripción de " + business.name + " está por vencer."
              } Puedes pagar y avisarnos desde tu cuenta en STIAN.`;

              const wa = whatsappLink(business.phone ?? null, text);

              return (
                <li
                  key={business.id}
                  className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold">{business.name}</p>
                    <p className="text-xs text-slate-500">
                      {business.owner_email ?? "Sin propietario"} · {business.plan_name ?? "Sin plan"}
                      {price > 0 ? ` · ${money(price, business.currency)}/mes` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(reference)}
                      {days !== null &&
                        ` · ${days < 0 ? `venció hace ${Math.abs(days)} d` : `faltan ${days} d`}`}
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
                      Cobrar
                    </button>
                    <button type="button" onClick={() => void remind(business)} className={ghostButton}>
                      Recordar
                    </button>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className={ghostButton}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
