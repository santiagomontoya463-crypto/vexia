import Link from "next/link";
import Sidebar from "../../components/Sidebar";
const stats = [
  {
    title: "Reservas",
    value: "24",
    detail: "+12% esta semana",
    icon: "◷",
    color: "violet",
  },
  {
    title: "Clientes",
    value: "186",
    detail: "8 nuevos",
    icon: "◎",
    color: "cyan",
  },
  {
    title: "Servicios",
    value: "32",
    detail: "Catálogo activo",
    icon: "✳",
    color: "pink",
  },
  {
    title: "Ventas",
    value: "$2.8M",
    detail: "Este mes",
    icon: "↗",
    color: "emerald",
  },
] as const;
const actions = [
  {
    text: "Nueva reserva",
    description: "Organiza una cita",
    href: "/reservas",
    icon: "+",
  },
  {
    text: "Agregar cliente",
    description: "Gestiona tus contactos",
    href: "/clientes",
    icon: "◎",
  },
  {
    text: "Agregar servicio",
    description: "Administra tu catálogo",
    href: "/servicios",
    icon: "✳",
  },
  {
    text: "Agregar producto",
    description: "Gestiona tus productos",
    href: "/productos",
    icon: "◇",
  },
];
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 transition-colors dark:bg-[#080d19] dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="relative min-w-0 flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-400/10 blur-[110px] dark:bg-violet-600/10"
          />
          <header className="relative border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                  Centro de operaciones
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Panel de control
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Gestiona tu negocio desde un solo lugar.
                </p>
              </div>
              <Link
                href="/configuracion"
                aria-label="Abrir configuración"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-violet-400/10"
              >
                ⚙
              </Link>
            </div>
          </header>
          <div className="relative mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
            {/* Banner principal */}
            <section className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#29215f] via-[#4937a9] to-[#087b99] p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-10 h-52 w-52 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-90px] right-1/4 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl"
              />
              <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                    STIAN · Gestiona. Conecta. Crece.
                  </div>
                  <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                    Todo conectado.
                    <br />
                    Tu negocio, en evolución.
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                    Organiza tus operaciones, administra tus recursos y
                    mantén el control de tu negocio desde una plataforma.
                  </p>
                  <Link
                    href="/negocio"
                    className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Explorar mi negocio
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:w-64 lg:shrink-0">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-4 backdrop-blur-xl">
                    <p className="text-xs text-indigo-100">Plataforma</p>
                    <p className="mt-3 text-xl font-bold">STIAN</p>
                    <p className="mt-1 text-[11px] text-indigo-100/80">
                      Gestión integral
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-4 backdrop-blur-xl">
                    <p className="text-xs text-indigo-100">Experiencia</p>
                    <p className="mt-3 text-xl font-bold">360°</p>
                    <p className="mt-1 text-[11px] text-indigo-100/80">
                      Un solo espacio
                    </p>
                  </div>
                </div>
              </div>
            </section>
            {/* Indicadores */}
            <section className="mb-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    Resumen de tu negocio
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Una vista general de tus operaciones.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                  Datos de demostración
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <StatCard key={stat.title} {...stat} />
                ))}
              </div>
            </section>
            {/* Reservas y accesos */}
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      Próximas reservas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Consulta tu agenda.
                    </p>
                  </div>
                  <Link
                    href="/reservas"
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:hover:text-violet-300"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="mt-6 space-y-3">
                  <Appointment
                    name="Cliente pendiente"
                    service="Servicio programado"
                    time="10:00 AM"
                  />
                  <Appointment
                    name="Cliente pendiente"
                    service="Servicio programado"
                    time="11:30 AM"
                  />
                  <Appointment
                    name="Cliente pendiente"
                    service="Servicio programado"
                    time="2:00 PM"
                  />
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Las reservas mostradas son ejemplos; aún no están
                  conectadas a los datos reales.
                </p>
              </section>
              <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6">
                <h2 className="text-lg font-bold">Acciones rápidas</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Accede directamente a tus módulos.
                </p>
                <div className="mt-5 space-y-3">
                  {actions.map((action, index) => (
                    <QuickAction
                      key={action.href}
                      {...action}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            </div>
            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-500 dark:border-white/[0.08] dark:text-slate-500 sm:flex-row">
              <p>STIAN · Gestiona. Conecta. Crece.</p>
              <p>Panel de demostración</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
function StatCard({
  title,
  value,
  detail,
  icon,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
  color: "violet" | "cyan" | "pink" | "emerald";
}) {
  const styles = {
    violet: {
      icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
      dot: "bg-violet-500",
    },
    cyan: {
      icon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
      dot: "bg-cyan-500",
    },
    pink: {
      icon: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300",
      dot: "bg-fuchsia-500",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
  }[color];
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/[0.07] dark:border-white/[0.09] dark:bg-[#111827]/90 dark:hover:border-violet-400/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${styles.icon}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </p>
      </div>
    </article>
  );
}
function Appointment({
  name,
  service,
  time,
}: {
  name: string;
  service: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-white/[0.06] dark:bg-white/[0.025] dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.05]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-lg text-violet-600 dark:text-violet-300">
          ◷
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {service}
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/[0.07] dark:text-slate-200">
        {time}
      </span>
    </div>
  );
}
function QuickAction({
  text,
  description,
  href,
  icon,
  index,
}: {
  text: string;
  description: string;
  href: string;
  icon: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3.5 transition duration-200 hover:border-violet-300 hover:bg-violet-50/60 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-violet-400/40 dark:hover:bg-violet-400/[0.06]"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
          index % 2 === 0
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
            : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{text}</span>
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-500">
        →
      </span>
    </Link>
  );
}