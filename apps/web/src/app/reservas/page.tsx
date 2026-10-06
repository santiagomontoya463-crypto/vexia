"use client";

import { FormEvent, useMemo, useState } from "react";

type Status =
  | "Confirmada"
  | "Pendiente"
  | "Cancelada"
  | "Reprogramada";

type Reservation = {
  id: number;
  date: string;
  time: string;
  client: string;
  phone: string;
  service: string;
  professional: string;
  price: number;
  status: Status;
};

const clients = [
  { name: "Carlos Gómez", phone: "300 000 0000" },
  { name: "Laura Martínez", phone: "301 000 0000" },
  { name: "Andrés Rodríguez", phone: "302 000 0000" },
  { name: "Daniela López", phone: "303 000 0000" },
  { name: "Sebastián Vargas", phone: "304 000 0000" },
];

const services = [
  { name: "Corte de cabello", price: 30000 },
  { name: "Corte + barba", price: 45000 },
  { name: "Diseño de barba", price: 25000 },
  { name: "Corte premium", price: 50000 },
];

const professionals = [
  "Juan Pérez",
  "Miguel Torres",
  "Laura Gómez",
];

const initialReservations: Reservation[] = [
  {
    id: 1,
    date: "2026-10-06",
    time: "08:00",
    client: "Carlos Gómez",
    phone: "300 000 0000",
    service: "Corte de cabello",
    professional: "Juan Pérez",
    price: 30000,
    status: "Confirmada",
  },
  {
    id: 2,
    date: "2026-10-06",
    time: "09:30",
    client: "Laura Martínez",
    phone: "301 000 0000",
    service: "Corte + barba",
    professional: "Juan Pérez",
    price: 45000,
    status: "Confirmada",
  },
  {
    id: 3,
    date: "2026-10-06",
    time: "11:00",
    client: "Andrés Rodríguez",
    phone: "302 000 0000",
    service: "Corte de cabello",
    professional: "Miguel Torres",
    price: 30000,
    status: "Pendiente",
  },
  {
    id: 4,
    date: "2026-10-06",
    time: "14:00",
    client: "Daniela López",
    phone: "303 000 0000",
    service: "Diseño de barba",
    professional: "Miguel Torres",
    price: 25000,
    status: "Reprogramada",
  },
  {
    id: 5,
    date: "2026-10-07",
    time: "16:30",
    client: "Sebastián Vargas",
    phone: "304 000 0000",
    service: "Corte premium",
    professional: "Laura Gómez",
    price: 50000,
    status: "Confirmada",
  },
];

const currency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const today = "2026-10-06";

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    Confirmada:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    Pendiente:
      "border-amber-200 bg-amber-50 text-amber-700",
    Cancelada:
      "border-red-200 bg-red-50 text-red-700",
    Reprogramada:
      "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations);

  const [period, setPeriod] =
    useState<"dia" | "semana">("dia");

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"Todos" | Status>("Todos");

  const [professionalFilter, setProfessionalFilter] =
    useState("Todos");

  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const [modal, setModal] =
    useState<"new" | "edit" | "reschedule" | null>(null);

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] =
    useState(services[0].name);
  const [professional, setProfessional] =
    useState(professionals[0]);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");
  const [price, setPrice] = useState("30000");

  const visibleReservations = useMemo(() => {
    return reservations
      .filter((item) => {
        if (period === "dia") {
          return item.date === selectedDate;
        }

        return true;
      })
      .filter((item) => {
        const text =
          `${item.client} ${item.service} ${item.phone}`
            .toLowerCase();

        return text.includes(search.toLowerCase());
      })
      .filter(
        (item) =>
          statusFilter === "Todos" ||
          item.status === statusFilter
      )
      .filter(
        (item) =>
          professionalFilter === "Todos" ||
          item.professional === professionalFilter
      )
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.time.localeCompare(b.time);
      });
  }, [
    reservations,
    period,
    selectedDate,
    search,
    statusFilter,
    professionalFilter,
  ]);

  const confirmed = reservations.filter(
    (r) => r.status === "Confirmada"
  ).length;

  const pending = reservations.filter(
    (r) => r.status === "Pendiente"
  ).length;

  const cancelled = reservations.filter(
    (r) => r.status === "Cancelada"
  ).length;

  const estimatedIncome = reservations
    .filter((r) => r.status !== "Cancelada")
    .reduce((sum, r) => sum + r.price, 0);

  const resetForm = () => {
    setClientName("");
    setPhone("");
    setService(services[0].name);
    setProfessional(professionals[0]);
    setDate(selectedDate);
    setTime("10:00");
    setPrice(String(services[0].price));
  };

  const openNewReservation = () => {
    resetForm();
    setModal("new");
  };

  const openEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setClientName(reservation.client);
    setPhone(reservation.phone);
    setService(reservation.service);
    setProfessional(reservation.professional);
    setDate(reservation.date);
    setTime(reservation.time);
    setPrice(String(reservation.price));
    setModal("edit");
  };

  const openReschedule = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDate(reservation.date);
    setTime(reservation.time);
    setModal("reschedule");
  };

  const handleServiceChange = (value: string) => {
    setService(value);

    const selected = services.find(
      (item) => item.name === value
    );

    if (selected) {
      setPrice(String(selected.price));
    }
  };

  const createReservation = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!clientName.trim()) return;

    const newReservation: Reservation = {
      id: Date.now(),
      date,
      time,
      client: clientName.trim(),
      phone: phone.trim(),
      service,
      professional,
      price: Number(price) || 0,
      status: "Pendiente",
    };

    setReservations((current) =>
      [...current, newReservation].sort(
        (a, b) =>
          `${a.date}${a.time}`.localeCompare(
            `${b.date}${b.time}`
          )
      )
    );

    setModal(null);
    resetForm();
  };

  const saveEdit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedReservation) return;

    setReservations((current) =>
      current.map((item) =>
        item.id === selectedReservation.id
          ? {
              ...item,
              client: clientName.trim(),
              phone: phone.trim(),
              service,
              professional,
              date,
              time,
              price: Number(price) || 0,
            }
          : item
      )
    );

    setSelectedReservation(null);
    setModal(null);
  };

  const saveReschedule = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedReservation) return;

    setReservations((current) =>
      current.map((item) =>
        item.id === selectedReservation.id
          ? {
              ...item,
              date,
              time,
              status: "Reprogramada",
            }
          : item
      )
    );

    setSelectedReservation(null);
    setModal(null);
  };

  const changeStatus = (
    id: number,
    status: Status
  ) => {
    setReservations((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status }
          : item
      )
    );

    setSelectedReservation(null);
  };

  const openDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setModal(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Operación
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Reservas
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Administra citas, profesionales,
              horarios, estados y reprogramaciones
              desde un solo lugar.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewReservation}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            + Nueva reserva
          </button>
        </div>

        {/* INDICADORES */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Reservas
            </p>
            <p className="mt-2 text-2xl font-bold">
              {reservations.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total registradas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Confirmadas
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {confirmed}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Citas confirmadas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pendientes
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {pending}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Requieren seguimiento
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Valor estimado
            </p>
            <p className="mt-2 text-xl font-bold">
              {currency(estimatedIncome)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {cancelled} canceladas
            </p>
          </div>

        </div>

        {/* FILTROS */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <h2 className="font-semibold">
                Agenda
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Consulta la disponibilidad y administra
                cada reserva.
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPeriod("dia")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  period === "dia"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Día
              </button>

              <button
                type="button"
                onClick={() => setPeriod("semana")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  period === "semana"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Semana
              </button>
            </div>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Buscar cliente, teléfono..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "Todos" | Status
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="Todos">
                Todos los estados
              </option>
              <option value="Confirmada">
                Confirmadas
              </option>
              <option value="Pendiente">
                Pendientes
              </option>
              <option value="Reprogramada">
                Reprogramadas
              </option>
              <option value="Cancelada">
                Canceladas
              </option>
            </select>

            <select
              value={professionalFilter}
              onChange={(e) =>
                setProfessionalFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="Todos">
                Todos los profesionales
              </option>

              {professionals.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />

          </div>
        </section>

        {/* FECHA */}

        <section className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {period === "dia"
                ? "Día seleccionado"
                : "Vista semanal"}
            </p>

            <p className="mt-1 text-lg font-bold">
              {period === "dia"
                ? selectedDate
                : "Agenda de la semana"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedDate("2026-10-07")
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Mañana
            </button>
          </div>

        </section>

        {/* AGENDA */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="grid grid-cols-[70px_1fr] gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Hora
              </span>

              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Reserva
              </span>
            </div>
          </div>

          {visibleReservations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold">
                No hay reservas
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No encontramos reservas con los
                filtros seleccionados.
              </p>

              <button
                type="button"
                onClick={openNewReservation}
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Crear reserva
              </button>
            </div>
          ) : (
            visibleReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="grid grid-cols-[70px_1fr] gap-4 border-b border-slate-100 px-5 py-5"
              >
                <div className="pt-2 text-sm font-bold">
                  {reservation.time}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <button
                      type="button"
                      onClick={() =>
                        openDetails(reservation)
                      }
                      className="text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {reservation.client}
                        </p>

                        <StatusBadge
                          status={reservation.status}
                        />
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {reservation.service}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {reservation.professional}
                        {" · "}
                        {reservation.phone}
                      </p>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="mr-2 text-sm font-semibold">
                        {currency(reservation.price)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(reservation)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openReschedule(
                            reservation
                          )
                        }
                        className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Reprogramar
                      </button>

                    </div>

                  </div>

                </div>
              </div>
            ))
          )}

        </section>

      </div>

      {/* NUEVA RESERVA */}

      {modal === "new" && (
        <Modal
          title="Nueva reserva"
          description="Registra una nueva cita para el negocio."
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={createReservation}
            className="space-y-5"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Field label="Cliente">
                <select
                  value={clientName}
                  onChange={(e) => {
                    const selected = clients.find(
                      (client) =>
                        client.name ===
                        e.target.value
                    );

                    setClientName(e.target.value);
                    setPhone(
                      selected?.phone || ""
                    );
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                >
                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.name}
                      value={client.name}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Teléfono">
                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Teléfono"
                />
              </Field>

              <Field label="Servicio">
                <select
                  value={service}
                  onChange={(e) =>
                    handleServiceChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {services.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Profesional">
                <select
                  value={professional}
                  onChange={(e) =>
                    setProfessional(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {professionals.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha">
                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                />
              </Field>

              <Field label="Hora">
                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                />
              </Field>

              <Field label="Precio">
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                />
              </Field>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Crear reserva
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* EDITAR */}

      {modal === "edit" && (
        <Modal
          title="Editar reserva"
          description="Modifica los datos de la reserva."
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={saveEdit}
            className="space-y-5"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Field label="Cliente">
                <input
                  value={clientName}
                  onChange={(e) =>
                    setClientName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  required
                />
              </Field>

              <Field label="Teléfono">
                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </Field>

              <Field label="Servicio">
                <select
                  value={service}
                  onChange={(e) =>
                    handleServiceChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {services.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Profesional">
                <select
                  value={professional}
                  onChange={(e) =>
                    setProfessional(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {professionals.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha">
                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </Field>

              <Field label="Hora">
                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </Field>

              <Field label="Precio">
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </Field>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Guardar cambios
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* REPROGRAMAR */}

      {modal === "reschedule" &&
        selectedReservation && (
          <Modal
            title="Reprogramar reserva"
            description="Cambia la fecha y hora de la cita."
            onClose={() => setModal(null)}
          >
            <form
              onSubmit={saveReschedule}
              className="space-y-5"
            >

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">
                  {selectedReservation.client}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedReservation.service}
                  {" · "}
                  {selectedReservation.professional}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Reserva actual:{" "}
                  {selectedReservation.date}{" "}
                  a las{" "}
                  {selectedReservation.time}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <Field label="Nueva fecha">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                </Field>

                <Field label="Nueva hora">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTime(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                </Field>

              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Estado después de reprogramar
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  La reserva quedará marcada como
                  Reprogramada para que el negocio
                  pueda identificar fácilmente el cambio.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Reprogramar reserva
                </button>
              </div>

            </form>
          </Modal>
        )}

      {/* DETALLE */}

      {selectedReservation &&
        !modal && (
          <Modal
            title="Detalle de reserva"
            description="Información y acciones disponibles."
            onClose={() =>
              setSelectedReservation(null)
            }
          >

            <div className="space-y-4">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm text-slate-500">
                  Estado
                </span>

                <StatusBadge
                  status={
                    selectedReservation.status
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.client}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Teléfono
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.phone ||
                      "No registrado"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Servicio
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.service}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Profesional
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.professional}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Fecha
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Hora
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedReservation.time}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Precio
                  </p>
                  <p className="mt-1 font-semibold">
                    {currency(
                      selectedReservation.price
                    )}
                  </p>
                </div>

              </div>

              <div className="border-t border-slate-100 pt-5">

                <p className="mb-3 text-sm font-semibold">
                  Acciones
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        selectedReservation
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openReschedule(
                        selectedReservation
                      )
                    }
                    className="rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    🔄 Reprogramar
                  </button>

                  {selectedReservation.status !==
                    "Confirmada" &&
                    selectedReservation.status !==
                      "Cancelada" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            selectedReservation.id,
                            "Confirmada"
                          )
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        ✓ Confirmar
                      </button>
                    )}

                  {selectedReservation.status !==
                    "Cancelada" && (
                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(
                          selectedReservation.id,
                          "Cancelada"
                        )
                      }
                      className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      ✕ Cancelar reserva
                    </button>
                  )}

                </div>

              </div>

            </div>
          </Modal>
        )}

    </main>
  );
}
