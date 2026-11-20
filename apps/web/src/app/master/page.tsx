"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import AccountsTab from "../../components/master/AccountsTab";
import AdminsTab from "../../components/master/AdminsTab";
import AuditTab from "../../components/master/AuditTab";
import BusinessDetailModal from "../../components/master/BusinessDetailModal";
import BusinessesTab from "../../components/master/BusinessesTab";
import OverviewTab from "../../components/master/OverviewTab";
import PaymentModal from "../../components/master/PaymentModal";
import PaymentsTab from "../../components/master/PaymentsTab";
import PlansTab from "../../components/master/PlansTab";
import RequestsTab from "../../components/master/RequestsTab";
import SettingsTab from "../../components/master/SettingsTab";
import type {
  MasterBusiness,
  Metrics,
  Overview,
  Plan,
} from "../../components/master/shared";
import { effectiveState } from "../../components/master/shared";

type Tab =
  | "resumen"
  | "empresas"
  | "pagos"
  | "solicitudes"
  | "planes"
  | "cuentas"
  | "auditoria"
  | "admins"
  | "ajustes";

export default function MasterPage() {
  const { supabase, isMaster, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("resumen");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [businesses, setBusinesses] = useState<MasterBusiness[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState("3");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentFor, setPaymentFor] = useState<string | null | undefined>(undefined);
  const [paymentsKey, setPaymentsKey] = useState(0);
  const [detail, setDetail] = useState<MasterBusiness | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  const loadAll = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    const [
      overviewResult,
      businessesResult,
      metricsResult,
      plansResult,
      settingsResult,
      requestsResult,
    ] =
      await Promise.all([
        supabase.rpc("master_overview"),
        supabase.rpc("master_list_businesses"),
        supabase.rpc("master_metrics"),
        supabase.from("plans").select("*").order("sort_order"),
        supabase.from("platform_settings").select("value").eq("key", "trial_days").maybeSingle(),
        supabase.rpc("master_list_requests", { p_status: "pending" }),
      ]);

    if (overviewResult.error || businessesResult.error) {
      setError(
        "No fue posible cargar los datos del panel. ¿Ya ejecutaste la migración 0007_master.sql en Supabase y tu usuario es administrador?",
      );
    }

    setOverview((overviewResult.data as Overview | null) ?? null);
    setBusinesses((businessesResult.data as MasterBusiness[] | null) ?? []);
    setMetrics((metricsResult.data as Metrics | null) ?? null);
    setPlans((plansResult.data as Plan[] | null) ?? []);

    if (settingsResult.data) setTrialDays(String(settingsResult.data.value));

    // Si la migración 0011 aún no se ejecutó, simplemente no hay solicitudes que contar.
    setPendingRequests(Array.isArray(requestsResult.data) ? requestsResult.data.length : 0);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (ready && isMaster) void loadAll();
  }, [ready, isMaster, loadAll]);

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 6000);
  }, []);

  async function extendTrial(business: MasterBusiness) {
    const answer = window.prompt(
      `¿Cuántos días de prueba quieres darle a ${business.name} a partir de hoy?`,
      "7",
    );

    if (answer === null || !supabase) return;

    const days = Number(answer);

    if (!Number.isFinite(days) || days <= 0) {
      setError("Escribe un número de días mayor que cero.");
      return;
    }

    // Si la prueba sigue vigente, se suma; si venció, cuenta desde hoy.
    const base =
      business.status === "trial" &&
      business.trial_ends_at &&
      new Date(business.trial_ends_at).getTime() > Date.now()
        ? new Date(business.trial_ends_at)
        : new Date();

    base.setDate(base.getDate() + days);

    const { error: rpcError } = await supabase.rpc("master_update_business", {
      p_business: business.id,
      p_status: "trial",
      p_plan: null,
      p_trial_ends: base.toISOString(),
      p_subscription_ends: null,
      p_modules: null,
      p_reason: null,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setError("");
    flash(`${business.name} tiene prueba activa hasta el ${base.toLocaleDateString("es-CO")}.`);
    await loadAll();
  }

  if (!ready) {
    return <main className="min-h-screen p-10 text-sm text-slate-500">Cargando...</main>;
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

  const expired = businesses.filter((business) => {
    const state = effectiveState(business);

    return state === "trial_expired" || state === "subscription_expired";
  }).length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "empresas", label: "Empresas", badge: expired },
    { id: "pagos", label: "Pagos" },
    { id: "solicitudes", label: "Solicitudes de pago", badge: pendingRequests },
    { id: "planes", label: "Planes" },
    { id: "cuentas", label: "Cuentas de cobro" },
    { id: "auditoria", label: "Auditoría" },
    { id: "admins", label: "Administradores" },
    { id: "ajustes", label: "Ajustes" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Propietario de la plataforma
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Panel Master</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Controla empresas, pagos, planes, equipo y actividad de toda la plataforma.
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
              }`}
            >
              {item.label}
              {item.badge ? (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
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

        {loading && <p className="text-sm text-slate-500">Cargando datos...</p>}

        {tab === "resumen" && (
          <OverviewTab
            overview={overview}
            metrics={metrics}
            businesses={businesses}
            loading={loading}
            onPayment={(id) => setPaymentFor(id)}
            onExtend={(business) => void extendTrial(business)}
            onDetail={setDetail}
          />
        )}

        {tab === "empresas" && (
          <BusinessesTab
            businesses={businesses}
            plans={plans}
            loading={loading}
            onChanged={loadAll}
            onPayment={(id) => setPaymentFor(id)}
            onExtend={(business) => void extendTrial(business)}
            flash={flash}
            setError={setError}
          />
        )}

        {tab === "pagos" && (
          <PaymentsTab
            refreshKey={paymentsKey}
            onNewPayment={() => setPaymentFor(null)}
            flash={flash}
            setError={setError}
          />
        )}

        {tab === "planes" && (
          <PlansTab plans={plans} onChanged={loadAll} flash={flash} setError={setError} />
        )}

        {tab === "solicitudes" && (
          <RequestsTab flash={flash} setError={setError} onChanged={loadAll} />
        )}

        {tab === "cuentas" && <AccountsTab flash={flash} setError={setError} />}

        {tab === "auditoria" && <AuditTab businesses={businesses} setError={setError} />}

        {tab === "admins" && <AdminsTab flash={flash} setError={setError} />}

        {tab === "ajustes" && (
          <SettingsTab initialTrialDays={trialDays} flash={flash} setError={setError} />
        )}
      </div>

      {paymentFor !== undefined && businesses.length > 0 && (
        <PaymentModal
          businesses={businesses}
          plans={plans}
          initialBusinessId={paymentFor ?? undefined}
          onClose={() => setPaymentFor(undefined)}
          onSaved={(text) => {
            setPaymentFor(undefined);
            setPaymentsKey((value) => value + 1);
            flash(text);
            void loadAll();
          }}
        />
      )}

      {detail && (
        <BusinessDetailModal
          business={detail}
          onClose={() => setDetail(null)}
          onPayment={() => {
            setPaymentFor(detail.id);
            setDetail(null);
          }}
          onManage={() => {
            setTab("empresas");
            setDetail(null);
          }}
        />
      )}
    </main>
  );
}
