"use client";

import { useState } from "react";

type ReservationStatus =
  | "Confirmada"
  | "Pendiente"
  | "Completada"
  | "Cancelada";

type Reservation = {
  id: number;
  time: string;
  client: string;
  service: string;
  worker: string;
  price: string;
  status: ReservationStatus;
};

const reservations: Reservation[] = [
  {
    id: 1,
    time: "09:00",
    client: "Carlos Ramírez",
    service: "Corte de cabello",
    worker: "Andrés",
    price: "$35.000",
    status: "Confirmada",
  },
  {
    id: 2,
    time: "10:30",
    client: "Laura Martínez",
    service: "Corte + barba",
    worker: "Sebastián",
    price: "$55.000",
    status: "Confirmada",
  },
  {
    id: 3,
    time: "12:00",
    client: "Daniel Gómez",
    service: "Barba",
    worker: "Andrés",
    price: "$25.000",
    status: "Pendiente",
  },
  {
    id: 4,
    time: "14:30",
    client: "Juan David López",
    service: "Corte de cabello",
    worker: "Sebastián",
    price: "$35.000",
    status: "Completada",
  },
  {
    id: 5,
    time: "16:00",
    client: "Mateo Torres",
    service: "Corte + barba",
    worker: "Andrés",
    price: "$55.000",
    status: "Cancelada",
  },
];

const statusClasses: Record<ReservationStatus, string> = {
  Confirmada:
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pendiente:
    "bg-amber-50 text-amber-700 border border-amber-200",
  Completada:
    "bg-blue-50 text-blue-700 border border-blue-200",
  Cancelada:
    "bg-red-50 text-red-700 border border-red-200",
};

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState("Hoy");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredReservations =
    statusFilter === "Todos"
      ? reservations
      : reservations.filter(
          (reservation) => reservation.status === statusFilter
        );

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Gestión de agenda
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Reservas
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Administra las reservas, horarios y disponibilidad de tu negocio.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nueva reserva
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Reservas de hoy</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
            <p className="mt-1 text-xs text-emerald-600">
              +8% frente a ayer
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Confirmadas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">8</p>
            <p className="mt-1 text-xs text-slate-500">
              Para la jornada actual
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">3</p>
            <p className="mt-1 text-xs text-amber-600">
              Requieren atención
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ingresos estimados</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              $480.000
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Reservas programadas
            </p>
          </div>

        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Agenda
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta las reservas programadas para tu negocio.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {["Hoy", "Mañana", "Esta semana"].map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    selectedDate === date
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {date}
                </button>
              ))}

            </div>

          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Reservas programadas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedDate}
              </p>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Confirmada">Confirmadas</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Completada">Completadas</option>
              <option value="Cancelada">Canceladas</option>
            </select>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hora
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Servicio
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Trabajador
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

                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-5 font-semibold text-slate-900">
                      {reservation.time}
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-900">
                        {reservation.client}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {reservation.service}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {reservation.worker}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {reservation.price}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[reservation.status]}`}
                      >
                        {reservation.status}
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

        </section>

      </div>
    </main>
  );
}