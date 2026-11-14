"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import BusinessTypePicker from "./BusinessTypePicker";

export default function BusinessTypeCard() {
  const { supabase, activeMembership, refresh } = useAuth();
  const business = activeMembership?.business;
  const role = activeMembership?.role;
  const canEdit = role === "owner" || role === "admin";

  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!business) return null;

  const current = selected ?? business.business_type ?? "";
  const changed = current.trim() !== "" && current !== (business.business_type ?? "");

  async function save() {
    if (!supabase || !business) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("businesses")
      .update({ business_type: current })
      .eq("id", business.id);

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    await refresh();
    setBusy(false);
    setMessage("Listo: los nombres de la aplicación ya se adaptaron a tu negocio.");
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-bold text-slate-900 dark:text-white">
        Tipo de negocio
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        STIAN adapta el lenguaje (citas, pacientes, órdenes de servicio,
        técnicos…) y las sugerencias a tu tipo de negocio.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-md">
          <BusinessTypePicker
            value={current}
            disabled={!canEdit}
            onChange={setSelected}
          />
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => void save()}
            disabled={!changed || busy}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {busy ? "Guardando..." : "Guardar tipo"}
          </button>
        )}
      </div>

      {!canEdit && (
        <p className="mt-2 text-xs text-slate-500">
          Solo el propietario o un administrador puede cambiarlo.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    </section>
  );
}
