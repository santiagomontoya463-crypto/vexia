"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import AdminsTab from "../../components/master/AdminsTab";
import AuditTab from "../../components/master/AuditTab";
import BusinessDetailModal from "../../components/master/BusinessDetailModal";
import BusinessesTab from "../../components/master/BusinessesTab";
import CollectionsTab, { type PaymentRequest } from "../../components/master/CollectionsTab";
import CreateBusinessModal, { type CreatePrefill } from "../../components/master/CreateBusinessModal";
import OverviewTab from "../../components/master/OverviewTab";
import PaymentModal from "../../components/master/PaymentModal";
import PaymentsTab from "../../components/master/PaymentsTab";
import PlansTab from "../../components/master/PlansTab";
import ProspectsTab, { type Prospect } from "../../components/master/ProspectsTab";
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
  | "inscribir"
  | "cobros"
  | "pagos"
  | "planes"
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
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [missingProspects, setMissingProspects] = useState(false);
  const [trialDays, setTrialDays] = useState("3");
  const [instructions, setInstructions] = useState("");
  const [support, setSupport] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentFor, setPaymentFor] = useState<string | null | undefined>(undefined);
  const [paymentsKey, setPaymentsKey] = useState(0);
  const [detail, setDetail] = useState<MasterBusiness | null>(null);
  const [creating, setCreating] = useState<CreatePrefill | null>(null);

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
      prospectsResult,
    ] = await Promise.all([
      supabase.rpc("master_overview"),
      supabase.rpc("master_list_businesses"),
      supabase.rpc("master_metrics"),
      supabase.from("plans").select("*").order("sort_order"),
      supabase.from("platform_settings").select("key, value"),
      supabase.rpc("master_list_payment_requests", { p_status: "pending" }),
      supabase.from("business_prospects").select("*").order("created_at", { ascending: false }),
    ]);

    if (overviewResult.error || businessesResult.error) {
      setError(
        "No fue posible cargar los datos del panel. Revisa que hayas ejecutado las migraciones de Supabase (0007 a 0010) y que tu usuario sea administrador de la plataforma.",
      );
    }

    setOverview((overviewResult.data as Overview | null) ?? null);
    setBusinesses((businessesResult.data as MasterBusiness[] | null) ?? []);
    setMetrics((metricsResult.data as Metrics | null) ?? null);
    setPlans((plansResult.data as Plan[] | null) ?? []);
    setRequests((requestsResult.data as PaymentRequest[] | null) ?? []);
    setMissingProspects(Boolean(prospectsResult.error));
    setProspects((prospectsResult.data as Prospect[] | null) ?? []);

    const settings = (settingsResult.data ?? []) as { key: string; value: unknown }[];
    const read = (key: string) => settings.find((item) => item.key === key)?.value;

    if (read("trial_days") !== undefined) setTrialDays(String(read("trial_days")));
    setInstructions(String(read("payment_instructions") ?? ""));
    setSupport(String(read("support_contact") ?? ""));

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (ready && isMaster) void loadAll();
  }, [ready, isMaster, loadAll]);

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 7000);
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

  const readyToEnroll = prospects.filter((item) => item.status === "ready").length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "empresas", label: "Empresas", badge: expired },
    { id: "inscribir", label: "Por inscribir", badge: readyToEnroll },
    { id: "cobros", label: "Cobros", badge: requests.length },
    { id: "pagos", label: "Pagos" },
    { id: "planes", label: "Planes" },
    { id: "auditoria", label: "Auditoría" },
    { id: "admins", label: "Administradores" },
    { id: "ajustes", label: "Ajustes" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              Propietario de la plataforma
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Panel Master</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Inscribe cuentas, cobra, y controla empresas, planes, equipo y actividad.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreating({})}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20"
          >
            + Inscribir empresa
          </button>
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
            onCreate={() => setCreating({})}
            flash={flash}
            setError={setError}
          />
        )}

        {tab === "inscribir" && (
          <ProspectsTab
            prospects={prospects}
            missingTable={missingProspects}
            plans={plans}
            onChanged={loadAll}
            onEnroll={(prefill) => setCreating(prefill)}
            flash={flash}
            setError={setError}
          />
        )}

        {tab === "cobros" && (
          <CollectionsTab
            businesses={businesses}
            plans={plans}
            requests={requests}
            overview={overview}
            onChanged={async () => {
              setPaymentsKey((value) => value + 1);
              await loadAll();
            }}
            onPayment={(id) => setPaymentFor(id)}
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

        {tab === "auditoria" && <AuditTab businesses={businesses} setError={setError} />}

        {tab === "admins" && <AdminsTab flash={flash} setError={setError} />}

        {tab === "ajustes" && (
          <SettingsTab
            initialTrialDays={trialDays}
            initialInstructions={instructions}
            initialSupport={support}
            flash={flash}
            setError={setError}
          />
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

      {creating && (
        <CreateBusinessModal
          plans={plans}
          trialDays={trialDays}
          prefill={creating}
          onClose={() => setCreating(null)}
          onCreated={() => void loadAll()}
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
