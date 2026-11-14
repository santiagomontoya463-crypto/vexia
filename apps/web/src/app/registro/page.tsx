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

export default function RegisterPage() {
  const router = useRouter();
  const { supabase, configured, user, ready } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/inicio");
  }, [ready, user, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    if (!fullName.trim()) {
      setError("Escribe tu nombre.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("El correo no tiene un formato válido.");
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setBusy(false);

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      return;
    }

    if (data.session) {
      router.replace("/crear-negocio");
      return;
    }

    setNotice(
      "Te enviamos un correo para confirmar tu cuenta. Confírmalo y luego inicia sesión.",
    );
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Empieza con una prueba gratuita."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-violet-600 hover:underline dark:text-violet-300">
            Iniciar sesión
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
          Nombre completo
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

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

        {notice && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthCard>
  );
}
