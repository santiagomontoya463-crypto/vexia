"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth, type BusinessSummary } from "../../lib/auth/AuthProvider";
import {
  cardClass,
  daysUntil,
  formatDate,
  ghostButton,
  inputClass,
  money,
  primaryButton,
  type PaymentAccount,
  type Plan,
} from "../../components/master/shared";

type NamedRef = { name?: string | null; label?: string | null } | { name?: string | null; label?: string | null }[] | null;

type OwnRequest = {
  id: string;
  months: number;
  amount: number;
  currency: string;
  reference: string;
  paid_on: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
  plan: NamedRef;
  account: NamedRef;
};

type ConfirmedPayment = {
  id: string;
  amount: number;
  currency: string;
  months: number;
  period_start: string;
  period_end: string;
  reference: string | null;
  created_at: string;
};

const MONTH_OPTIONS = [1, 3, 6, 12];

const REQUEST_LABELS: Record<OwnRequest["status"], string> = {
  pending: "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const REQUEST_STYLES: Record<OwnRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

function refName(value: NamedRef, key: "name" | "label"): string | null {
  const item = Array.isArray(value) ? value[0] : value;

  return item?.[key] ?? null;
}

function todayInput(): string {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function describeState(business: BusinessSummary): {
  label: string;
  style: string;
  detail: string;
  canPay: boolean;
} {
  if (business.status === "suspended") {
    return {
      label: "Suspendida",
      style: "bg-rose-100 text-rose-800",
      detail: business.suspended_reason
        ? `Motivo: ${business.suspended_reason}. Comunícate con soporte para reactivarla.`
        : "Comunícate con soporte para reactivarla.",
      canPay: false,
    };
  }

  if (business.status === "cancelled") {
    return {
      label: "Cancelada",
      style: "bg-slate-200 text-slate-700",
      detail: "Esta empresa fue cancelada. Comunícate con soporte.",
      canPay: false,
    };
  }

  const isTrial = business.status === "trial";
  const end = isTrial ? business.trial_ends_at : business.subscription_ends_at;
  const days = daysUntil(end);

  if (!end || days === null) {
    return {
      label: isTrial ? "En prueba" : "Activa",
      style: isTrial ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
      detail: "Sin fecha de vencimiento.",
      canPay: true,
    };
  }

  if (days < 0) {
    return {
      label: isTrial ? "Prueba vencida" : "Suscripción vencida",
      style: "bg-orange-200 text-orange-900",
      detail: `Venció el ${formatDate(end)}. Paga tu plan para volver a usar STIAN.`,
      canPay: true,
    };
  }

  return {
    label: isTrial ? "En prueba" : "Activa",
    style: isTrial ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
    detail: `${isTrial ? "Tu prueba termina" : "Tu suscripción vence"} el ${formatDate(end)} (${
      days === 0 ? "hoy" : `en ${days} ${days === 1 ? "día" : "días"}`
    }).`,
    canPay: true,
  };
}

export default function SuscripcionPage() {
  const { supabase, activeMembership, refresh } = useAuth();
  const business = activeMembership?.business ?? null;
  const isOwner = activeMembership?.role === "owner";

  const [planName, setPlanName] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [requests, setRequests] = useState<OwnRequest[]>([]);
  const [payments, setPayments] = useState<ConfirmedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [planId, setPlanId] = useState("");
  const [months, setMonths] = useState("1");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(todayInput());
  const [notes, setNotes] = useState("");

  const businessId = business?.id ?? null;

  const load = useCallback(async () => {
    if (!supabase || !businessId) return;

    setLoading(true);

    const [planResult, plansResult, accountsResult, requestsResult, paymentsResult] =
      await Promise.all([
        supabase.from("businesses").select("plan:plans(name)").eq("id", businessId).maybeSingle(),
        supabase
          .from("plans")
          .select("*")
          .eq("active", true)
          .gt("price_monthly", 0)
          .order("sort_order"),
        supabase
          .from("platform_payment_accounts")
          .select("*")
          .eq("active", true)
          .order("sort_order")
          .order("created_at"),
        supabase
          .from("subscription_requests")
          .select("*, plan:plans(name), account:platform_payment_accounts(label)")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("subscription_payments")
          .select("id, amount, currency, months, period_start, period_end, reference, created_at")
          .eq("business_id", businessId)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const planRow = planResult.data as { plan: NamedRef } | null;

    setPlanName(planRow ? refName(planRow.plan, "name") : null);

    const loadedPlans = (plansResult.data as Plan[] | null) ?? [];

    setPlans(loadedPlans);
    setAccounts((accountsResult.data as PaymentAccount[] | null) ?? []);
    setRequests((requestsResult.data as OwnRequest[] | null) ?? []);
    setPayments((paymentsResult.data as ConfirmedPayment[] | null) ?? []);

    setPlanId((current) =>
      current && loadedPlans.some((plan) => plan.id === current)
        ? current
        : (loadedPlans[0]?.id ?? ""),
    );

    setLoading(false);
  }, [supabase, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!business) {
    return (
      <main className="p-8 text-sm text-slate-500">
        No hay una empresa seleccionada.
      </main>
    );
  }

  const state = describeState(business);
  const pending = requests.find((item) => item.status === "pending");
  const lastRequest = requests[0];
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const total = selectedPlan ? selectedPlan.price_monthly * Number(months) : 0;
  const currency = selectedPlan?.currency ?? business.currency;
  const canRequest = isOwner && state.canPay && !pending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !businessId) return;

    if (!selectedPlan) {
      setError("Elige un plan.");
      return;
    }

    if (reference.trim().length < 3) {
      setError("Escribe la referencia o número de comprobante de tu transferencia.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("submit_payment_request", {
      p_business: businessId,
      p_plan: selectedPlan.id,
      p_months: Number(months),
      p_account: accountId || null,
      p_reference: reference.trim(),
      p_paid_on: paidOn,
      p_notes: notes.trim() || null,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setReference("");
    setNotes("");
    setMessage("Recibimos tu pago. Lo revisaremos y activaremos tu plan en cuanto lo confirmemos.");
    window.setTimeout(() => setMessage(""), 8000);

    if (typeof data === "string") {
      // Aviso por correo al administrador: si no está configurado, no pasa nada.
      void fetch("/api/subscription/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: data, event: "submitted" }),
      }).catch(() => undefined);
    }

    await load();
  }

  async function reloadStatus() {
    await refresh();
    await load();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copiado.");
      window.setTimeout(() => setMessage(""), 2500);
    } catch {
      setError("No fue posible copiar. Selecciónalo y cópialo a mano.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-5 text-slate-900 dark:text-slate-100 sm:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
          {business.name}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Suscripción</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Consulta el estado de tu plan, paga por transferencia y reporta tu comprobante.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Estado de tu empresa</p>
            <p className="mt-1 text-lg font-bold">
              {planName ? `Plan ${planName}` : "Sin plan asignado"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{state.detail}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.style}`}>
              {state.label}
            </span>
            <button type="button" onClick={() => void reloadStatus()} className={ghostButton}>
              Actualizar estado
            </button>
          </div>
        </div>
      </section>

      {pending && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-bold">Tu pago está en revisión</p>
          <p className="mt-1">
            Enviaste {money(pending.amount, pending.currency)} (referencia {pending.reference}) el{" "}
            {formatDate(pending.created_at)}. Te activaremos el plan en cuanto lo confirmemos. Usa
            «Actualizar estado» para ver el cambio.
          </p>
        </section>
      )}

      {!pending && lastRequest?.status === "rejected" && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <p className="font-bold">Tu último pago no pudo confirmarse</p>
          <p className="mt-1">
            {lastRequest.reject_reason ?? "Revisa los datos y envíalo de nuevo."} Puedes reportarlo
            otra vez con los datos correctos.
          </p>
        </section>
      )}

      {!isOwner && (
        <section className={cardClass}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Solo el propietario de la empresa puede reportar pagos. Pídele que entre a esta pantalla
            para renovar la suscripción.
          </p>
        </section>
      )}

      {isOwner && !state.canPay && (
        <section className={cardClass}>
          <p className="text-sm text-slate-600 dark:text-slate-300">{state.detail}</p>
        </section>
      )}

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}

      {canRequest && !loading && (
        <>
          <section className={cardClass}>
            <h2 className="font-bold">1. Elige tu plan</h2>

            {plans.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Todavía no hay planes con precio disponibles. Comunícate con soporte.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                      planId === plan.id
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                        : "border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={planId === plan.id}
                      onChange={() => setPlanId(plan.id)}
                      className="sr-only"
                    />
                    <p className="font-bold">{plan.name}</p>
                    <p className="mt-1 text-lg font-bold">
                      {money(plan.price_monthly, plan.currency)}
                      <span className="text-xs font-normal text-slate-500"> / mes</span>
                    </p>
                    {plan.description && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {plan.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {plan.max_users ? `Hasta ${plan.max_users} usuarios` : "Usuarios ilimitados"}
                    </p>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Meses a pagar</span>
                <select
                  value={months}
                  onChange={(event) => setMonths(event.target.value)}
                  className={`${inputClass} max-w-[160px]`}
                >
                  {MONTH_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "mes" : "meses"}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-sm">
                Total a transferir:{" "}
                <strong className="text-lg">{money(total, currency)}</strong>
              </p>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="font-bold">2. Haz la transferencia</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Transfiere el valor exacto a cualquiera de estas cuentas y guarda el comprobante.
            </p>

            {accounts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Aún no hay cuentas de cobro publicadas. Comunícate con soporte para recibir los datos
                de pago.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {accounts.map((account) => (
                  <article
                    key={account.id}
                    className="rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10"
                  >
                    <p className="font-bold">{account.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {[account.bank_name, account.account_type].filter(Boolean).join(" · ")}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold">
                        {account.account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copy(account.account_number)}
                        className={ghostButton}
                      >
                        Copiar
                      </button>
                    </div>

                    <p className="mt-2">
                      Titular: <strong>{account.holder_name}</strong>
                      {account.holder_document ? ` (${account.holder_document})` : ""}
                    </p>

                    {account.instructions && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        {account.instructions}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <form onSubmit={submit} className={`${cardClass} space-y-4`}>
            <h2 className="font-bold">3. Reporta tu pago</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Cuenta a la que pagaste</span>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Prefiero no indicarla</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-semibold">Fecha del pago</span>
                <input
                  type="date"
                  value={paidOn}
                  max={todayInput()}
                  onChange={(event) => setPaidOn(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold">
                  Referencia o número del comprobante
                </span>
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Ej. 123456789"
                  className={inputClass}
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-semibold">Comentario (opcional)</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedPlan}
              className={primaryButton}
            >
              {submitting ? "Enviando..." : `Reportar pago de ${money(total, currency)}`}
            </button>
          </form>
        </>
      )}

      {requests.length > 0 && (
        <section className={cardClass}>
          <h2 className="font-bold">Pagos reportados</h2>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Enviado</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2 pr-3">Referencia</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-slate-100 dark:border-white/[0.06]"
                  >
                    <td className="py-2 pr-3">{formatDate(request.created_at)}</td>
                    <td className="py-2 pr-3">
                      {refName(request.plan, "name") ?? "—"} · {request.months}{" "}
                      {request.months === 1 ? "mes" : "meses"}
                    </td>
                    <td className="py-2 pr-3">{money(request.amount, request.currency)}</td>
                    <td className="py-2 pr-3 font-mono">{request.reference}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${REQUEST_STYLES[request.status]}`}
                      >
                        {REQUEST_LABELS[request.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {payments.length > 0 && (
        <section className={cardClass}>
          <h2 className="font-bold">Historial de pagos confirmados</h2>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Confirmado</th>
                  <th className="py-2 pr-3">Periodo cubierto</th>
                  <th className="py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-slate-100 dark:border-white/[0.06]"
                  >
                    <td className="py-2 pr-3">{formatDate(payment.created_at)}</td>
                    <td className="py-2 pr-3">
                      {formatDate(payment.period_start)} – {formatDate(payment.period_end)}
                    </td>
                    <td className="py-2">{money(payment.amount, payment.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
