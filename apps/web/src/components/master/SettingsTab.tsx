"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { cardClass, inputClass, primaryButton } from "./shared";

export default function SettingsTab({
  initialTrialDays,
  initialInstructions,
  initialSupport,
  flash,
  setError,
}: {
  initialTrialDays: string;
  initialInstructions: string;
  initialSupport: string;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [trialDays, setTrialDays] = useState(initialTrialDays);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [support, setSupport] = useState(initialSupport);

  async function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    const stamp = new Date().toISOString();

    const [first, second] = await Promise.all([
      supabase
        .from("platform_settings")
        .update({ value: instructions, updated_at: stamp })
        .eq("key", "payment_instructions"),
      supabase
        .from("platform_settings")
        .update({ value: support, updated_at: stamp })
        .eq("key", "support_contact"),
    ]);

    const failure = first.error ?? second.error;

    if (failure) {
      setError(failure.message);
      return;
    }

    setError("");
    flash("Instrucciones de pago guardadas. Ya las ven las empresas.");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) return;

    const days = Number(trialDays);

    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError("Los días de prueba deben ser un número entero entre 0 y 365.");
      return;
    }

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: days, updated_at: new Date().toISOString() })
      .eq("key", "trial_days");

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash("Prueba gratuita actualizada. Aplica a las empresas nuevas.");
  }

  return (
    <div className="space-y-6">
    <section className={`${cardClass} max-w-xl`}>
      <h2 className="font-bold">Prueba gratuita</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Días de prueba que recibe cada empresa nueva. Para una empresa en particular usa «Extender
        prueba» en la pestaña Empresas.
      </p>

      <form onSubmit={save} className="mt-4 flex gap-3">
        <input
          type="number"
          min="0"
          max="365"
          value={trialDays}
          onChange={(event) => setTrialDays(event.target.value)}
          className={`${inputClass} max-w-[140px]`}
        />
        <button type="submit" className={primaryButton}>
          Guardar
        </button>
      </form>
    </section>

    <section className={`${cardClass} max-w-2xl`}>
      <h2 className="font-bold">Cómo te pagan las empresas</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Este texto lo ven los propietarios en su pantalla de Suscripción y en los recordatorios por
        correo. Escribe tus datos de pago: banco, tipo y número de cuenta, titular, Nequi, etc.
      </p>

      <form onSubmit={savePayment} className="mt-4 space-y-3">
        <label className="block text-sm font-medium">
          Instrucciones de pago
          <textarea
            rows={6}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm font-medium">
          Contacto de soporte (teléfono o correo)
          <input
            value={support}
            onChange={(event) => setSupport(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <button type="submit" className={primaryButton}>
          Guardar instrucciones
        </button>
      </form>
    </section>
    </div>
  );
}
