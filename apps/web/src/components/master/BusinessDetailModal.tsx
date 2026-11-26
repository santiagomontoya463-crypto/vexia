"use client";

import { useEffect, useState } from "react";
import { ROLE_LABELS, useAuth, type BusinessRole } from "../../lib/auth/AuthProvider";
import {
  ACTION_LABELS,
  COLLECTION_LABELS,
  STATE_LABELS,
  STATE_STYLES,
  effectiveState,
  formatDate,
  formatDateTime,
  ghostButton,
  money,
  type MasterBusiness,
} from "./shared";

type Detail = {
  team: {
    email: string | null;
    full_name: string | null;
    role: BusinessRole;
    status: string;
    created_at: string;
  }[];
  usage: Record<string, number>;
  last_activity: string | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  months: number;
  period_end: string;
  status: string;
  created_at: string;
  method: string;
};

type AuditRow = {
  id: number;
  user_email: string | null;
  action: string;
  created_at: string;
};

export default function BusinessDetailModal({
  business,
  onClose,
  onPayment,
  onManage,
}: {
  business: MasterBusiness;
  onClose: () => void;
  onPayment: () => void;
  onManage: () => void;
}) {
  const { supabase } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      const [detailResult, paymentsResult, auditResult] = await Promise.all([
        supabase!.rpc("master_business_detail", { p_business: business.id }),
        supabase!.rpc("master_list_payments", { p_business: business.id }),
        supabase!.rpc("master_list_audit", { p_business: business.id, p_limit: 15 }),
      ]);

      if (cancelled) return;

      setDetail((detailResult.data as Detail | null) ?? null);
      setPayments((paymentsResult.data as PaymentRow[] | null) ?? []);
      setAudit((auditResult.data as AuditRow[] | null) ?? []);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, business.id]);

  const state = effectiveState(business);
  const usage = Object.entries(detail?.usage ?? {}).filter(
    ([key]) => COLLECTION_LABELS[key],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{business.name}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {business.business_type ?? "Sin tipo"} · creada el {formatDate(business.created_at)}
            </p>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATE_STYLES[state]}`}>
            {STATE_LABELS[state]}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onPayment} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
            Registrar pago
          </button>
          <button type="button" onClick={onManage} className={ghostButton}>
            Gestionar
          </button>
          <button type="button" onClick={onClose} className={ghostButton}>
            Cerrar
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Propietario</dt>
            <dd className="truncate font-medium">{business.owner_email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Plan</dt>
            <dd className="font-medium">{business.plan_name ?? "Sin plan"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Prueba hasta</dt>
            <dd className="font-medium">{formatDate(business.trial_ends_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Suscripción hasta</dt>
            <dd className="font-medium">{formatDate(business.subscription_ends_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Pagado en total</dt>
            <dd className="font-medium">{money(business.payments_total, business.currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Última actividad</dt>
            <dd className="font-medium">{formatDateTime(detail?.last_activity ?? business.last_activity)}</dd>
          </div>
        </dl>

        {loading && <p className="mt-6 text-sm text-slate-500">Cargando detalle...</p>}

        {!loading && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="font-bold">Equipo ({detail?.team.length ?? 0})</h3>
              <ul className="mt-2 divide-y divide-slate-200 text-sm dark:divide-white/10">
                {(detail?.team ?? []).map((member, index) => (
                  <li key={`${member.email}-${index}`} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {member.full_name || member.email}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{member.email}</span>
                    </span>
                    <span className="shrink-0 text-xs">
                      {ROLE_LABELS[member.role]}
                      {member.status !== "active" && " · desactivado"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-bold">Uso de la aplicación</h3>
              {usage.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Todavía no ha registrado datos.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-200 text-sm dark:divide-white/10">
                  {usage.map(([key, count]) => (
                    <li key={key} className="flex justify-between py-2">
                      <span>{COLLECTION_LABELS[key]}</span>
                      <span className="font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="font-bold">Pagos</h3>
              {payments.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Sin pagos registrados.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-200 text-sm dark:divide-white/10">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex justify-between gap-3 py-2">
                      <span>
                        {formatDate(payment.created_at)} · {payment.months}{" "}
                        {payment.months === 1 ? "mes" : "meses"}
                        {payment.status === "voided" && (
                          <span className="ml-2 text-xs text-rose-600">anulado</span>
                        )}
                      </span>
                      <span className="font-semibold">{money(payment.amount, payment.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="font-bold">Actividad reciente</h3>
              {audit.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Sin movimientos registrados.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {audit.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{ACTION_LABELS[item.action] ?? item.action}</span>
                      <span className="block text-xs text-slate-500">
                        {formatDateTime(item.created_at)}
                        {item.user_email ? ` · ${item.user_email}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
