"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  cardClass,
  formatDate,
  ghostButton,
  inputClass,
  primaryButton,
} from "./shared";

type Admin = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export default function AdminsTab({
  flash,
  setError,
}: {
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase, user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase.rpc("master_list_admins");

    if (error) setError(error.message);

    setAdmins((data as Admin[] | null) ?? []);
  }, [supabase, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    setBusy(true);
    setError("");

    const { error } = await supabase.rpc("master_add_admin", { p_email: email });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    flash(`${email.trim().toLowerCase()} ahora es administrador de la plataforma.`);
    setEmail("");
    await load();
  }

  async function remove(admin: Admin) {
    const confirmed = window.confirm(
      `¿Quitar a ${admin.email} como administrador de la plataforma? Seguirá teniendo su cuenta y su empresa, pero perderá el acceso al panel Master.`,
    );

    if (!confirmed || !supabase) return;

    const { error } = await supabase.rpc("master_remove_admin", { p_user: admin.user_id });

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash("Administrador quitado.");
    await load();
  }

  return (
    <section className="space-y-4">
      <div className={cardClass}>
        <h2 className="font-bold">Agregar administrador</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Un administrador de la plataforma ve y controla todas las empresas. La persona debe
          haber creado antes su cuenta en STIAN con ese correo.
        </p>

        <form onSubmit={add} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            className={`${inputClass} sm:max-w-sm`}
          />
          <button type="submit" disabled={busy || !email.trim()} className={primaryButton}>
            {busy ? "Agregando..." : "Agregar"}
          </button>
        </form>
      </div>

      <div className={cardClass}>
        <h2 className="font-bold">Administradores actuales</h2>

        <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
          {admins.map((admin) => (
            <li key={admin.user_id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {admin.full_name || admin.email}
                  {admin.user_id === user?.id && (
                    <span className="ml-2 text-xs font-normal text-slate-500">(tú)</span>
                  )}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {admin.email} · desde {formatDate(admin.created_at)}
                </span>
              </span>

              {admin.user_id !== user?.id && (
                <button type="button" onClick={() => void remove(admin)} className={ghostButton}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
