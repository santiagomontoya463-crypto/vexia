"use client";

import { useState, type FormEvent } from "react";
import { MODULES } from "../../lib/modules";
import {
  inputClass,
  primaryButton,
  toDateInput,
  type MasterBusiness,
  type Plan,
} from "./shared";

export type ManageChanges = {
  status?: string;
  plan?: string;
  trialEnds?: string;
  subscriptionEnds?: string;
  modules?: string[];
  reason?: string;
};

export default function ManageModal({
  business,
  plans,
  onClose,
  onSave,
}: {
  business: MasterBusiness;
  plans: Plan[];
  onClose: () => void;
  onSave: (changes: ManageChanges) => Promise<void>;
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
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10"
          >
            Cancelar
          </button>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
