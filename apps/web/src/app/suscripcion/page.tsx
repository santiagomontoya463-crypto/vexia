"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { MODULES } from "../../lib/modules";
import { printSubscriptionReceipt } from "../../lib/billing/subscription-receipt";
import {
  cardClass,
  formatDate,
  ghostButton,
  inputClass,
  money,
  primaryButton,
  type Plan,
} from "../../components/master/shared";

type BusinessRow = {
  plan_id: string | null;
  status: "trial" | "active" | "suspended" | "cancelled";
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  currency: string;
};

type PaymentRow = {
  id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  months: number;
  period_end: string;
  status: "confirmed" | "voided";
  created_at: string;
  receipt_number: number | null;
  method: string;
  reference: string | null;
};

type RequestRow = {
  id: string;
  plan_id: string | null;
  months: number;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  reference: string | null;
  created_at: string;
};

const METHODS = [
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "other", label: "Otro" },
];

const REQUEST_LABELS: Record<RequestRow["status"], { text: string; style: string }> = {
  pending: { text: "Pendiente de confirmar", style: "bg-amber-100 text-amber-800" },
  approved: { text: "Confirmado", style: "bg-emerald-100 text-emerald-800" },
  rejected: { text: "Rechazado", style: "bg-rose-100 text-rose-800" },
};

export default function SubscriptionPage() {
  const { supabase, activeMembership, blockedReason, refresh } = useAuth();
  const business = activeMembership?.business;
  const role = activeMembership?.role;
  const canPay = role === "owner" || role === "admin";

  const [row, setRow] = useState<BusinessRow | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [info, setInfo] = useState({ instructions: "", support: "" });
  const [loading, setLoading] = useState(true);

  const [planId, setPlanId] = useState("");
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !business) return;

    const [rowResult, plansResult, paymentsResult, requestsResult, infoResult] =
      await Promise.all([
        supabase
          .from("businesses")
          .select("plan_id, status, trial_ends_at, subscription_ends_at, currency")
          .eq("id", business.id)
          .maybeSingle(),
        supabase.from("plans").select("*").eq("active", true).order("sort_order"),
        supabase
          .from("subscription_payments")
          .select("id, plan_id, amount, currency, months, period_end, status, created_at, receipt_number, method, reference")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payment_requests")
          .select("id, plan_id, months, amount, currency, status, reject_reason, reference, created_at")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.rpc("get_payment_info"),
      ]);

    const businessRow = rowResult.data as BusinessRow | null;
    const planList = (plansResult.data as Plan[] | null) ?? [];

    setRow(businessRow);
    setPlans(planList);
    setPayments((paymentsResult.data as PaymentRow[] | null) ?? []);
    setRequests((requestsResult.data as RequestRow[] | null) ?? []);
    setInfo((infoResult.data as { instructions: string; support: string } | null) ?? { instructions: "", support: "" });
    setPlanId((current) => current || businessRow?.plan_id || planList[0]?.id || "");
    setLoading(false);
  }, [supabase, business]);

  useEffect(() => {
    void load();
  }, [load]);

  const plan = plans.find((item) => item.id === planId);
  const suggested = plan ? plan.price_monthly * months : 0;
  const shownAmount = touched ? amount : suggested ? String(suggested) : "";
  const currency = row?.currency ?? business?.currency ?? "COP";

  const reference_date =
    row?.status === "trial" ? row.trial_ends_at : row?.subscription_ends_at;
  const days = reference_date
    ? Math.ceil((new Date(reference_date).getTime() - Date.now()) / 86_400_000)
    : null;

  function statusText(): { title: string; detail: string; style: string } {
    if (!row) return { title: "Cargando...", detail: "", style: "bg-slate-100 text-slate-700" };

    if (row.status === "suspended") {
      return { title: "Suspendida", detail: blockedReason ?? "Comunícate con soporte.", style: "bg-rose-100 text-rose-800" };
    }

    if (row.status === "cancelled") {
      return { title: "Cancelada", detail: "La suscripción fue cancelada.", style: "bg-slate-200 text-slate-700" };
    }

    const label = row.status === "trial" ? "Prueba gratuita" : "Suscripción activa";

    if (days === null) return { title: label, detail: "", style: "bg-emerald-100 text-emerald-800" };

    if (days < 0) {
      return {
        title: `${row.status === "trial" ? "Prueba vencida" : "Suscripción vencida"}`,
        detail: `Venció el ${formatDate(reference_date ?? null)}. Realiza tu pago para volver a usar STIAN.`,
        style: "bg-orange-200 text-orange-900",
      };
    }

    return {
      title: label,
      detail: `Hasta el ${formatDate(reference_date ?? null)} · ${days === 0 ? "vence hoy" : `faltan ${days} ${days === 1 ? "día" : "días"}`}`,
      style: days <= 7 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
    };
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase || !business) return;

    const value = Number(shownAmount);

    if (!planId) {
      setError("Elige un plan.");
      return;
    }

    if (!Number.isFinite(value) || value < 0) {
      setError("Escribe el valor que pagaste.");
      return;
    }

    setBusy(true);

    const { error: rpcError } = await supabase.rpc("request_payment", {
      p_business: business.id,
      p_plan: planId,
      p_months: months,
      p_amount: value,
      p_method: method,
      p_reference: reference || null,
      p_notes: notes || null,
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setMessage(
      "Recibimos el aviso de tu pago. Lo confirmaremos pronto y tu suscripción se activará. Te avisaremos por correo.",
    );
    setReference("");
    setNotes("");
    await load();
    await refresh();
  }

  if (!business) return null;

  const status = statusText();
  const planName = (id: string | null) => plans.find((item) => item.id === id)?.name ?? null;

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            {business.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Suscripción y pagos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Consulta tu plan, paga y descarga tus comprobantes.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-8 lg:p-10">
        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Estado de tu cuenta</p>
              <p className="mt-1 text-lg font-bold">{status.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{status.detail}</p>
            </div>

            <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${status.style}`}>
              {planName(row?.plan_id ?? null) ?? "Sin plan elegido"}
            </span>
          </div>
        </section>

        {!canPay && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Solo el propietario o un administrador puede pagar la suscripción. Puedes consultar el
            estado aquí.
          </p>
        )}

        {loading && <p className="text-sm text-slate-500">Cargando...</p>}

        <section>
          <h2 className="mb-3 font-bold">1. Elige tu plan</h2>

          {plans.length === 0 && !loading && (
            <p className="text-sm text-slate-500">Aún no hay planes disponibles. Comunícate con soporte.</p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((item) => {
              const selected = item.id === planId;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canPay}
                  onClick={() => {
                    setPlanId(item.id);
                    setTouched(false);
                  }}
                  className={`${cardClass} text-left transition ${
                    selected
                      ? "ring-2 ring-violet-500"
                      : "hover:border-violet-300"
                  } disabled:cursor-default`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    {item.id === row?.plan_id && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                        Tu plan
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-2xl font-extrabold">
                    {item.price_monthly > 0 ? money(item.price_monthly, item.currency) : "Consultar"}
                    {item.price_monthly > 0 && (
                      <span className="text-sm font-medium text-slate-500"> / mes</span>
                    )}
                  </p>

                  {item.description && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                  )}

                  <ul className="mt-3 space-y-1 text-sm">
                    <li>
                      👥 {item.max_users ? `Hasta ${item.max_users} usuarios` : "Usuarios ilimitados"}
                    </li>
                    {item.modules.length > 0 && (
                      <li className="text-slate-500 dark:text-slate-400">
                        {item.modules
                          .map((id) => MODULES.find((module) => module.id === id)?.label)
                          .filter(Boolean)
                          .join(" · ")}
                      </li>
                    )}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        {canPay && (
          <section className={cardClass}>
            <h2 className="font-bold">2. Paga y avísanos</h2>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">
                  Periodo a pagar
                  <select
                    value={months}
                    onChange={(event) => {
                      setMonths(Number(event.target.value));
                      setTouched(false);
                    }}
                    className={`${inputClass} mt-1`}
                  >
                    {[1, 2, 3, 6, 12].map((item) => (
                      <option key={item} value={item}>
                        {item} {item === 1 ? "mes" : "meses"}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-900 dark:bg-violet-500/10 dark:text-violet-100">
                  Total a pagar:{" "}
                  <strong className="text-lg">
                    {suggested > 0 ? money(suggested, currency) : "según tu plan"}
                  </strong>
                </p>

                <div className="mt-4">
                  <p className="text-sm font-semibold">Cómo pagar</p>
                  <p className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
                    {info.instructions ||
                      "Aún no se han configurado las instrucciones de pago. Comunícate con soporte."}
                  </p>
                  {info.support && (
                    <p className="mt-2 text-xs text-slate-500">Soporte: {info.support}</p>
                  )}
                </div>
              </div>

              <form onSubmit={report} noValidate className="space-y-3">
                <p className="text-sm font-semibold">Cuando pagues, avísanos aquí</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Valor pagado
                    <input
                      type="number"
                      min="0"
                      value={shownAmount}
                      onChange={(event) => {
                        setTouched(true);
                        setAmount(event.target.value);
                      }}
                      className={`${inputClass} mt-1`}
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Forma de pago
                    <select
                      value={method}
                      onChange={(event) => setMethod(event.target.value)}
                      className={`${inputClass} mt-1`}
                    >
                      {METHODS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm font-medium">
                  Número de comprobante o referencia
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Ej. número de la transferencia"
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Notas (opcional)
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>

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

                <button type="submit" disabled={busy || !planId} className={primaryButton}>
                  {busy ? "Enviando..." : "Ya pagué, avisar"}
                </button>
              </form>
            </div>
          </section>
        )}

        {requests.length > 0 && (
          <section className={cardClass}>
            <h2 className="font-bold">Tus avisos de pago</h2>

            <ul className="mt-3 divide-y divide-slate-200 text-sm dark:divide-white/10">
              {requests.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {formatDate(item.created_at)} · {planName(item.plan_id) ?? "Plan"} · {item.months}{" "}
                    {item.months === 1 ? "mes" : "meses"} · {money(Number(item.amount), item.currency)}
                    {item.status === "rejected" && item.reject_reason && (
                      <span className="block text-xs text-rose-600">Motivo: {item.reject_reason}</span>
                    )}
                  </span>
                  <span
                    className={`self-start rounded-full px-3 py-1 text-xs font-bold ${REQUEST_LABELS[item.status].style}`}
                  >
                    {REQUEST_LABELS[item.status].text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={cardClass}>
          <h2 className="font-bold">Historial de pagos</h2>

          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Todavía no tienes pagos confirmados.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 text-sm dark:divide-white/10">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className={payment.status === "voided" ? "opacity-50" : ""}>
                    <strong>No. {payment.receipt_number ?? "—"}</strong> · {formatDate(payment.created_at)} ·{" "}
                    {payment.months} {payment.months === 1 ? "mes" : "meses"} · activa hasta{" "}
                    {formatDate(payment.period_end)}
                    {payment.status === "voided" && (
                      <span className="ml-2 text-xs text-rose-600">anulado</span>
                    )}
                  </span>

                  <span className="flex items-center gap-3">
                    <strong>{money(Number(payment.amount), payment.currency)}</strong>
                    {payment.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() =>
                          printSubscriptionReceipt({
                            number: payment.receipt_number,
                            businessName: business.name,
                            planName: planName(payment.plan_id),
                            amount: Number(payment.amount),
                            currency: payment.currency,
                            months: payment.months,
                            periodEnd: payment.period_end,
                            method: payment.method,
                            reference: payment.reference,
                            date: payment.created_at,
                          })
                        }
                        className={ghostButton}
                      >
                        Comprobante
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
