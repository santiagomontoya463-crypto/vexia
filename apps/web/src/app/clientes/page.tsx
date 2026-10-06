"use client";

import { useState } from "react";

type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  visits: number;
  lastVisit: string;
  status: "Activo" | "Inactivo";
};

const clients: Client[] = [
  {
    id: 1,
    name: "Carlos Ramírez",
    phone: "300 456 7890",
    email: "carlos@email.com",
    visits: 12,
    lastVisit: "02 Oct 2026",
    status: "Activo",
  },
  {
    id: 2,
    name: "Laura Martínez",
    phone: "301 234 5678",
    email: "laura@email.com",
    visits: 8,
    lastVisit: "01 Oct 2026",
    status: "Activo",
  },
  {
    id: 3,
    name: "Daniel Gómez",
    phone: "315 678 9012",
    email: "daniel@email.com",
    visits: 5,
    lastVisit: "28 Sep 2026",
    status: "Activo",
  },
  {
    id: 4,
    name: "Juan David López",
    phone: "320 345 6789",
    email: "juan@email.com",
    visits: 15,
    lastVisit: "25 Sep 2026",
    status: "Activo",
  },
  {
    id: 5,
    name: "Mateo Torres",
    phone: "310 567 1234",
    email: "mateo@email.com",
    visits: 2,
    lastVisit: "15 Sep 2026",
    status: "Inactivo",
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      client.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "Todos" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Gestión de clientes
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Clientes
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Administra la información y el historial de los clientes de tu negocio.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo cliente
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total clientes</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              128
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              +12 este mes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Clientes activos</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              116
            </p>

            <p className="mt-1 text-xs text-slate-500">
              90,6% de la base
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Nuevos este mes</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              12
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Crecimiento mensual
            </p>
          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Lista de clientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta y administra tus clientes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
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

            <table className="w-full min-w-[900px] text-left">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Teléfono
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Correo
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Visitas
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Última visita
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

                {filteredClients.map((client) => (

                  <tr
                    key={client.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-5">

                      <p className="font-semibold text-slate-900">
                        {client.name}
                      </p>

                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {client.phone}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {client.email}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {client.visits}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {client.lastVisit}
                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          client.status === "Activo"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {client.status}
                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <button
                        type="button"
                        className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Ver perfil
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {filteredClients.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No encontramos clientes con esos criterios.
            </div>
          )}

        </section>

      </div>
    </main>
  );

}