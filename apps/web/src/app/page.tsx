import Link from "next/link";
const metrics = [
  {
    label: "Reservas",
    value: "24",
    detail: "+12% esta semana",
    symbol: "◷",
    color: "from-violet-500 to-indigo-500",
    glow: "bg-violet-500/10",
  },
  {
    label: "Clientes",
    value: "186",
    detail: "8 nuevos este mes",
    symbol: "◎",
    color: "from-cyan-400 to-blue-500",
    glow: "bg-cyan-500/10",
  },
  {
    label: "Servicios",
    value: "32",
    detail: "Catálogo activo",
    symbol: "✳",
    color: "from-fuchsia-500 to-violet-500",
    glow: "bg-fuchsia-500/10",
  },
  {
    label: "Ventas",
    value: "$2.8M",
    detail: "Total de demostración",
    symbol: "↗",
    color: "from-emerald-400 to-teal-500",
    glow: "bg-emerald-500/10",
  },
];
const shortcuts = [
  {
    title: "Nueva reserva",
    description: "Organiza una cita",
    href: "/reservas",
    symbol: "+",
  },
  {
    title: "Agregar cliente",
    description: "Gestiona tus clientes",
    href: "/clientes",
    symbol: "◎",
  },
  {
    title: "Administrar servicios",
    description: "Edita tu catálogo",
    href: "/servicios",
    symbol: "✳",
  },
  {
    title: "Registrar una venta",
    description: "Consulta tus operaciones",
    href: "/ventas",
    symbol: "↗",
  },
];
export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f6fc] px-4 py-6 text-slate-900 transition-colors dark:bg-[#080d19] dark:text-white sm:px-7 lg:px-10 lg:py-9">
      {/* Fondo ambiental */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-400/15 blur-[110px] dark:bg-violet-600/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-[100px] dark:bg-cyan-500/10"
      />
      <div className="relative mx-auto max-w-[1500px]">
        {/* Encabezado */}
        <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-lg font-black text-white shadow-lg shadow-violet-500/20">
                V
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-[0.2em]">
                  STIAN
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Gestiona. Conecta. Crece.
                </p>
              </div>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              Centro de operaciones
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Panel de control
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              Todo tu negocio, conectado en un solo lugar.
            </p>
          </div>
          <Link
            href="/configuracion"
            className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-violet-400/50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-lg text-violet-600 dark:text-violet-300">
              ⚙
            </span>
            <span>
              Configuración
              <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                Personaliza tu espacio
              </span>
            </span>
            <span className="ml-2 text-slate-400">→</span>
          </Link>
        </header>
        {/* Banner principal */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#27205f] via-[#4438a8] to-[#176d91] p-6 text-white shadow-2xl shadow-indigo-950/10 sm:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-16 h-56 w-56 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-100px] right-[18%] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                Tu espacio de gestión
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Una nueva forma de
                <br className="hidden sm:block" /> gestionar tu negocio.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Organiza tus reservas, administra tus clientes y conecta
                las operaciones de tu empresa desde una sola plataforma.
              </p>
              <Link
                href="/negocio"
                className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Explorar mi negocio
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="grid min-w-52 grid-cols-2 gap-3 lg:w-64">
              <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-4 backdrop-blur-xl">
                <p className="text-xs text-indigo-100">Plataforma</p>
                <p className="mt-3 text-lg font-bold">VEXIA</p>
                <p className="mt-1 text-[11px] text-indigo-100/80">
                  Gestión integral
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-4 backdrop-blur-xl">
                <p className="text-xs text-indigo-100">Experiencia</p>
                <p className="mt-3 text-lg font-bold">360°</p>
                <p className="mt-1 text-[11px] text-indigo-100/80">
                  Un solo espacio
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Indicadores */}
        <section aria-labelledby="metrics-title" className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="metrics-title" className="text-lg font-bold">
                Resumen del negocio
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Indicadores de demostración
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
              Datos de ejemplo
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="group rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/[0.07] dark:border-white/[0.09] dark:bg-[#111827]/90 dark:hover:border-violet-400/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight">
                      {metric.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.glow} text-2xl`}
                  >
                    <span
                      className={`bg-gradient-to-br ${metric.color} bg-clip-text font-bold text-transparent`}
                    >
                      {metric.symbol}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
                  <span
                    className={`h-2 w-2 rounded-full bg-gradient-to-r ${metric.color}`}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {metric.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        {/* Contenido inferior */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Próximas reservas</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Mantén tus citas organizadas.
                </p>
              </div>
              <Link
                href="/reservas"
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold transition hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:hover:text-violet-300"
              >
                Ver reservas →
              </Link>
            </div>
            <div className="mt-7 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl text-violet-600 dark:text-violet-300">
                ◷
              </div>
              <h3 className="mt-4 font-semibold">
                Tu agenda está lista para conectarse
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Cuando conectemos las reservas con la base de datos,
                aquí aparecerán las citas reales de tu negocio.
              </p>
              <Link
                href="/reservas"
                className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                Abrir agenda →
              </Link>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6">
            <div>
              <h2 className="text-lg font-bold">Accesos rápidos</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Continúa directamente con tus tareas.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {shortcuts.map((shortcut, index) => (
                <Link
                  key={shortcut.title}
                  href={shortcut.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 transition duration-200 hover:border-violet-300 hover:bg-violet-50/60 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-violet-400/40 dark:hover:bg-violet-400/[0.06]"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      index % 2 === 0
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
                        : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                    }`}
                  >
                    {shortcut.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {shortcut.title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {shortcut.description}
                    </span>
                  </span>
                  <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-500">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-500 dark:border-white/[0.08] dark:text-slate-500 sm:flex-row sm:items-center">
          <p>VEXIA · Gestiona. Conecta. Crece.</p>
          <p>Panel de demostración · Los datos aún no son reales</p>
        </footer>
      </div>
    </main>
  );
}