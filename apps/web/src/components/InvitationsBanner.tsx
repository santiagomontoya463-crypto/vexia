"use client";

import { useCallback, useEffect, useState } from "react";
import { ROLE_LABELS, useAuth, type BusinessRole } from "../lib/auth/AuthProvider";

type Invitation = {
  id: string;
  business_id: string;
  business_name: string;
  role: BusinessRole;
  created_at: string;
};

/** Muestra las invitaciones pendientes de la persona que inició sesión. */
export default function InvitationsBanner({
  onAccepted,
}: {
  onAccepted?: (businessId: string) => void;
}) {
  const { supabase, user, refresh, setActiveBusiness } = useAuth();
  const [items, setItems] = useState<Invitation[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !user) return;

    const { data } = await supabase.rpc("my_pending_invitations");

    setItems((data as Invitation[] | null) ?? []);
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(item: Invitation) {
    if (!supabase) return;

    setBusyId(item.id);
    setError("");

    const { error: rpcError } = await supabase.rpc("accept_invitation", {
      p_invitation: item.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setBusyId(null);
      return;
    }

    await refresh();
    setActiveBusiness(item.business_id);
    setBusyId(null);
    await load();
    onAccepted?.(item.business_id);
  }

  async function decline(item: Invitation) {
    if (!supabase) return;

    setBusyId(item.id);

    await supabase.rpc("decline_invitation", { p_invitation: item.id });

    setBusyId(null);
    await load();
  }

  if (items.length === 0 && !error) return null;

  return (
    <section
      aria-label="Invitaciones pendientes"
      className="mb-5 rounded-2xl border border-violet-300 bg-violet-50 p-4 text-sm text-slate-900 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-slate-100"
    >
      <p className="font-bold">
        {items.length === 1 ? "Tienes una invitación" : "Tienes invitaciones"}
      </p>

      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <strong>{item.business_name}</strong> te invitó como{" "}
              {ROLE_LABELS[item.role].toLowerCase()}.
            </span>

            <span className="flex gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void accept(item)}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                Aceptar
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void decline(item)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold disabled:opacity-60 dark:border-white/20"
              >
                Rechazar
              </button>
            </span>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-red-600">{error}</p>}
    </section>
  );
}
