"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  formatDate,
  inputClass,
  money,
  primaryButton,
  type MasterBusiness,
  type Plan,
} from "./shared";

const METHODS = [
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "other", label: "Otro" },
];

export default function PaymentModal({
  businesses,
  plans,
  initialBusinessId,
  onClose,
  onSaved,
}: {
  businesses: MasterBusiness[];
  plans: Plan[];
  initialBusinessId?: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const activePlans = plans.filter((plan) => plan.active);

  const first =
    businesses.find((item) => item.id === initialBusinessId) ?? businesses[0];

  const [businessId, setBusinessId] = useState(first?.id ?? "");
  const [planId, setPlanId] = useState(first?.plan_id ?? activePlans[0]?.id ?? "");
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const business = businesses.find((item) => item.id === businessId);
  const plan = plans.find((item) => item.id === planId);
  const suggested = plan ? plan.price_monthly * months : 0;
  const shownAmount = touched ? amount : suggested ? String(suggested) : "";

  // Desde cuándo cuenta el nuevo periodo.
  const currentEnd =
    business?.status === "active" && business.subscription_ends_at
      ? new Date(business.subscription_ends_at)
      : null;
  const start = currentEnd && currentEnd.getTime() > Date.now() ? currentEnd : new Date();
  const until = new Date(start);
  until.setMonth(until.getMonth() + months);

  function changeBusiness(id: string) {
    const next = businesses.find((item) => item.id === id);

    setBusinessId(id);
    setPlanId(next?.plan_id ?? activePlans[0]?.id ?? "");
    setTouched(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase || !business) return;

    const value = Number(shownAmount);

    if (!Number.isFinite(value) || value < 0) {
      setError("Ingresa el valor del pago.");
      return;
    }

    setBusy(true);

    const { error: rpcError } = await supabase.rpc("master_record_payment", {
      p_business: business.id,
      p_plan: planId || null,
      p_amount: value,
      p_method: method,
      p_months: months,
      p_reference: reference || null,
      p_notes: notes || null,
    });

    setBusy(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onSaved(`Pago registrado. ${business.name} queda activa hasta el ${formatDate(until.toISOString())}.`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        noValidate
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
      >
        <div>
          <h2 className="text-lg font-bold">Registrar pago</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Activa la empresa y extiende su suscripción.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Empresa
          <select
            value={businessId}
            onChange={(event) => changeBusiness(event.target.value)}
            className={`${inputClass} mt-1`}
          >
            {businesses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Plan
            <select
              value={planId}
              onChange={(event) => {
                setPlanId(event.target.value);
                setTouched(false);
              }}
              className={`${inputClass} mt-1`}
            >
              <option value="">Sin cambios</option>
              {activePlans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Periodo pagado
            <select
              value={months}
              onChange={(event) => {
                setMonths(Number(event.target.value));
                setTouched(false);
              }}
              className={`${inputClass} mt-1`}
            >
              {[1, 2, 3, 6, 12].map((item) => (
                <option key={item} value={item}>
                  {item} {item === 1 ? "mes" : "meses"}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Valor pagado ({business?.currency ?? "COP"})
            <input
              type="number"
              min="0"
              value={shownAmount}
              onChange={(event) => {
                setTouched(true);
                setAmount(event.target.value);
              }}
              placeholder="0"
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="text-sm font-medium">
            Forma de pago
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              {METHODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          Referencia o comprobante (opcional)
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm font-medium">
          Notas (opcional)
          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          {business?.name ?? "La empresa"} quedará <strong>activa hasta el {formatDate(until.toISOString())}</strong>
          {shownAmount ? ` por ${money(Number(shownAmount), business?.currency)}` : ""}.
        </p>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10"
          >
            Cancelar
          </button>
          <button type="submit" disabled={busy || !business} className={primaryButton}>
            {busy ? "Guardando..." : "Registrar pago"}
          </button>
        </div>
      </form>
    </div>
  );
}
