import type { ReactNode } from "react";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] p-4 text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-3xl font-extrabold tracking-[0.2em] text-transparent">
            STIAN
          </p>
          <p className="mt-1 text-xs tracking-wide text-slate-500 dark:text-slate-400">
            Gestiona. Conecta. Crece.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-indigo-950/5 backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

export const authButtonClass =
  "w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60";

export function translateAuthError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "El correo o la contraseña no son correctos.";
  }
  if (text.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (text.includes("password should be at least")) {
    return "La contraseña es muy corta.";
  }
  if (text.includes("weak") || text.includes("easy to guess") || text.includes("pwned")) {
    return "Esa contraseña es muy común o insegura. Elige otra más difícil de adivinar.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Demasiados intentos o correos enviados. Espera unos minutos e inténtalo de nuevo.";
  }
  if (text.includes("sending confirmation email") || text.includes("sending recovery email")) {
    return "No se pudo enviar el correo de confirmación. En Supabase desactiva «Confirmar correo electrónico» para probar.";
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled")) {
    return "Los registros nuevos están desactivados en Supabase.";
  }
  if (text.includes("database error")) {
    return `Error en la base de datos al crear el usuario (${message}).`;
  }
  if (text.includes("failed to fetch") || text.includes("network") || text.includes("fetch failed")) {
    return "No se pudo conectar con Supabase. Revisa la URL de .env.local y tu conexión.";
  }

  return `No fue posible completar la acción (${message}).`;
}
