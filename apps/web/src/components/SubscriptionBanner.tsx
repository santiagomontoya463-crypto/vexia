"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth/AuthProvider";

/** Aviso para el propietario cuando la prueba o la suscripción está por vencer. */
export default function SubscriptionBanner() {
  const { activeMembership, isMaster } = useAuth();
  const [hidden, setHidden] = useState(false);

  const business = activeMembership?.business;
  const role = activeMembership?.role;

  if (!business || isMaster || hidden) return null;
  if (role !== "owner" && role !== "admin") return null;
  if (business.status !== "trial" && business.status !== "active") return null;

  const reference =
    business.status === "trial" ? business.trial_ends_at : business.subscription_ends_at;

  if (!reference) return null;

  const days = Math.ceil((new Date(reference).getTime() - Date.now()) / 86_400_000);

  if (days > 7 || days < 0) return null;

  const what = business.status === "trial" ? "Tu prueba gratuita" : "Tu suscripción";
  const when = days === 0 ? "vence hoy" : `vence en ${days} ${days === 1 ? "día" : "días"}`;

  return (
    <div
      role="status"
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <span>
        <strong>{what}</strong> {when}. Renueva a tiempo para no perder el acceso.
      </span>

      <span className="flex gap-2">
        <Link
          href="/suscripcion"
          className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Ver planes y pagar
        </Link>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold"
        >
          Ocultar
        </button>
      </span>
    </div>
  );
}
