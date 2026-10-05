import Sidebar from "../../components/Sidebar";
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        <Sidebar />

        <section className="flex-1">

          {/* ENCABEZADO */}
          <header className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="mx-auto flex max-w-7xl items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Vista general
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Panel de control
                </h1>
              </div>

              <div className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 sm:block">
                ● Sistema activo
              </div>

            </div>
          </header>

          {/* CONTENIDO */}
          <div className="mx-auto max-w-7xl p-6">

            <div className="mb-8">
              <h2 className="text-xl font-semibold">
                Resumen de tu negocio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta rápidamente lo que está pasando en tu negocio.
              </p>
            </div>

            {/* ESTADÍSTICAS */}
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

            {/* CONTENIDO INFERIOR */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">

              {/* RESERVAS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="font-semibold">
                      Próximas reservas
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Próximas citas de tu negocio.
                    </p>
                  </div>

                  <a
                    href="/reservas"
                    className="text-sm font-medium text-slate-700 hover:text-slate-950"
                  >
                    Ver todas
                  </a>

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

              </section>

              {/* ACCIONES */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6">

                <h2 className="font-semibold">
                  Acciones rápidas
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Accede rápidamente a las funciones principales.
                </p>

                <div className="mt-5 space-y-3">

                  <QuickAction
                    text="Nueva reserva"
                    href="/reservas"
                  />

                  <QuickAction
                    text="Agregar cliente"
                    href="/clientes"
                  />

                  <QuickAction
                    text="Agregar servicio"
                    href="/servicios"
                  />

                  <QuickAction
                    text="Agregar producto"
                    href="/productos"
                  />

                </div>

              </section>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}


/* TARJETA DE ESTADÍSTICA */

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>

    </div>
  );
}


/* RESERVA */

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
        <p className="font-medium">
          {name}
        </p>

        <p className="text-sm text-slate-500">
          {service}
        </p>
      </div>

      <span className="text-sm font-semibold">
        {time}
      </span>

    </div>
  );
}


/* ACCIÓN RÁPIDA */

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
      className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
    >
      + {text}
    </a>
  );
}
