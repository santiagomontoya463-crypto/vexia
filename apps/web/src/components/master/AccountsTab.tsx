"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  cardClass,
  ghostButton,
  inputClass,
  primaryButton,
  type PaymentAccount,
} from "./shared";

const KIND_LABELS: Record<PaymentAccount["kind"], string> = {
  bank: "Cuenta bancaria",
  wallet: "Billetera digital",
  other: "Otro medio",
};

type Draft = {
  id: string | null;
  label: string;
  kind: PaymentAccount["kind"];
  bank_name: string;
  account_type: string;
  account_number: string;
  holder_name: string;
  holder_document: string;
  instructions: string;
  active: boolean;
};

const EMPTY: Draft = {
  id: null,
  label: "",
  kind: "bank",
  bank_name: "",
  account_type: "",
  account_number: "",
  holder_name: "",
  holder_document: "",
  instructions: "",
  active: true,
};

export default function AccountsTab({
  flash,
  setError,
}: {
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("platform_payment_accounts")
      .select("*")
      .order("sort_order")
      .order("created_at");

    if (error) {
      setError(
        "No fue posible cargar las cuentas de cobro. ¿Ya ejecutaste la migración 0011_cobros.sql en Supabase?",
      );
    } else {
      setError("");
      setAccounts((data as PaymentAccount[] | null) ?? []);
    }

    setLoading(false);
  }, [supabase, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(account: PaymentAccount) {
    setDraft({
      id: account.id,
      label: account.label,
      kind: account.kind,
      bank_name: account.bank_name ?? "",
      account_type: account.account_type ?? "",
      account_number: account.account_number,
      holder_name: account.holder_name,
      holder_document: account.holder_document ?? "",
      instructions: account.instructions ?? "",
      active: account.active,
    });
  }

  function change(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !draft) return;

    if (!draft.label.trim() || !draft.account_number.trim() || !draft.holder_name.trim()) {
      setError("Escribe el nombre de la cuenta, el número y el titular.");
      return;
    }

    setSaving(true);

    const values = {
      label: draft.label.trim(),
      kind: draft.kind,
      bank_name: draft.bank_name.trim() || null,
      account_type: draft.account_type.trim() || null,
      account_number: draft.account_number.trim(),
      holder_name: draft.holder_name.trim(),
      holder_document: draft.holder_document.trim() || null,
      instructions: draft.instructions.trim() || null,
      active: draft.active,
    };

    const { error } = draft.id
      ? await supabase.from("platform_payment_accounts").update(values).eq("id", draft.id)
      : await supabase.from("platform_payment_accounts").insert(values);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash(draft.id ? "Cuenta actualizada." : "Cuenta creada.");
    setDraft(null);
    await load();
  }

  async function toggle(account: PaymentAccount) {
    if (!supabase) return;

    const { error } = await supabase
      .from("platform_payment_accounts")
      .update({ active: !account.active })
      .eq("id", account.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash(account.active ? "Cuenta ocultada para las empresas." : "Cuenta visible para las empresas.");
    await load();
  }

  async function remove(account: PaymentAccount) {
    if (!supabase) return;

    if (
      !window.confirm(
        `¿Eliminar la cuenta «${account.label}»? Las solicitudes de pago que la usaron se conservan.`,
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("platform_payment_accounts")
      .delete()
      .eq("id", account.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash("Cuenta eliminada.");
    await load();
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Cuentas de cobro</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Son las cuentas donde las empresas te transfieren su suscripción. Solo las activas se
              muestran en la pantalla «Suscripción» de cada empresa.
            </p>
          </div>

          {!draft && (
            <button type="button" onClick={() => setDraft({ ...EMPTY })} className={primaryButton}>
              Nueva cuenta
            </button>
          )}
        </div>
      </section>

      {draft && (
        <form onSubmit={save} className={`${cardClass} space-y-4`}>
          <h3 className="font-bold">{draft.id ? "Editar cuenta" : "Nueva cuenta"}</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Nombre para mostrar</span>
              <input
                value={draft.label}
                onChange={(event) => change({ label: event.target.value })}
                placeholder="Ej. Bancolombia ahorros"
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Tipo de medio</span>
              <select
                value={draft.kind}
                onChange={(event) => change({ kind: event.target.value as Draft["kind"] })}
                className={inputClass}
              >
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Banco o entidad</span>
              <input
                value={draft.bank_name}
                onChange={(event) => change({ bank_name: event.target.value })}
                placeholder="Ej. Bancolombia, Nequi"
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Tipo de cuenta</span>
              <input
                value={draft.account_type}
                onChange={(event) => change({ account_type: event.target.value })}
                placeholder="Ahorros, corriente, celular…"
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Número de cuenta o celular</span>
              <input
                value={draft.account_number}
                onChange={(event) => change({ account_number: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Titular</span>
              <input
                value={draft.holder_name}
                onChange={(event) => change({ holder_name: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Documento del titular (opcional)</span>
              <input
                value={draft.holder_document}
                onChange={(event) => change({ holder_document: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => change({ active: event.target.checked })}
              />
              Visible para las empresas
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Instrucciones (opcional)</span>
            <textarea
              value={draft.instructions}
              onChange={(event) => change({ instructions: event.target.value })}
              rows={3}
              placeholder="Ej. Envía el comprobante y escribe el nombre de tu empresa en la referencia."
              className={inputClass}
            />
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={ghostButton}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-slate-500">Cargando cuentas...</p>}

      {!loading && accounts.length === 0 && !draft && (
        <section className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todavía no hay cuentas de cobro. Crea la primera para que las empresas sepan dónde
            pagar.
          </p>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{account.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {KIND_LABELS[account.kind]}
                  {account.bank_name ? ` · ${account.bank_name}` : ""}
                  {account.account_type ? ` · ${account.account_type}` : ""}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  account.active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {account.active ? "Visible" : "Oculta"}
              </span>
            </div>

            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Número</dt>
                <dd className="font-mono font-semibold">{account.account_number}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Titular</dt>
                <dd className="text-right font-semibold">{account.holder_name}</dd>
              </div>
              {account.holder_document && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">Documento</dt>
                  <dd className="font-semibold">{account.holder_document}</dd>
                </div>
              )}
            </dl>

            {account.instructions && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {account.instructions}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => edit(account)} className={ghostButton}>
                Editar
              </button>
              <button type="button" onClick={() => void toggle(account)} className={ghostButton}>
                {account.active ? "Ocultar" : "Mostrar"}
              </button>
              <button
                type="button"
                onClick={() => void remove(account)}
                className={`${ghostButton} text-rose-600`}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
