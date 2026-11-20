"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] p-6 text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-3 text-xl font-bold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Esta pantalla tuvo un problema inesperado. Tus datos guardados no se
          perdieron. Puedes intentarlo de nuevo o volver al inicio.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Intentar de nuevo
          </button>
          <a
            href="/inicio"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
