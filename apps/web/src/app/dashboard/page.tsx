export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              VEXIA
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Gestiona. Conecta. Crece.
            </p>
          </div>

          <nav className="space-y-2 text-sm">
            <a
              href="/dashboard"
              className="block rounded-xl bg-slate-900 px-4 py-3 font-medium text-white"
            >
              Dashboard
            </a>

            <a
              href="/reservas"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Reservas
            </a>

            <a
              href="/clientes"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Clientes
            </a>

            <a
              href="/servicios"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Servicios
            </a>

            <a
              href="/productos"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Productos
            </a>

            <a
              href="/negocio"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Mi negocio
            </a>

            <a
              href="/configuracion"
              className="block rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100"
            >
              Configuración
            </a>
          </nav>

          <div className="mt-10 rounded-2xl bg-slate-100 p-4">
            <p className="text-xs font-medium text-slate-500">
              Cuenta actual
            </p>
            <p className="mt-1 font-semibold">Mi negocio</p>
            <p className="text-xs text-slate-500">Plan activo</p>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Vista general</p>
                <h2 className="text-2xl font-bold">Panel VEXIA</h2>
              </div>

              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                ● Sistema activo
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold">
                Resumen de tu negocio
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Consulta rápidamente lo que está pasando en tu negocio.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Reservas"
                value="24"
                detail="+12% esta semana"
              />

              <StatCard
                title="Clientes"
                value="186"
                detail="+8 nuevos"
              />

              <StatCard
                title="Servicios"
                value="32"
                detail="Catálogo activo"
              />

              <StatCard
                title="Ventas"
                value="$2.8M"
                detail="Este mes"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">Próximas reservas</h3>

                <div className="mt-5 space-y-4">
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
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold">Acciones rápidas</h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <QuickAction text="Nueva reserva" href="/reservas" />
                  <QuickAction text="Nuevo cliente" href="/clientes" />
                  <QuickAction text="Agregar servicio" href="/servicios" />
                  <QuickAction text="Agregar producto" href="/productos" />
                </div>
              </section>
            </div>
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
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
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
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-slate-500">{service}</p>
      </div>
      <span className="text-sm font-semibold">{time}</span>
    </div>
  );
}

function QuickAction({
  text,
  href,
}: {
  text: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 px-4 py-4 text-sm font-medium transition hover:bg-slate-50"
    >
      + {text}
    </a>
  );
}
