"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { MODULES } from "../../lib/modules";

type Overview = {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  cancelled: number;
  trials_expiring: number;
  users: number;
  mrr: number;
};

type MasterBusiness = {
  id: string;
  name: string;
  business_type: string | null;
  status: "trial" | "active" | "suspended" | "cancelled";
  suspended_reason: string | null;
  plan_id: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  enabled_modules: string[];
  created_at: string;
  owner_email: string | null;
  members_count: number;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  currency: string;
  modules: string[];
  max_users: number | null;
  active: boolean;
  sort_order: number;
};

type Tab = "resumen" | "empresas" | "planes" | "ajustes";

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

const STATUS_LABELS: Record<MasterBusiness["status"], string> = {
  trial: "En prueba",
  active: "Activa",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const STATUS_STYLES: Record<MasterBusiness["status"], string> = {
  trial: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-200 text-slate-700",
};

function money(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default function MasterPage() {
  const { supabase, isMaster, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("resumen");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [businesses, setBusinesses] = useState<MasterBusiness[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState("3");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [editing, setEditing] = useState<MasterBusiness | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    setError("");

    const [overviewResult, businessesResult, plansResult, settingsResult] =
      await Promise.all([
        supabase.rpc("master_overview"),
        supabase.rpc("master_list_businesses"),
        supabase.from("plans").select("*").order("sort_order"),
        supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "trial_days")
          .maybeSingle(),
      ]);

    if (overviewResult.error || businessesResult.error) {
      setError(
        "No fue posible cargar los datos del panel. ¿Ya ejecutaste la migración SQL y tu usuario está como administrador?",
      );
    }

    setOverview((overviewResult.data as Overview | null) ?? null);
    setBusinesses((businessesResult.data as MasterBusiness[] | null) ?? []);
    setPlans((plansResult.data as Plan[] | null) ?? []);

    if (settingsResult.data) {
      setTrialDays(String(settingsResult.data.value));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (ready && isMaster) void loadAll();
  }, [ready, isMaster, loadAll]);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  }

  async function updateBusiness(
    business: MasterBusiness,
    changes: {
      status?: string;
      plan?: string;
      trialEnds?: string;
      subscriptionEnds?: string;
      modules?: string[];
      reason?: string;
    },
  ) {
    if (!supabase) return false;

    const { error: rpcError } = await supabase.rpc("master_update_business", {
      p_business: business.id,
      p_status: changes.status ?? null,
      p_plan: changes.plan ?? null,
      p_trial_ends: changes.trialEnds ?? null,
      p_subscription_ends: changes.subscriptionEnds ?? null,
      p_modules: changes.modules ?? null,
      p_reason: changes.reason ?? null,
    });

    if (rpcError) {
      setError(rpcError.message);
      return false;
    }

    setError("");
    await loadAll();
    return true;
  }

  async function toggleSuspension(business: MasterBusiness) {
    if (business.status === "suspended") {
      const ok = await updateBusiness(business, { status: "active" });
      if (ok) flash(`${business.name} fue reactivada.`);
      return;
    }

    const reason = window.prompt(
      `Motivo de la suspensión de ${business.name} (opcional):`,
    );

    if (reason === null) return;

    const ok = await updateBusiness(business, {
      status: "suspended",
      reason: reason.trim() || undefined,
    });

    if (ok) flash(`${business.name} fue suspendida.`);
  }

  async function extendTrial(business: MasterBusiness) {
    const answer = window.prompt(
      `¿Cuántos días quieres agregar a la prueba de ${business.name}?`,
      "7",
    );

    if (answer === null) return;

    const days = Number(answer);

    if (!Number.isFinite(days) || days <= 0) {
      setError("Escribe un número de días mayor que cero.");
      return;
    }

    const base =
      business.trial_ends_at &&
      new Date(business.trial_ends_at).getTime() > Date.now()
        ? new Date(business.trial_ends_at)
        : new Date();

    base.setDate(base.getDate() + days);

    const ok = await updateBusiness(business, {
      status: "trial",
      trialEnds: base.toISOString(),
    });

    if (ok) flash(`Prueba extendida ${days} días.`);
  }

  async function saveTrialDays(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    const days = Number(trialDays);

    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError("Los días de prueba deben ser un número entero entre 0 y 365.");
      return;
    }

    const { error: updateError } = await supabase
      .from("platform_settings")
      .update({ value: days, updated_at: new Date().toISOString() })
      .eq("key", "trial_days");

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError("");
    flash("Prueba gratuita actualizada. Aplica a las empresas nuevas.");
  }

  async function savePlan(plan: Plan) {
    if (!supabase) return;

    const { error: updateError } = await supabase
      .from("plans")
      .update({
        name: plan.name.trim(),
        description: plan.description,
        price_monthly: plan.price_monthly,
        max_users: plan.max_users,
        active: plan.active,
        modules: plan.modules,
      })
      .eq("id", plan.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setError("");
    flash(`Plan ${plan.name} guardado.`);
    await loadAll();
  }

  async function createPlan() {
    if (!supabase) return;

    const name = window.prompt("Nombre del nuevo plan:");

    if (!name || !name.trim()) return;

    const { error: insertError } = await supabase.from("plans").insert({
      name: name.trim(),
      price_monthly: 0,
      modules: MODULES.map((module) => module.id),
      sort_order: plans.length + 1,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setError("");
    await loadAll();
  }

  function changePlan(id: string, changes: Partial<Plan>) {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, ...changes } : plan)),
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen p-10 text-sm text-slate-500">
        Cargando...
      </main>
    );
  }

  if (!isMaster) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No tienes permiso para ver el panel Master.
        </p>
      </main>
    );
  }

  const term = search.trim().toLowerCase();

  const visibleBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(term) ||
      (business.owner_email ?? "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "todas" || business.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "empresas", label: "Empresas" },
    { id: "planes", label: "Planes" },
    { id: "ajustes", label: "Ajustes" },
  ];

  const kpis = overview
    ? [
        { label: "Empresas", value: String(overview.total) },
        { label: "Activas", value: String(overview.active) },
        { label: "En prueba", value: String(overview.trial) },
        { label: "Suspendidas", value: String(overview.suspended) },
        { label: "Pruebas por vencer (7 días)", value: String(overview.trials_expiring) },
        { label: "Usuarios registrados", value: String(overview.users) },
        { label: "Ingreso mensual estimado", value: money(Number(overview.mrr)) },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Propietario de la plataforma
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Panel Master
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Administra empresas, planes, pruebas gratuitas y suspensiones.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8 lg:p-10">
        <nav className="flex flex-wrap gap-2" aria-label="Secciones del panel Master">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

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

        {loading && (
          <p className="text-sm text-slate-500">Cargando datos...</p>
        )}

        {tab === "resumen" && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className={cardClass}>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </p>
                <p className="mt-2 text-2xl font-bold sm:text-3xl">{kpi.value}</p>
              </div>
            ))}

            {!loading && !overview && (
              <p className="text-sm text-slate-500">
                Aún no hay datos para mostrar.
              </p>
            )}
          </section>
        )}

        {tab === "empresas" && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por empresa o correo del propietario..."
                className={`${inputClass} sm:max-w-sm`}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={`${inputClass} sm:max-w-[200px]`}
              >
                <option value="todas">Todos los estados</option>
                <option value="trial">En prueba</option>
                <option value="active">Activas</option>
                <option value="suspended">Suspendidas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            {visibleBusinesses.length === 0 && !loading && (
              <p className="text-sm text-slate-500">
                No hay empresas con esos criterios.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleBusinesses.map((business) => (
                <article key={business.id} className={cardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold">{business.name}</h2>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {business.owner_email ?? "Sin propietario"} ·{" "}
                        {business.members_count}{" "}
                        {business.members_count === 1 ? "usuario" : "usuarios"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[business.status]}`}
                    >
                      {STATUS_LABELS[business.status]}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Plan</dt>
                      <dd className="font-medium">{business.plan_name ?? "Sin plan"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Tipo</dt>
                      <dd className="font-medium">{business.business_type ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Prueba hasta</dt>
                      <dd className="font-medium">{formatDate(business.trial_ends_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Suscripción hasta</dt>
                      <dd className="font-medium">{formatDate(business.subscription_ends_at)}</dd>
                    </div>
                  </dl>

                  {business.status === "suspended" && business.suspended_reason && (
                    <p className="mt-3 text-xs text-rose-600">
                      Motivo: {business.suspended_reason}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(business)}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white/10"
                    >
                      Gestionar
                    </button>

                    <button
                      type="button"
                      onClick={() => void extendTrial(business)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
                    >
                      Extender prueba
                    </button>

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
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "planes" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define los precios y los módulos de cada plan.
              </p>
              <button
                type="button"
                onClick={() => void createPlan()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                + Nuevo plan
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className={cardClass}>
                  <div className="grid gap-3">
                    <label className="text-sm font-medium">
                      Nombre
                      <input
                        value={plan.name}
                        onChange={(event) =>
                          changePlan(plan.id, { name: event.target.value })
                        }
                        className={`${inputClass} mt-1`}
                      />
                    </label>

                    <label className="text-sm font-medium">
                      Descripción
                      <input
                        value={plan.description ?? ""}
                        onChange={(event) =>
                          changePlan(plan.id, { description: event.target.value })
                        }
                        className={`${inputClass} mt-1`}
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm font-medium">
                        Precio mensual (COP)
                        <input
                          type="number"
                          min="0"
                          value={plan.price_monthly}
                          onChange={(event) =>
                            changePlan(plan.id, {
                              price_monthly: Number(event.target.value),
                            })
                          }
                          className={`${inputClass} mt-1`}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Máx. usuarios
                        <input
                          type="number"
                          min="1"
                          placeholder="Sin límite"
                          value={plan.max_users ?? ""}
                          onChange={(event) =>
                            changePlan(plan.id, {
                              max_users: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                          className={`${inputClass} mt-1`}
                        />
                      </label>
                    </div>

                    <fieldset>
                      <legend className="text-sm font-medium">Módulos</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        {MODULES.map((module) => (
                          <label key={module.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={plan.modules.includes(module.id)}
                              onChange={(event) =>
                                changePlan(plan.id, {
                                  modules: event.target.checked
                                    ? [...plan.modules, module.id]
                                    : plan.modules.filter((item) => item !== module.id),
                                })
                              }
                            />
                            {module.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={plan.active}
                        onChange={(event) =>
                          changePlan(plan.id, { active: event.target.checked })
                        }
                      />
                      Plan disponible
                    </label>

                    <button
                      type="button"
                      onClick={() => void savePlan(plan)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white/10"
                    >
                      Guardar plan
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "ajustes" && (
          <section className={`${cardClass} max-w-xl`}>
            <h2 className="font-bold">Prueba gratuita</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Días de prueba que recibe cada empresa nueva. Para una empresa en
              particular usa «Extender prueba» en la pestaña Empresas.
            </p>

            <form onSubmit={saveTrialDays} className="mt-4 flex gap-3">
              <input
                type="number"
                min="0"
                max="365"
                value={trialDays}
                onChange={(event) => setTrialDays(event.target.value)}
                className={`${inputClass} max-w-[140px]`}
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Guardar
              </button>
            </form>
          </section>
        )}
      </div>

      {editing && (
        <ManageModal
          business={editing}
          plans={plans}
          onClose={() => setEditing(null)}
          onSave={async (changes) => {
            const ok = await updateBusiness(editing, changes);

            if (ok) {
              setEditing(null);
              flash(`${editing.name} actualizada.`);
            }
          }}
        />
      )}
    </main>
  );
}

function ManageModal({
  business,
  plans,
  onClose,
  onSave,
}: {
  business: MasterBusiness;
  plans: Plan[];
  onClose: () => void;
  onSave: (changes: {
    status?: string;
    plan?: string;
    trialEnds?: string;
    subscriptionEnds?: string;
    modules?: string[];
    reason?: string;
  }) => Promise<void>;
}) {
  const [status, setStatus] = useState<string>(business.status);
  const [plan, setPlan] = useState(business.plan_id ?? "");
  const [trialEnds, setTrialEnds] = useState(toDateInput(business.trial_ends_at));
  const [subscriptionEnds, setSubscriptionEnds] = useState(
    toDateInput(business.subscription_ends_at),
  );
  const [modules, setModules] = useState<string[]>(business.enabled_modules);
  const [reason, setReason] = useState(business.suspended_reason ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    await onSave({
      status,
      plan: plan || undefined,
      trialEnds: trialEnds ? new Date(`${trialEnds}T23:59:59`).toISOString() : undefined,
      subscriptionEnds: subscriptionEnds
        ? new Date(`${subscriptionEnds}T23:59:59`).toISOString()
        : undefined,
      modules,
      reason: reason.trim() || undefined,
    });

    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
      >
        <h2 className="text-lg font-bold">Gestionar {business.name}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Estado
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="trial">En prueba</option>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Plan
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Sin cambios</option>
              {plans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Prueba hasta
            <input
              type="date"
              value={trialEnds}
              onChange={(event) => setTrialEnds(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="text-sm font-medium">
            Suscripción hasta
            <input
              type="date"
              value={subscriptionEnds}
              onChange={(event) => setSubscriptionEnds(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>

        {status === "suspended" && (
          <label className="block text-sm font-medium">
            Motivo de la suspensión
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        )}

        <fieldset>
          <legend className="text-sm font-medium">Módulos activos</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {MODULES.map((module) => (
              <label key={module.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modules.includes(module.id)}
                  onChange={(event) =>
                    setModules((current) =>
                      event.target.checked
                        ? [...current, module.id]
                        : current.filter((item) => item !== module.id),
                    )
                  }
                />
                {module.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
