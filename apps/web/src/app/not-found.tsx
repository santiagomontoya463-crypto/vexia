import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] p-6 text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <p className="text-5xl font-extrabold text-violet-600">404</p>
        <h1 className="mt-3 text-xl font-bold">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          La dirección no existe o fue movida.
        </p>

        <Link
          href="/inicio"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
