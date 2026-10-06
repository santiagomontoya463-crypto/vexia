 "use client";

import { useState } from "react";

type Service = {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: string;
  status: "Activo" | "Inactivo";
};

const services: Service[] = [
  {
    id: 1,
    name: "Servicio principal",
    category: "General",
    duration: "45 min",
    price: "$40.000",
    status: "Activo",
  },
  {
    id: 2,
    name: "Servicio premium",
    category: "Premium",
    duration: "60 min",
    price: "$65.000",
    status: "Activo",
  },
  {
    id: 3,
    name: "Servicio especializado",
    category: "Especializado",
    duration: "90 min",
    price: "$90.000",
    status: "Activo",
  },
  {
    id: 4,
    name: "Servicio adicional",
    category: "Complementario",
    duration: "30 min",
    price: "$25.000",
    status: "Inactivo",
  },
];

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" || service.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Gestión del catálogo
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Servicios
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Crea y administra los servicios que ofrece tu negocio.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo servicio
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total servicios</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              18
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Servicios registrados
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Servicios activos</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              16
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Disponibles para reservas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Precio promedio</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              $55.000
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Sobre servicios activos
            </p>
          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Catálogo de servicios
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Administra precios, duración y disponibilidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar servicio..."
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="Todos">Todos</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Servicio
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duración
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Precio
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredServices.map((service) => (

                  <tr
                    key={service.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-5">

                      <p className="font-semibold text-slate-900">
                        {service.name}
                      </p>

                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {service.category}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {service.duration}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {service.price}
                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          service.status === "Activo"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {service.status}
                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <button
                        type="button"
                        className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Ver detalles
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {filteredServices.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No encontramos servicios con esos criterios.
            </div>
          )}

        </section>

      </div>
    </main>
  );
}