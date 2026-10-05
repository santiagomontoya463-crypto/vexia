export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">VEXIA</p>
          <h1 className="mt-1 text-3xl font-bold">
            Panel de control
          </h1>
          <p className="mt-2 text-slate-500">
            Gestiona tu negocio desde un solo lugar.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Reservas</p>
            <p className="mt-2 text-3xl font-bold">24</p>
            <p className="mt-2 text-sm text-green-600">
              +12% esta semana
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Clientes</p>
            <p className="mt-2 text-3xl font-bold">186</p>
            <p className="mt-2 text-sm text-slate-500">
              8 nuevos
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Servicios</p>
            <p className="mt-2 text-3xl font-bold">32</p>
            <p className="mt-2 text-sm text-slate-500">
              Catálogo activo
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Ventas</p>
            <p className="mt-2 text-3xl font-bold">$2.8M</p>
            <p className="mt-2 text-sm text-slate-500">
              Este mes
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Próximas reservas
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Aquí aparecerán las próximas citas de tu negocio.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Accesos rápidos
            </h2>

            <div className="mt-4 space-y-3">
              <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-medium text-white">
                Nueva reserva
              </button>

              <button className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium">
                Agregar cliente
              </button>

              <button className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium">
                Administrar servicios
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
