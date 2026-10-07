"use client";

import { useMemo, useState } from "react";

type WorkerStatus = "Activo" | "Inactivo" | "Pendiente";

type Worker = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: WorkerStatus;
  services: string[];
  schedule: string;
  reservations: number;
  initials: string;
  color: string;
  lastActivity: string;
};

const initialWorkers: Worker[] = [
  {
    id: 1,
    name: "Andrés Martínez",
    email: "andres@empresa.com",
    phone: "+57 300 000 0000",
    role: "Administrador",
    status: "Activo",
    services: ["Corte", "Barba"],
    schedule: "Lun — Sáb · 8:00 AM — 6:00 PM",
    reservations: 18,
    initials: "AM",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    lastActivity: "Hace 12 minutos",
  },
  {
    id: 2,
    name: "Carlos Gómez",
    email: "carlos@empresa.com",
    phone: "+57 301 000 0000",
    role: "Trabajador",
    status: "Activo",
    services: ["Corte", "Diseño"],
    schedule: "Mar — Sáb · 9:00 AM — 7:00 PM",
    reservations: 24,
    initials: "CG",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    lastActivity: "Hace 35 minutos",
  },
  {
    id: 3,
    name: "Laura Rodríguez",
    email: "laura@empresa.com",
    phone: "+57 302 000 0000",
    role: "Gerente / Supervisor",
    status: "Activo",
    services: ["Color", "Tratamiento"],
    schedule: "Lun — Vie · 8:00 AM — 5:00 PM",
    reservations: 16,
    initials: "LR",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    lastActivity: "Ayer",
  },
  {
    id: 4,
    name: "Miguel Torres",
    email: "miguel@empresa.com",
    phone: "+57 303 000 0000",
    role: "Trabajador",
    status: "Pendiente",
    services: ["Corte"],
    schedule: "Sin horario configurado",
    reservations: 0,
    initials: "MT",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    lastActivity: "Invitación enviada",
  },
];

const roles = [
  "Todos",
  "Propietario",
  "Gerente / Supervisor",
  "Administrador",
  "Trabajador",
];

const serviceOptions = [
  "Corte",
  "Barba",
  "Diseño",
  "Color",
  "Tratamiento",
  "Manicure",
  "Pedicure",
  "Masaje",
  "Diagnóstico",
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Trabajador");
  const [services, setServices] = useState<string[]>([]);
  const [schedule, setSchedule] = useState("Lun — Sáb · 8:00 AM — 6:00 PM");

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workers.filter((worker) => {
      const matchesSearch =
        !query ||
        worker.name.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query) ||
        worker.role.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "Todos" || worker.role === roleFilter;

      const matchesStatus =
        statusFilter === "Todos" || worker.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [workers, search, roleFilter, statusFilter]);

  const activeCount = workers.filter(
    (worker) => worker.status === "Activo"
  ).length;

  const pendingCount = workers.filter(
    (worker) => worker.status === "Pendiente"
  ).length;

  const totalReservations = workers.reduce(
    (total, worker) => total + worker.reservations,
    0
  );

  const toggleService = (service: string) => {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  };

  const createWorker = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) return;

    const newWorker: Worker = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || "Sin teléfono",
      role,
      status: "Pendiente",
      services: services.length ? services : ["Sin servicios"],
      schedule,
      reservations: 0,
      initials: name
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
      color:
        "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      lastActivity: "Creado ahora",
    };

    setWorkers((current) => [newWorker, ...current]);
    setName("");
    setEmail("");
    setPhone("");
    setRole("Trabajador");
    setServices([]);
    setSchedule("Lun — Sáb · 8:00 AM — 6:00 PM");
    setShowForm(false);
  };

  const toggleStatus = (id: number) => {
    setWorkers((current) =>
      current.map((worker) => {
        if (worker.id !== id) return worker;

        return {
          ...worker,
          status: worker.status === "Activo" ? "Inactivo" : "Activo",
          lastActivity: "Actualizado ahora",
        };
      })
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Gestión del equipo
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Trabajadores
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Administra tu equipo, asigna servicios, controla horarios y
              consulta la actividad de cada profesional.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + Agregar trabajador
          </button>
        </div>

        {/* METRICS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Equipo total"
            value={workers.length}
            description="Personas registradas"
            icon="👥"
          />

          <Metric
            label="Activos"
            value={activeCount}
            description="Con acceso operativo"
            icon="●"
            positive
          />

          <Metric
            label="Pendientes"
            value={pendingCount}
            description="Esperando activación"
            icon="◷"
          />

          <Metric
            label="Reservas asignadas"
            value={totalReservations}
            description="Actividad actual"
            icon="▣"
          />
        </div>

        {/* FORM */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Nuevo trabajador</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Registra la información básica y prepara su acceso al
                  negocio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={createWorker}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Nombre completo"
                  value={name}
                  onChange={setName}
                  placeholder="Ej. Santiago Montoya"
                  required
                />

                <Field
                  label="Correo empresarial"
                  value={email}
                  onChange={setEmail}
                  placeholder="nombre@empresa.com"
                  type="email"
                  required
                />

                <Field
                  label="Teléfono"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+57 300 000 0000"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Rol
                  </label>

                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {roles
                      .filter((item) => item !== "Todos")
                      .map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Horario
                  </label>

                  <select
                    value={schedule}
                    onChange={(event) => setSchedule(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option>Lun — Sáb · 8:00 AM — 6:00 PM</option>
                    <option>Lun — Vie · 8:00 AM — 5:00 PM</option>
                    <option>Mar — Sáb · 9:00 AM — 7:00 PM</option>
                    <option>Horario personalizado</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold">
                  Servicios que puede realizar
                </p>

                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map((service) => {
                    const selected = services.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          selected
                            ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        }`}
                      >
                        {selected ? "✓ " : ""}
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Crear trabajador
                </button>
              </div>
            </form>
          </section>
        )}

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div className="relative w-full xl:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar trabajador..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Pendiente</option>
              </select>

              <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setView("cards")}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold ${
                    view === "cards"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-500"
                  }`}
                >
                  Tarjetas
                </button>

                <button
                  type="button"
                  onClick={() => setView("table")}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold ${
                    view === "table"
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-500"
                  }`}
                >
                  Tabla
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        {filteredWorkers.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
              🔎
            </div>

            <h2 className="font-bold">No encontramos trabajadores</h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Prueba con otro nombre, rol o estado.
            </p>
          </section>
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onSelect={() => setSelectedWorker(worker)}
                onToggleStatus={() => toggleStatus(worker.id)}
              />
            ))}
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trabajador
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Rol
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Servicios
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reservas
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar worker={worker} />

                          <div>
                            <p className="font-semibold">{worker.name}</p>
                            <p className="text-xs text-slate-500">
                              {worker.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {worker.role}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-[250px] flex-wrap gap-1.5">
                          {worker.services.map((service) => (
                            <span
                              key={service}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">
                        {worker.reservations}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={worker.status} />
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedWorker(worker)}
                          className="cursor-pointer text-sm font-semibold hover:underline"
                        >
                          Ver perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-5 text-xs text-slate-400">
          Mostrando {filteredWorkers.length} de {workers.length} trabajadores.
        </p>
      </div>

      {/* DETAIL PANEL */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">

            <div className="mb-7 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar worker={selectedWorker} large />

                <div>
                  <h2 className="text-xl font-bold">
                    {selectedWorker.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedWorker.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="cursor-pointer rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Correo" value={selectedWorker.email} />
              <Detail label="Teléfono" value={selectedWorker.phone} />
              <Detail label="Horario" value={selectedWorker.schedule} />
              <Detail
                label="Reservas asignadas"
                value={String(selectedWorker.reservations)}
              />
              <Detail
                label="Última actividad"
                value={selectedWorker.lastActivity}
              />
              <Detail
                label="Estado"
                value={selectedWorker.status}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <h3 className="font-semibold">Servicios asignados</h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedWorker.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold dark:bg-slate-800"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <h3 className="font-semibold">Próximas funciones</h3>

              <div className="mt-4 space-y-3">
                <ActionRow icon="📅" title="Ver agenda del trabajador" />
                <ActionRow icon="✂️" title="Administrar servicios asignados" />
                <ActionRow icon="🔐" title="Administrar permisos" />
                <ActionRow icon="◷" title="Configurar horario y disponibilidad" />
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => toggleStatus(selectedWorker.id)}
                className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-700"
              >
                {selectedWorker.status === "Activo"
                  ? "Desactivar trabajador"
                  : "Activar trabajador"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  description,
  icon,
  positive = false,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm ${
            positive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function WorkerCard({
  worker,
  onSelect,
  onToggleStatus,
}: {
  worker: Worker;
  onSelect: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar worker={worker} />

          <div className="min-w-0">
            <h3 className="truncate font-bold">
              {worker.name}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {worker.role}
            </p>
          </div>
        </div>

        <StatusBadge status={worker.status} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniInfo
          label="Reservas"
          value={String(worker.reservations)}
        />

        <MiniInfo
          label="Actividad"
          value={worker.lastActivity}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Servicios
        </p>

        <div className="flex flex-wrap gap-1.5">
          {worker.services.map((service) => (
            <span
              key={service}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {service}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Ver perfil
        </button>

        <button
          type="button"
          onClick={onToggleStatus}
          className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {worker.status === "Activo" ? "Desactivar" : "Activar"}
        </button>
      </div>
    </article>
  );
}

function Avatar({
  worker,
  large = false,
}: {
  worker: Worker;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-bold ${
        large ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm"
      } ${worker.color}`}
    >
      {worker.initials}
    </div>
  );
}

function StatusBadge({ status }: { status: WorkerStatus }) {
  const styles =
    status === "Activo"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : status === "Pendiente"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${styles}`}
    >
      {status}
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[11px] font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function ActionRow({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
        {icon}
      </span>

      <span className="text-sm font-semibold">
        {title}
      </span>

      <span className="ml-auto text-slate-400">
        →
      </span>
    </button>
  );
}
