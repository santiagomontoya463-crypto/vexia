"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import AuthCard, {
  authButtonClass,
  authInputClass,
  translateAuthError,
} from "../../components/auth/AuthCard";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { supabase, user, ready } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }

    router.replace("/inicio");
  }

  return (
    <AuthCard
      title="Nueva contraseña"
      subtitle="Elige una contraseña nueva para tu cuenta."
      footer={
        <Link href="/login" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
          Volver a iniciar sesión
        </Link>
      }
    >
      {ready && !user ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          El enlace no es válido o ya venció. Solicita uno nuevo desde
          «Olvidé mi contraseña».
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <label className="block text-sm font-medium">
            Contraseña nueva
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${authInputClass} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium">
            Confirmar contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={`${authInputClass} mt-1`}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={authButtonClass}>
            {busy ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
