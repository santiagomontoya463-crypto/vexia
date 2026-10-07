"use client";

import { useEffect, useMemo, useState } from "react";

type ServiceStatus = "Activo" | "Inactivo";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
};

const SERVICES_KEY = "vexia:services";

const defaultServices: Service[] = [
  {
    id: "service-1",
    name: "Corte clásico",
    category: "Barbería",
    description: "Corte tradicional personalizado.",
    duration: "30 min",
    price: 25000,
    status: "Activo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-2",
    name: "Corte + barba",
    category: "Barbería",
    description: "Corte de cabello y arreglo de barba.",
    duration: "45 min",
    price: 40000,
    status: "Activo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-3",
    name: "Diseño de uñas",
    category: "Belleza",
    description: "Servicio de diseño y cuidado de uñas.",
    duration: "60 min",
    price: 50000,
    status: "Activo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadServices(): Service[] {
  if (typeof window === "undefined") {
    return defaultServices;
  }

  try {
    const raw = window.localStorage.getItem(SERVICES_KEY);

    if (!raw) {
      return defaultServices;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return defaultServices;
    }

    return parsed.map((service: Partial<Service>) => ({
      id: service.id ?? crypto.randomUUID(),
      name: service.name ?? "Servicio",
      category: service.category ?? "General",
      description: service.description ?? "",
      duration: service.duration ?? "30 min",
      price: Number(service.price ?? 0),
      status: service.status === "Inactivo" ? "Inactivo" : "Activo",
      createdAt: service.createdAt ?? new Date().toISOString(),
      updatedAt: service.updatedAt ?? new Date().toISOString(),
    }));
  } catch {
    return defaultServices;
  }
}

function saveServices(services: Service[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SERVICES_KEY,
    JSON.stringify(services),
  );
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CO")}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(defaultServices);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] =
    useState<ServiceStatus>("Activo");

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setServices(loadServices());
  }, []);

  useEffect(() => {
    saveServices(services);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        service.category
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "Todos" ||
        service.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  const activeServices = services.filter(
    (service) => service.status === "Activo",
  ).length;

  const inactiveServices = services.filter(
    (service) => service.status === "Inactivo",
  ).length;

  function resetForm() {
    setName("");
    setCategory("");
    setDescription("");
    setDuration("");
    setPrice("");
    setStatus("Activo");
    setFormError("");
  }

  function openNewService() {
    resetForm();
    setSelectedService(null);
    setShowEdit(false);
    setShowForm(true);
  }

  function createService() {
    const cleanName = name.trim();
    const cleanCategory = category.trim();
    const cleanDuration = duration.trim();
    const numericPrice = Number(
      price.replace(/[^0-9.]/g, ""),
    );

    if (
      !cleanName ||
      !cleanCategory ||
      !cleanDuration ||
      !price
    ) {
      setFormError(
        "Completa nombre, categoría, duración y precio.",
      );
      return;
    }

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setFormError("Ingresa un precio válido.");
      return;
    }

    const now = new Date().toISOString();

    const newService: Service = {
      id: crypto.randomUUID(),
      name: cleanName,
      category: cleanCategory,
      description: description.trim(),
      duration: cleanDuration,
      price: numericPrice,
      status,
      createdAt: now,
      updatedAt: now,
    };

    setServices((current) => [
      ...current,
      newService,
    ]);

    setShowForm(false);
    resetForm();
  }

  function openDetails(service: Service) {
    setSelectedService(service);
    setShowDetails(true);
  }

  function openEdit(service: Service) {
    setSelectedService(service);
    setName(service.name);
    setCategory(service.category);
    setDescription(service.description);
    setDuration(service.duration);
    setPrice(String(service.price));
    setStatus(service.status);
    setFormError("");
    setShowEdit(true);
  }

  function updateService() {
    if (!selectedService) return;

    const cleanName = name.trim();
    const cleanCategory = category.trim();
    const cleanDuration = duration.trim();
    const numericPrice = Number(
      price.replace(/[^0-9.]/g, ""),
    );

    if (
      !cleanName ||
      !cleanCategory ||
      !cleanDuration ||
      !price
    ) {
      setFormError(
        "Completa nombre, categoría, duración y precio.",
      );
      return;
    }

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      setFormError("Ingresa un precio válido.");
      return;
    }

    setServices((current) =>
      current.map((service) =>
        service.id === selectedService.id
          ? {
              ...service,
              name: cleanName,
              category: cleanCategory,
              description: description.trim(),
              duration: cleanDuration,
              price: numericPrice,
              status,
              updatedAt: new Date().toISOString(),
            }
          : service,
      ),
    );

    setShowEdit(false);
    setSelectedService(null);
    resetForm();
  }

  function toggleServiceStatus(service: Service) {
    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? {
              ...item,
              status:
                item.status === "Activo"
                  ? "Inactivo"
                  : "Activo",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    if (selectedService?.id === service.id) {
      setSelectedService({
        ...service,
        status:
          service.status === "Activo"
            ? "Inactivo"
            : "Activo",
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Gestión de servicios
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              Servicios
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Administra los servicios que ofrece tu empresa.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewService}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            + Nuevo servicio
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Servicios
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {services.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Activos
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {activeServices}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inactivos
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-500">
              {inactiveServices}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicio o categoría..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option>Todos</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Servicio
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duración
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Precio
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {service.name}
                        </p>

                        {service.description && (
                          <p className="mt-1 max-w-xs truncate text-sm text-slate-500">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {service.category}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {service.duration}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(service.price)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          service.status === "Activo"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {service.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openDetails(service)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Detalles
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(service)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleServiceStatus(service)
                          }
                          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {service.status === "Activo"
                            ? "Desactivar"
                            : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredServices.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                No encontramos servicios.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Prueba con otro término de búsqueda o crea un nuevo servicio.
              </p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Nuevo servicio
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configura la información completa del servicio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del servicio"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Categoría"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duración (ej. 45 min)"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Precio"
                inputMode="numeric"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as ServiceStatus,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Descripción / observaciones"
                rows={3}
                className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 font-medium dark:border-slate-700 dark:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={createService}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Guardar servicio
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Editar servicio
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Categoría"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duración"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Precio"
                inputMode="numeric"
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as ServiceStatus,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Descripción / observaciones"
                rows={3}
                className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {formError && (
              <p className="mt-4 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 dark:border-slate-700 dark:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={updateService}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Detalle del servicio
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedService.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">
                  Categoría
                </p>
                <p className="mt-1 font-semibold dark:text-white">
                  {selectedService.category}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">
                  Duración
                </p>
                <p className="mt-1 font-semibold dark:text-white">
                  {selectedService.duration}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">
                  Precio
                </p>
                <p className="mt-1 font-semibold dark:text-white">
                  {formatCurrency(selectedService.price)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">
                  Estado
                </p>
                <p className="mt-1 font-semibold dark:text-white">
                  {selectedService.status}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2 dark:bg-slate-800">
                <p className="text-xs text-slate-500">
                  Descripción / observaciones
                </p>

                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  {selectedService.description ||
                    "Sin observaciones registradas."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  openEdit(selectedService);
                }}
                className="rounded-xl border border-slate-300 px-5 py-3 font-medium dark:border-slate-700 dark:text-white"
              >
                Editar servicio
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleServiceStatus(selectedService)
                }
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                {selectedService.status === "Activo"
                  ? "Desactivar"
                  : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
