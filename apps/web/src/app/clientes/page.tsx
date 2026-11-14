"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { lower, useIndustry } from "../../lib/industry";
import {
  loadClients,
  saveClients,
  type Client,
  type ClientInput,
  type ClientStatus,
} from "@/lib/clients";

const EMPTY_FORM: ClientInput = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  status: "Activo",
};

type ModalState =
  | { mode: "closed" }
  | { mode: "new" }
  | { mode: "edit"; client: Client }
  | { mode: "profile"; client: Client };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClientsPage() {
  const industry = useIndustry();
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [form, setForm] = useState<ClientInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadClients();
    setClients(stored ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveClients(clients);
  }, [clients, loaded]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.email.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "Todos" || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = clients.length;
    const active = clients.filter((c) => c.status === "Activo").length;
    const newThisMonth = clients.filter((c) => {
      const created = new Date(c.createdAt);
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;
    const percent = total === 0 ? 0 : Math.round((active / total) * 1000) / 10;

    return { total, active, newThisMonth, percent };
  }, [clients]);

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setModal({ mode: "new" });
  }

  function openEdit(client: Client) {
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      notes: client.notes,
      status: client.status,
    });
    setError("");
    setModal({ mode: "edit", client });
  }

  function closeModal() {
    setModal({ mode: "closed" });
  }

  function toggleStatus(id: string) {
    setClients((current) =>
      current.map((client) =>
        client.id === id
          ? {
              ...client,
              status: client.status === "Activo" ? "Inactivo" : "Activo",
            }
          : client,
      ),
    );

    setModal((current) =>
      current.mode === "profile" && current.client.id === id
        ? {
            mode: "profile",
            client: {
              ...current.client,
              status:
                current.client.status === "Activo" ? "Inactivo" : "Activo",
            },
          }
        : current,
    );
  }

  function deleteClient(client: Client) {
    const confirmed = window.confirm(
      `¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setClients((current) => current.filter((item) => item.id !== client.id));
    closeModal();
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();

    if (!name) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!phone && !email) {
      setError("Ingresa al menos un teléfono o un correo.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    const clean: ClientInput = {
      name,
      phone,
      email,
      notes: form.notes.trim(),
      status: form.status,
    };

    if (modal.mode === "edit") {
      const editedId = modal.client.id;

      setClients((current) =>
        current.map((client) =>
          client.id === editedId ? { ...client, ...clean } : client,
        ),
      );
    } else if (modal.mode === "new") {
      const newClient: Client = {
        id: crypto.randomUUID(),
        ...clean,
        visits: 0,
        lastVisit: "Sin visitas",
        createdAt: new Date().toISOString(),
      };

      setClients((current) => [newClient, ...current]);
    }

    closeModal();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400";

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Gestión de {lower(industry.clients)}
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {industry.clients}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Administra la información y el historial de tus{" "}
              {lower(industry.clients)}.
            </p>
          </div>

          <button
            type="button"
            onClick={openNew}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + {industry.newClient}
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de {lower(industry.clients)}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{industry.clients} activos</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.active}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.percent.toLocaleString("es-CO")}% de la base
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Nuevos este mes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.newThisMonth}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Lista de {lower(industry.clients)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Consulta y administra tus {lower(industry.clients)}.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Buscar ${lower(industry.client)}...`}
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
                  {[
                    "Cliente",
                    "Teléfono",
                    "Correo",
                    "Visitas",
                    "Última visita",
                    "Estado",
                    "Acción",
                  ].map((title) => (
                    <th
                      key={title}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {title}
                    </th>
                  ))}
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
                      {client.phone || "—"}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {client.email || "—"}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {client.visits}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {client.lastVisit}
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => toggleStatus(client.id)}
                        title="Cambiar estado"
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 ${
                          client.status === "Activo"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {client.status}
                      </button>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setModal({ mode: "profile", client })
                          }
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Ver perfil
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(client)}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loaded && filteredClients.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No encontramos {lower(industry.clients)} con esos criterios.
            </div>
          )}
        </section>
      </div>

      {modal.mode !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {modal.mode === "profile" ? (
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {modal.client.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Cliente desde {formatDate(modal.client.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Cerrar
                  </button>
                </div>

                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Teléfono</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.phone || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Correo</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.email || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Visitas</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.visits}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Última visita</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.lastVisit}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Estado</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.status}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Notas</dt>
                    <dd className="font-medium text-slate-900">
                      {modal.client.notes || "Sin notas."}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(modal.client)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatus(modal.client.id)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {modal.client.status === "Activo"
                      ? "Marcar como inactivo"
                      : "Marcar como activo"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteClient(modal.client)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitForm} noValidate>
                <h2 className="mb-5 text-xl font-bold text-slate-900">
                  {modal.mode === "new"
                    ? industry.newClient
                    : `Editar ${lower(industry.client)}`}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm({ ...form, phone: event.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Correo
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Estado
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as ClientStatus,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Notas
                    </label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) =>
                        setForm({ ...form, notes: event.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
