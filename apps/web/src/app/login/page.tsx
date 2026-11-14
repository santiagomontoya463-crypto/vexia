"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import AuthCard, {
  authButtonClass,
  authInputClass,
  translateAuthError,
} from "../../components/auth/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const { supabase, configured, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/inicio");
  }, [ready, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }

    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (signInError) {
      setError(translateAuthError(signInError.message));
      return;
    }

    router.replace("/inicio");
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Entra a tu espacio de trabajo."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
            Crear cuenta
          </Link>
        </>
      }
    >
      {!configured && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Falta configurar Supabase: revisa las variables del archivo
          .env.local.
        </p>
      )}

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

        <label className="block text-sm font-medium">
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm">
          <Link href="/recuperar" className="text-slate-500 hover:underline dark:text-slate-400">
            Olvidé mi contraseña
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
