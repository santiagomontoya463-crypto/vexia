"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activateSupplier,
  calculateSupplierSummary,
  deactivateSupplier,
  loadSuppliers,
  registerSupplier,
} from "@/lib/suppliers";
import type { Supplier, SupplierType } from "@/lib/suppliers";

const BUSINESS_ID = "current-business";

const typeLabels: Record<SupplierType, string> = {
  product: "Productos",
  service: "Servicios",
  mixed: "Productos y servicios",
  contractor: "Contratista",
  other: "Otro",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const emptyForm = {
  name: "",
  legalName: "",
  taxId: "",
  type: "product" as SupplierType,
  contactName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

type SupplierForm = typeof emptyForm;

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<SupplierForm>({ ...emptyForm });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function refresh() {
    setSuppliers(
      loadSuppliers().filter((supplier) => supplier.businessId === BUSINESS_ID),
    );
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesQuery =
        !normalized ||
        [
          supplier.name,
          supplier.legalName,
          supplier.taxId,
          supplier.phone,
          supplier.email,
          supplier.contactName,
        ].some((value) => value?.toLowerCase().includes(normalized));

      const matchesStatus =
        statusFilter === "all" || supplier.status === statusFilter;

      const matchesType =
        typeFilter === "all" || supplier.type === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [suppliers, query, statusFilter, typeFilter]);

  const summary = useMemo(
    () => calculateSupplierSummary(suppliers),
    [suppliers],
  );

  function openCreate() {
    setForm({ ...emptyForm });
    setEditingId(undefined);
    setSelected(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEdit(supplier: Supplier) {
    setForm({
      name: supplier.name,
      legalName: supplier.legalName ?? "",
      taxId: supplier.taxId ?? "",
      type: supplier.type,
      contactName: supplier.contactName ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      city: supplier.city ?? "",
      notes: supplier.notes ?? "",
    });
    setEditingId(supplier.id);
    setSelected(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function saveSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      registerSupplier({
        businessId: BUSINESS_ID,
        supplierId: editingId,
        name: form.name,
        legalName: form.legalName,
        taxId: form.taxId,
        type: form.type,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        notes: form.notes,
      });

      refresh();
      setShowForm(false);
      setNotice(editingId ? "Proveedor actualizado." : "Proveedor creado.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el proveedor.",
      );
    }
  }

  function toggleStatus(supplier: Supplier) {
    try {
      if (supplier.status === "active") {
        deactivateSupplier(supplier.id, BUSINESS_ID);
      } else {
        activateSupplier(supplier.id, BUSINESS_ID);
      }

      refresh();
      setSelected(null);
      setNotice(
        supplier.status === "active"
          ? "Proveedor desactivado. Su historial se conserva."
          : "Proveedor activado.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el proveedor.",
      );
    }
  }

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950";

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Gestión del negocio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Proveedores</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Organiza tus aliados comerciales, contactos y compromisos de pago.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            + Nuevo proveedor
          </button>
        </header>

        {notice && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            {notice}
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Proveedores registrados", value: summary.totalSuppliers, detail: "En este negocio" },
            { label: "Proveedores activos", value: summary.activeSuppliers, detail: `${summary.inactiveSuppliers} inactivos` },
            { label: "Saldo pendiente", value: money(summary.totalPending), detail: `${summary.suppliersWithPendingBalance} proveedores con saldo` },
            { label: "Saldo vencido", value: money(summary.totalOverdue), detail: `${summary.suppliersWithOverdueBalance} proveedores con vencimientos` },
          ].map((metric) => (
            <article key={metric.label} className={cardClass}>
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 break-words text-2xl font-bold">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className={cardClass}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              aria-label="Buscar proveedor"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, NIT, teléfono o correo..."
              className={`${inputClass} md:col-span-1`}
            />
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <select
              aria-label="Filtrar por tipo"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">Todos los tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Directorio de proveedores</h2>
              <p className="mt-1 text-sm text-slate-500">{filtered.length} resultado(s)</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-900">▤</div>
              <h3 className="mt-4 font-semibold">
                {suppliers.length === 0 ? "Aún no tienes proveedores" : "No encontramos resultados"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {suppliers.length === 0
                  ? "Registra tus proveedores de productos, servicios, insumos, equipos o servicios externos."
                  : "Prueba con otro término o cambia los filtros."}
              </p>
              {suppliers.length === 0 && (
                <button onClick={openCreate} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  Registrar primer proveedor
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((supplier) => (
                <article key={supplier.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                  <button
                    onClick={() => setSelected(supplier)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{supplier.name}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${supplier.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                        {supplier.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {typeLabels[supplier.type]}{supplier.taxId ? ` · ${supplier.taxId}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {[supplier.contactName, supplier.phone, supplier.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </button>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <div className="md:text-right">
                      <p className="text-xs text-slate-500">Saldo pendiente</p>
                      <p className="mt-1 font-semibold">{money(supplier.pendingBalance)}</p>
                    </div>
                    <button onClick={() => openEdit(supplier)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
                      Editar
                    </button>
                    <button onClick={() => toggleStatus(supplier)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">
                      {supplier.status === "active" ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
            <section role="dialog" aria-modal="true" aria-labelledby="supplier-form-title" className="my-4 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7 dark:bg-slate-950">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 id="supplier-form-title" className="text-xl font-bold">
                    {editingId ? "Editar proveedor" : "Nuevo proveedor"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Los campos con * son obligatorios.</p>
                </div>
                <button onClick={() => setShowForm(false)} aria-label="Cerrar formulario" className="rounded-lg px-3 py-1 text-xl hover:bg-slate-100 dark:hover:bg-slate-900">×</button>
              </div>

              <form onSubmit={saveSupplier} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium">
                    Nombre comercial *
                    <input required maxLength={120} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Suministros del Norte" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Razón social
                    <input className={inputClass} value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    NIT / Identificación
                    <input className={inputClass} value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Tipo de proveedor
                    <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SupplierType })}>
                      {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Persona de contacto
                    <input className={inputClass} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Teléfono
                    <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Correo electrónico
                    <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    Ciudad
                    <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                    Dirección
                    <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                    Observaciones
                    <textarea rows={3} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </label>
                </div>

                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Cancelar</button>
                  <button type="submit" className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                    {editingId ? "Guardar cambios" : "Crear proveedor"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
            <section role="dialog" aria-modal="true" aria-labelledby="supplier-detail-title" className="my-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Ficha del proveedor</p>
                  <h2 id="supplier-detail-title" className="mt-1 text-2xl font-bold">{selected.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{typeLabels[selected.type]} · {selected.status === "active" ? "Activo" : "Inactivo"}</p>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Cerrar detalle" className="rounded-lg px-3 py-1 text-xl hover:bg-slate-100 dark:hover:bg-slate-900">×</button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Razón social", selected.legalName],
                  ["NIT / Identificación", selected.taxId],
                  ["Contacto", selected.contactName],
                  ["Teléfono", selected.phone],
                  ["Correo", selected.email],
                  ["Ciudad", selected.city],
                  ["Dirección", selected.address],
                  ["Compras acumuladas", money(selected.totalPurchases)],
                  ["Pagado", money(selected.totalPaid)],
                  ["Saldo pendiente", money(selected.pendingBalance)],
                  ["Saldo vencido", money(selected.overdueBalance)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-sm font-medium">{value || "Sin información"}</p>
                  </div>
                ))}
              </div>

              {selected.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selected.notes}</p>}

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button onClick={() => toggleStatus(selected)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                  {selected.status === "active" ? "Desactivar proveedor" : "Activar proveedor"}
                </button>
                <button onClick={() => openEdit(selected)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Editar proveedor</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
