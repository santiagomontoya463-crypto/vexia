"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import BusinessDetailModal from "./BusinessDetailModal";
import ManageModal, { type ManageChanges } from "./ManageModal";
import {
  STATE_LABELS,
  STATE_STYLES,
  cardClass,
  daysUntil,
  effectiveState,
  formatDate,
  ghostButton,
  inputClass,
  money,
  type EffectiveState,
  type MasterBusiness,
  type Plan,
} from "./shared";

function dateNote(business: MasterBusiness, state: EffectiveState): string {
  const reference =
    business.status === "trial" ? business.trial_ends_at : business.subscription_ends_at;
  const days = daysUntil(reference);

  if (days === null) return "";

  if (state === "trial_expired" || state === "subscription_expired") {
    return `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`;
  }

  if (state === "trial" || state === "active") {
    return days <= 0 ? "Vence hoy" : `Faltan ${days} ${days === 1 ? "día" : "días"}`;
  }

  return "";
}

export default function BusinessesTab({
  businesses,
  plans,
  loading,
  onChanged,
  onPayment,
  onExtend,
  onCreate,
  flash,
  setError,
}: {
  businesses: MasterBusiness[];
  plans: Plan[];
  loading: boolean;
  onChanged: () => Promise<void>;
  onPayment: (businessId: string) => void;
  onExtend: (business: MasterBusiness) => void;
  onCreate: () => void;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todas");
  const [managing, setManaging] = useState<MasterBusiness | null>(null);
  const [detail, setDetail] = useState<MasterBusiness | null>(null);

  const term = search.trim().toLowerCase();

  const visible = businesses.filter((business) => {
    const state = effectiveState(business);

    const matchesSearch =
      business.name.toLowerCase().includes(term) ||
      (business.owner_email ?? "").toLowerCase().includes(term) ||
      (business.business_type ?? "").toLowerCase().includes(term);

    const matchesFilter =
      filter === "todas" ||
      (filter === "vencidas"
        ? state === "trial_expired" || state === "subscription_expired"
        : state === filter);

    return matchesSearch && matchesFilter;
  });

  async function update(business: MasterBusiness, changes: ManageChanges) {
    if (!supabase) return false;

    const { error } = await supabase.rpc("master_update_business", {
      p_business: business.id,
      p_status: changes.status ?? null,
      p_plan: changes.plan ?? null,
      p_trial_ends: changes.trialEnds ?? null,
      p_subscription_ends: changes.subscriptionEnds ?? null,
      p_modules: changes.modules ?? null,
      p_reason: changes.reason ?? null,
    });

    if (error) {
      setError(error.message);
      return false;
    }

    setError("");
    await onChanged();
    return true;
  }

  async function toggleSuspension(business: MasterBusiness) {
    if (business.status === "suspended") {
      if (await update(business, { status: "active" })) {
        flash(`${business.name} fue reactivada.`);
      }
      return;
    }

    const reason = window.prompt(`Motivo de la suspensión de ${business.name} (opcional):`);

    if (reason === null) return;

    if (await update(business, { status: "suspended", reason: reason.trim() || undefined })) {
      flash(`${business.name} fue suspendida.`);
    }
  }

  async function cancelBusiness(business: MasterBusiness) {
    const confirmed = window.confirm(
      `¿Cancelar ${business.name}? Sus usuarios perderán el acceso. Los datos se conservan y puedes reactivarla después.`,
    );

    if (!confirmed) return;

    if (await update(business, { status: "cancelled" })) {
      flash(`${business.name} fue cancelada.`);
    }
  }

  async function deleteBusiness(business: MasterBusiness) {
    const typed = window.prompt(
      `Esto elimina PARA SIEMPRE ${business.name} y todos sus datos.\\nPara confirmar, escribe el nombre exacto de la empresa:`,
    );

    if (typed === null) return;

    if (typed.trim() !== business.name) {
      setError("El nombre no coincide. No se eliminó nada.");
      return;
    }

    if (!supabase) return;

    const { error } = await supabase.rpc("master_delete_business", {
      p_business: business.id,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash(`${business.name} fue eliminada.`);
    await onChanged();
  }

  const filters = [
    { id: "todas", label: "Todas" },
    { id: "vencidas", label: "Vencidas" },
    { id: "trial", label: "En prueba" },
    { id: "active", label: "Activas" },
    { id: "suspended", label: "Suspendidas" },
    { id: "cancelled", label: "Canceladas" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por empresa, propietario o tipo..."
          className={`${inputClass} lg:max-w-sm`}
        />

        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20"
        >
          + Inscribir empresa
        </button>

        <div className="flex flex-wrap gap-2">
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
      </div>

      {visible.length === 0 && !loading && (
        <p className="text-sm text-slate-500">No hay empresas con esos criterios.</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visible.map((business) => {
          const state = effectiveState(business);
          const note = dateNote(business, state);

          return (
            <article key={business.id} className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{business.name}</h2>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {business.owner_email ?? "Sin propietario"} · {business.members_count}{" "}
                    {business.members_count === 1 ? "usuario" : "usuarios"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATE_STYLES[state]}`}
                >
                  {STATE_LABELS[state]}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Plan</dt>
                  <dd className="font-medium">{business.plan_name ?? "Sin plan"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tipo</dt>
                  <dd className="truncate font-medium">{business.business_type ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">
                    {business.status === "trial" ? "Prueba hasta" : "Suscripción hasta"}
                  </dt>
                  <dd className="font-medium">
                    {formatDate(
                      business.status === "trial"
                        ? business.trial_ends_at
                        : business.subscription_ends_at,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Pagado</dt>
                  <dd className="font-medium">{money(business.payments_total, business.currency)}</dd>
                </div>
              </dl>

              {note && (
                <p
                  className={`mt-3 text-xs font-semibold ${
                    state.endsWith("expired") ? "text-orange-700" : "text-slate-500"
                  }`}
                >
                  {note}
                </p>
              )}

              {business.status === "suspended" && business.suspended_reason && (
                <p className="mt-2 text-xs text-rose-600">Motivo: {business.suspended_reason}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onPayment(business.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Registrar pago
                </button>
                <button type="button" onClick={() => setDetail(business)} className={ghostButton}>
                  Detalle
                </button>
                <button type="button" onClick={() => setManaging(business)} className={ghostButton}>
                  Gestionar
                </button>
                <button type="button" onClick={() => onExtend(business)} className={ghostButton}>
                  Extender prueba
                </button>
                {business.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => void toggleSuspension(business)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      business.status === "suspended"
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    {business.status === "suspended" ? "Reactivar" : "Suspender"}
                  </button>
                )}
                {business.status !== "cancelled" ? (
                  <button
                    type="button"
                    onClick={() => void cancelBusiness(business)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void deleteBusiness(business)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {managing && (
        <ManageModal
          business={managing}
          plans={plans}
          onClose={() => setManaging(null)}
          onSave={async (changes) => {
            if (await update(managing, changes)) {
              flash(`${managing.name} actualizada.`);
              setManaging(null);
            }
          }}
        />
      )}

      {detail && (
        <BusinessDetailModal
          business={detail}
          onClose={() => setDetail(null)}
          onPayment={() => {
            onPayment(detail.id);
            setDetail(null);
          }}
          onManage={() => {
            setManaging(detail);
            setDetail(null);
          }}
        />
      )}
    </section>
  );
}
