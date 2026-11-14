"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth/AuthProvider";
import AuthCard, {
  authButtonClass,
  authInputClass,
  translateAuthError,
} from "../../components/auth/AuthCard";

export default function RecoverPage() {
  const { supabase } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Escribe un correo válido.");
      return;
    }

    setBusy(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/restablecer` },
    );

    setBusy(false);

    if (resetError) {
      setError(translateAuthError(resetError.message));
      return;
    }

    setNotice(
      "Si el correo existe, te enviamos un enlace para crear una contraseña nueva.",
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace a tu correo."
      footer={
        <Link href="/login" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block text-sm font-medium">
          Correo
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthCard>
  );
}
