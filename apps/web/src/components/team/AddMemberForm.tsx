"use client";

import { useState, type FormEvent } from "react";
import { ROLE_LABELS, useAuth, type BusinessRole } from "../../lib/auth/AuthProvider";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

type Result =
  | {
      kind: "created";
      email: string;
      password: string;
      emailSent: boolean;
      emailError?: string;
    }
  | {
      kind: "invited";
      email: string;
      note: string;
      emailSent: boolean;
      emailError?: string;
    };

export function CredentialsCard({
  email,
  password,
  businessName,
}: {
  email: string;
  password: string;
  businessName: string;
}) {
  const [copied, setCopied] = useState(false);

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/login`;

  const text = `Hola. Ya tienes acceso a ${businessName} en STIAN.\n\nIngresa en: ${link}\nUsuario (correo): ${email}\nContraseña temporal: ${password}\n\nAl entrar te pedirá crear tu propia contraseña.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-slate-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-slate-100">
      <p className="font-bold">Usuario creado</p>

      <dl className="mt-3 space-y-2">
        <div>
          <dt className="text-xs text-slate-500">Usuario (correo)</dt>
          <dd className="break-all font-semibold">{email}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Contraseña temporal</dt>
          <dd className="select-all font-mono text-base font-bold tracking-wider">
            {password}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        Entrégasela a la persona. Al entrar por primera vez, STIAN le pedirá crear
        su propia contraseña. Esta contraseña temporal no se volverá a mostrar.
      </p>

      <button
        type="button"
        onClick={() => void copy()}
        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
      >
        {copied ? "Copiado ✓" : "Copiar mensaje con los datos"}
      </button>
    </div>
  );
}

export function EmailStatus({
  sent,
  email,
  error,
  invitation = false,
}: {
  sent: boolean;
  email: string;
  error?: string;
  invitation?: boolean;
}) {
  if (sent) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
        ✉️ Enviamos un correo a <strong>{email}</strong>
        {invitation ? " con la invitación." : " con sus datos de acceso."} Pídele que revise
        también la carpeta de spam.
      </p>
    );
  }

  return (
    <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
      No se pudo enviar el correo a <strong>{email}</strong>
      {error ? ` (${error})` : ""}.{" "}
      {invitation
        ? "Avísale tú que cree su cuenta con ese correo."
        : "Entrégale los datos de abajo tú mismo."}
    </p>
  );
}

/**
 * Da acceso a la aplicación a una persona: crea su usuario con una contraseña
 * temporal o le envía una invitación para que cree su propia cuenta.
 */
export default function AddMemberForm({
  defaultName = "",
  defaultEmail = "",
  defaultRole = "worker",
  onDone,
}: {
  defaultName?: string;
  defaultEmail?: string;
  defaultRole?: BusinessRole;
  onDone?: () => void;
}) {
  const { supabase, activeMembership } = useAuth();
  const business = activeMembership?.business;
  const myRole = activeMembership?.role;

  const [mode, setMode] = useState<"password" | "invite">("password");
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState<BusinessRole>(defaultRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  if (!business) return null;

  async function invite(note: string) {
    if (!business) return false;

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          email,
          role: role === "owner" ? "admin" : role,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        email?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (!response.ok || !body.ok) {
        setError(body.error ?? "No fue posible crear la invitación.");
        return false;
      }

      setResult({
        kind: "invited",
        email: body.email ?? email.trim().toLowerCase(),
        note,
        emailSent: Boolean(body.emailSent),
        emailError: body.emailError,
      });

      return true;
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
      return false;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!business) return;

    setError("");
    setResult(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Escribe un correo válido.");
      return;
    }

    setBusy(true);

    if (mode === "invite") {
      const ok = await invite(
        "Pídele que cree su cuenta en STIAN con ese correo (o que inicie sesión si ya la tiene): verá la invitación al entrar.",
      );

      setBusy(false);
      if (ok) onDone?.();
      return;
    }

    if (!fullName.trim()) {
      setBusy(false);
      setError("Escribe el nombre de la persona.");
      return;
    }

    try {
      const response = await fetch("/api/team/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          email,
          fullName,
          role,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: string;
        email?: string;
        password?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (response.ok && body.ok && body.password) {
        setResult({
          kind: "created",
          email: body.email ?? email.trim().toLowerCase(),
          password: body.password,
          emailSent: Boolean(body.emailSent),
          emailError: body.emailError,
        });
        onDone?.();
      } else if (body.code === "not_configured") {
        const ok = await invite(
          "La creación con contraseña no está configurada en esta instalación, así que se envió una invitación. Pídele que cree su cuenta con ese correo.",
        );

        if (ok) onDone?.();
      } else if (body.code === "exists") {
        const ok = await invite(
          "Esa persona ya tiene cuenta en STIAN. Le dejamos una invitación: la verá al iniciar sesión y solo debe aceptarla.",
        );

        if (ok) onDone?.();
      } else {
        setError(body.error ?? "No fue posible crear el usuario.");
      }
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
    }

    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-slate-200 p-1 text-sm dark:border-white/10">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-lg px-3 py-1.5 font-semibold ${
            mode === "password"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Crear usuario con contraseña
        </button>
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={`rounded-lg px-3 py-1.5 font-semibold ${
            mode === "invite"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Invitar por correo
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {mode === "password"
          ? "STIAN crea el usuario y te da una contraseña temporal para entregársela. La persona la cambia al entrar."
          : "La persona crea su propia cuenta con ese correo y acepta la invitación. Tú no conoces su contraseña."}
      </p>

      <form onSubmit={submit} noValidate className="grid gap-3 md:grid-cols-2">
        {mode === "password" && (
          <label className="text-sm font-medium">
            Nombre completo
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        )}

        <label className="text-sm font-medium">
          Correo (será su usuario)
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="persona@correo.com"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="text-sm font-medium">
          Rol de acceso
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as BusinessRole)}
            className={`${inputClass} mt-1`}
          >
            <option value="worker">{ROLE_LABELS.worker}</option>
            <option value="manager">{ROLE_LABELS.manager}</option>
            {myRole === "owner" && (
              <>
                <option value="admin">{ROLE_LABELS.admin}</option>
                {mode === "password" && (
                  <option value="owner">{ROLE_LABELS.owner}</option>
                )}
              </>
            )}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Procesando..."
              : mode === "password"
                ? "Crear usuario"
                : "Enviar invitación"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result?.kind === "created" && (
        <>
          <EmailStatus
            sent={result.emailSent}
            email={result.email}
            error={result.emailError}
          />
          <CredentialsCard
            email={result.email}
            password={result.password}
            businessName={business.name}
          />
        </>
      )}

      {result?.kind === "invited" && (
        <>
          <EmailStatus
            sent={result.emailSent}
            email={result.email}
            error={result.emailError}
            invitation
          />
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            Invitación creada para <strong>{result.email}</strong>. {result.note}
          </p>
        </>
      )}
    </div>
  );
}
