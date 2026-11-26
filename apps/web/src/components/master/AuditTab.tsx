"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  ACTION_LABELS,
  cardClass,
  formatDateTime,
  inputClass,
  type MasterBusiness,
} from "./shared";

type Row = {
  id: number;
  business_id: string | null;
  business_name: string | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

function summarize(details: Record<string, unknown> | null): string {
  if (!details) return "";

  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) =>
      `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    )
    .join(" · ")
    .slice(0, 160);
}

export default function AuditTab({
  businesses,
  setError,
}: {
  businesses: MasterBusiness[];
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [businessId, setBusinessId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase!.rpc("master_list_audit", {
        p_business: businessId || null,
        p_limit: 200,
      });

      if (cancelled) return;

      if (error) setError(error.message);

      setRows((data as Row[] | null) ?? []);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, businessId, setError]);

  return (
    <section className="space-y-4">
      <label className="block text-sm font-medium sm:max-w-xs">
        Empresa
        <select
          value={businessId}
          onChange={(event) => setBusinessId(event.target.value)}
          className={`${inputClass} mt-1`}
        >
          <option value="">Toda la plataforma</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </label>

      <div className={cardClass}>
        {loading && <p className="text-sm text-slate-500">Cargando...</p>}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-slate-500">No hay movimientos registrados.</p>
        )}

        <ul className="divide-y divide-slate-200 dark:divide-white/10">
          {rows.map((row) => (
            <li key={row.id} className="py-3 text-sm">
              <p className="font-semibold">{ACTION_LABELS[row.action] ?? row.action}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateTime(row.created_at)}
                {row.user_email ? ` · ${row.user_email}` : ""}
                {row.business_name ? ` · ${row.business_name}` : ""}
              </p>
              {summarize(row.details) && (
                <p className="mt-1 break-words text-xs text-slate-400">{summarize(row.details)}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
