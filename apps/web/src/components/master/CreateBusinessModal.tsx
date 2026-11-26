"use client";

import { useState, type FormEvent } from "react";
import BusinessTypePicker from "../BusinessTypePicker";
import { CredentialsCard, EmailStatus } from "../team/AddMemberForm";
import { inputClass, money, primaryButton, type Plan } from "./shared";

export type CreatePrefill = {
  name?: string;
  businessType?: string;
  phone?: string;
  ownerName?: string;
  ownerEmail?: string;
  planId?: string;
  prospectId?: string;
};

type Result = {
  businessId: string;
  ownerEmail: string;
  existingUser: boolean;
  password?: string;
  emailSent: boolean;
  emailError?: string;
};

/** Inscribe una empresa nueva y la cuenta de su propietario. */
export default function CreateBusinessModal({
  plans,
  trialDays,
  prefill,
  onClose,
  onCreated,
}: {
  plans: Plan[];
  trialDays: string;
  prefill?: CreatePrefill;
  onClose: () => void;
  onCreated: () => void;
}) {
  const activePlans = plans.filter((plan) => plan.active);

  const [name, setName] = useState(prefill?.name ?? "");
  const [businessType, setBusinessType] = useState(prefill?.businessType ?? "");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState(prefill?.ownerName ?? "");
  const [ownerEmail, setOwnerEmail] = useState(prefill?.ownerEmail ?? "");
  const [planId, setPlanId] = useState(prefill?.planId ?? activePlans[0]?.id ?? "");
  const [mode, setMode] = useState<"trial" | "active">("trial");
  const [days, setDays] = useState(trialDays);
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const plan = plans.find((item) => item.id === planId);
  const suggested = plan ? plan.price_monthly * months : 0;
  const shownAmount = touched ? amount : suggested ? String(suggested) : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Escribe el nombre de la empresa.");
      return;
    }

    if (!ownerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      setError("Escribe el nombre y un correo válido del propietario.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/master/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessType,
          documentNumber,
          phone,
          email,
          address,
          ownerName,
          ownerEmail,
          planId: planId || undefined,
          mode,
          trialDays: Number(days),
          months,
          amount: mode === "active" && shownAmount !== "" ? Number(shownAmount) : undefined,
          method,
          reference,
          sendEmail,
          prospectId: prefill?.prospectId,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as Result & {
        ok?: boolean;
        error?: string;
        code?: string;
      };

      if (response.ok && body.ok) {
        setResult(body);
        onCreated();
      } else if (body.code === "not_configured") {
        setError(
          "Falta la clave secreta del servidor. Agrega SUPABASE_SECRET_KEY en el archivo .env.local y reinicia la app.",
        );
      } else {
        setError(body.error ?? "No fue posible inscribir la empresa.");
      }
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
    }

    setBusy(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
      >
        {result ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Empresa inscrita</h2>
            <p className="text-sm text-slate-500">
              {name} ya existe en STIAN
              {mode === "active" ? " y quedó activa." : ` con ${days} días de prueba.`}
            </p>

            {result.password ? (
              <>
                <EmailStatus
                  sent={result.emailSent}
                  email={result.ownerEmail}
                  error={result.emailError}
                />
                <CredentialsCard
                  email={result.ownerEmail}
                  password={result.password}
                  businessName={name}
                />
              </>
            ) : (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                {result.ownerEmail} ya tenía cuenta en STIAN: usa su misma contraseña y verá la
                empresa al iniciar sesión.
              </p>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={onClose} className={primaryButton}>
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <div>
              <h2 className="text-lg font-bold">Inscribir una empresa</h2>
              <p className="mt-1 text-sm text-slate-500">
                Se crea la empresa y la cuenta de su propietario, con una contraseña temporal.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold">Empresa</legend>

              <label className="block text-sm font-medium">
                Nombre
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} mt-1`} />
              </label>

              <div>
                <p className="text-sm font-medium">Tipo de negocio</p>
                <div className="mt-1">
                  <BusinessTypePicker value={businessType} onChange={setBusinessType} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  NIT (opcional)
                  <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-sm font-medium">
                  Teléfono
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-sm font-medium">
                  Correo de la empresa
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-sm font-medium">
                  Dirección
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold">Propietario</legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Nombre completo
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
                <label className="text-sm font-medium">
                  Correo (será su usuario)
                  <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold">Plan e inicio</legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Plan
                  <select value={planId} onChange={(e) => { setPlanId(e.target.value); setTouched(false); }} className={`${inputClass} mt-1`}>
                    <option value="">Sin plan por ahora</option>
                    {activePlans.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.price_monthly > 0 ? ` · ${money(item.price_monthly)}/mes` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Cómo empieza
                  <select value={mode} onChange={(e) => setMode(e.target.value as "trial" | "active")} className={`${inputClass} mt-1`}>
                    <option value="trial">Con prueba gratuita</option>
                    <option value="active">Activa (ya pagó)</option>
                  </select>
                </label>
              </div>

              {mode === "trial" ? (
                <label className="block text-sm font-medium sm:max-w-[200px]">
                  Días de prueba
                  <input type="number" min="0" max="365" value={days} onChange={(e) => setDays(e.target.value)} className={`${inputClass} mt-1`} />
                </label>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Meses pagados
                    <select value={months} onChange={(e) => { setMonths(Number(e.target.value)); setTouched(false); }} className={`${inputClass} mt-1`}>
                      {[1, 2, 3, 6, 12].map((item) => (
                        <option key={item} value={item}>
                          {item} {item === 1 ? "mes" : "meses"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Valor pagado
                    <input type="number" min="0" value={shownAmount} onChange={(e) => { setTouched(true); setAmount(e.target.value); }} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="text-sm font-medium">
                    Forma de pago
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputClass} mt-1`}>
                      <option value="transfer">Transferencia</option>
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="other">Otro</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Referencia
                    <input value={reference} onChange={(e) => setReference(e.target.value)} className={`${inputClass} mt-1`} />
                  </label>
                </div>
              )}
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              Enviar los datos de acceso al correo del propietario
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">
                Cancelar
              </button>
              <button type="submit" disabled={busy} className={primaryButton}>
                {busy ? "Inscribiendo..." : "Inscribir empresa"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
