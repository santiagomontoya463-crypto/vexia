"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createPurchaseRequest,
  loadPurchaseRequests,
  reviewPurchaseRequest,
  convertApprovedPurchaseRequest,
} from "@/lib/purchase-requests";
import type {
  PurchaseRequest,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
  PurchaseRequestItem,
} from "@/lib/purchase-requests";
import { loadProducts } from "@/lib/inventory/storage";
import type { Product } from "@/lib/inventory";
import { loadSuppliers } from "@/lib/suppliers/storage";
import type { Supplier } from "@/lib/suppliers/types";

const BUSINESS_ID = "current-business";
const USER = "Usuario VEXIA";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const statusLabels: Record<PurchaseRequestStatus, string> = {
  draft: "Borrador",
  submitted: "Pendiente de revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  changes_requested: "Requiere cambios",
  converted: "Convertida en compra",
};

const priorityLabels: Record<PurchaseRequestPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const statusStyles: Record<PurchaseRequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  submitted: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  changes_requested: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  converted: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-950";

type DraftItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  cost: string;
  notes: string;
};

function makeItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    productId: "",
    productName: "",
    quantity: "1",
    cost: "0",
    notes: "",
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 break-words text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export default function SolicitudesCompraPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [converting, setConverting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [justification, setJustification] = useState("");
  const [priority, setPriority] = useState<PurchaseRequestPriority>("normal");
  const [requiredDate, setRequiredDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function refreshRequests() {
    setRequests(
      loadPurchaseRequests().filter(
        (request) => request.businessId === BUSINESS_ID,
      ),
    );
  }

  useEffect(() => {
    const availableSuppliers = loadSuppliers().filter(
      (supplier) =>
        supplier.businessId === BUSINESS_ID &&
        supplier.status === "active",
    );
    setSuppliers(availableSuppliers);
    setSelectedSupplierId(availableSuppliers[0]?.id ?? "");
  }, []);

  useEffect(() => {
    refreshRequests();
    setProducts(
      loadProducts().filter(
        (product) =>
          product.businessId === BUSINESS_ID &&
          product.active &&
          product.status === "active",
      ),
    );
    setItems([makeItem()]);
    setLoaded(true);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request) => {
      const statusMatches =
        statusFilter === "all" || request.status === statusFilter;
      const searchMatches =
        !term ||
        request.code.toLowerCase().includes(term) ||
        request.title.toLowerCase().includes(term) ||
        request.requestedBy.toLowerCase().includes(term) ||
        request.items.some((item) =>
          item.productName.toLowerCase().includes(term),
        );

      return statusMatches && searchMatches;
    });
  }, [requests, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = requests.filter(
      (request) =>
        request.status === "submitted" ||
        request.status === "changes_requested",
    ).length;
    const approved = requests.filter(
      (request) => request.status === "approved",
    ).length;
    const rejected = requests.filter(
      (request) => request.status === "rejected",
    ).length;
    const estimated = requests
      .filter(
        (request) =>
          request.status !== "rejected" &&
          request.status !== "converted",
      )
      .reduce((sum, request) => sum + request.estimatedTotal, 0);

    return { pending, approved, rejected, estimated };
  }, [requests]);

  const draftTotal = items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.quantity) || 0) *
        Math.max(0, Number(item.cost) || 0),
    0,
  );

  function updateItem(id: string, changes: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    );
  }

  function chooseProduct(id: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateItem(id, {
      productId,
      productName: product?.name ?? "",
      cost: product ? String(product.cost) : "0",
    });
  }

  function closeForm() {
    setTitle("");
    setJustification("");
    setPriority("normal");
    setRequiredDate("");
    setItems([makeItem()]);
    setError("");
    setShowForm(false);
  }

  function submitRequest() {
    setError("");
    setMessage("");

    if (!title.trim()) {
      setError("Escribe el título de la solicitud.");
      return;
    }

    if (!justification.trim()) {
      setError("Explica por qué se necesita esta compra.");
      return;
    }

    if (
      items.some(
        (item) =>
          !item.productName.trim() ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.cost)) ||
          Number(item.cost) < 0,
      )
    ) {
      setError("Revisa los artículos, las cantidades y los costos estimados.");
      return;
    }

    try {
      const requestItems: PurchaseRequestItem[] = items.map((item) => ({
        id: item.id,
        productId: item.productId || undefined,
        productName: item.productName.trim(),
        quantity: Number(item.quantity),
        estimatedUnitCost: Number(item.cost),
        notes: item.notes.trim() || undefined,
      }));

      createPurchaseRequest({
        businessId: BUSINESS_ID,
        title: title.trim(),
        justification: justification.trim(),
        priority,
        requiredDate: requiredDate || undefined,
        requestedBy: USER,
        items: requestItems,
      });

      refreshRequests();
      closeForm();
      setMessage("Solicitud creada y enviada para revisión.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No fue posible crear la solicitud.",
      );
    }
  }

  function handleConvertApprovedRequest() {
    if (!selected || selected.status !== "approved" || converting) return;

    const supplier = suppliers.find(
      (item) =>
        item.id === selectedSupplierId &&
        item.businessId === BUSINESS_ID &&
        item.status === "active",
    );

    if (!supplier) {
      setMessage("Selecciona un proveedor activo de este negocio.");
      return;
    }

    setConverting(true);
    try {
      const result = convertApprovedPurchaseRequest({
        businessId: BUSINESS_ID,
        requestId: selected.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        createdBy: USER,
      });

      refreshRequests();
      setSelected(result.request);
      setSelectedSupplierId(supplier.id);
      setMessage(
        result.alreadyConverted
          ? "Esta solicitud ya estaba convertida. No se creó una compra duplicada."
          : `¡Compra creada correctamente! Proveedor: ${supplier.name}. La compra quedó pendiente de recepción; el inventario no cambia hasta registrar la mercancía.`,
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "No fue posible convertir la solicitud en compra.",
      );
    } finally {
      setConverting(false);
    }
  }

  function handleReview(
    status: "approved" | "rejected" | "changes_requested",
  ) {
    if (!selected) return;

    try {
      reviewPurchaseRequest(
        BUSINESS_ID,
        selected.id,
        status,
        USER,
        reviewNotes,
      );
      refreshRequests();
      setSelected(null);
      setReviewNotes("");
      setMessage(`Solicitud actualizada: ${statusLabels[status]}.`);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "No fue posible revisar la solicitud.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
              VEXIA · Abastecimiento
            </p>
            <h1 className="mt-1 text-2xl font-bold">Solicitudes de compra</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Solicita productos o materiales y controla su revisión antes de comprar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              if (!showForm && items.length === 0) setItems([makeItem()]);
            }}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
          >
            {showForm ? "Cerrar formulario" : "+ Nueva solicitud"}
          </button>
        </section>

        {message && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} aria-label="Cerrar mensaje">✕</button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Por revisar" value={String(summary.pending)} detail="Pendientes o con cambios" />
          <Metric title="Aprobadas" value={String(summary.approved)} detail="Autorizadas para continuar" />
          <Metric title="Rechazadas" value={String(summary.rejected)} detail="No autorizadas" />
          <Metric title="Valor estimado" value={money(summary.estimated)} detail="Solicitudes no rechazadas ni convertidas" />
        </section>

        {showForm && (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-lg font-bold">Crear solicitud</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Los costos son estimados. Crear una solicitud no modifica las existencias.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título">
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Reposición de materiales" className={inputClass} />
              </Field>
              <Field label="Fecha en que se necesita">
                <input type="date" value={requiredDate} onChange={(event) => setRequiredDate(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Prioridad">
                <select value={priority} onChange={(event) => setPriority(event.target.value as PurchaseRequestPriority)} className={inputClass}>
                  {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Justificación">
                <textarea value={justification} onChange={(event) => setJustification(event.target.value)} rows={2} placeholder="¿Por qué se necesita esta compra?" className={inputClass} />
              </Field>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">Artículos solicitados</h3>
                <button type="button" onClick={() => setItems((current) => [...current, makeItem()])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  + Agregar artículo
                </button>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-2 xl:grid-cols-4">
                  <Field label={`Artículo ${index + 1} · Inventario`}>
                    <select value={item.productId} onChange={(event) => chooseProduct(item.id, event.target.value)} className={inputClass}>
                      <option value="">Otro artículo o material</option>
                      {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Nombre del artículo">
                    <input value={item.productName} onChange={(event) => updateItem(item.id, { productName: event.target.value, productId: "" })} placeholder="Producto o material" className={inputClass} />
                  </Field>
                  <Field label="Cantidad">
                    <input type="number" min="0.01" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Costo unitario estimado (COP)">
                    <input type="number" min="0" step="any" value={item.cost} onChange={(event) => updateItem(item.id, { cost: event.target.value })} className={inputClass} />
                  </Field>
                  <div className="grid gap-3 md:col-span-2 xl:col-span-4 xl:grid-cols-[1fr_auto_auto] xl:items-end">
                    <Field label="Observaciones (opcional)">
                      <input value={item.notes} onChange={(event) => updateItem(item.id, { notes: event.target.value })} placeholder="Marca, especificaciones o detalles" className={inputClass} />
                    </Field>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal estimado</p>
                      <p className="font-semibold">{money(Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.cost) || 0))}</p>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">
                        Quitar artículo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total estimado</p>
                <p className="text-2xl font-bold">{money(draftTotal)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700">Cancelar</button>
                <button type="button" onClick={submitRequest} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">Enviar a revisión</button>
              </div>
            </div>
            {error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold">Historial de solicitudes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Consulta el detalle, el valor estimado y las decisiones registradas.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar código, título o artículo..." className={inputClass} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
              <option value="all">Todos los estados</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <p className="flex items-center text-sm text-slate-500 dark:text-slate-400">{filtered.length} solicitud(es)</p>
          </div>

          {!loaded ? (
            <p className="py-8 text-center text-sm text-slate-500">Cargando solicitudes...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
              <p className="font-semibold">Todavía no hay solicitudes para mostrar</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crea una solicitud para iniciar el proceso de abastecimiento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((request) => (
                <article key={request.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{request.code}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>{statusLabels[request.status]}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">Prioridad {priorityLabels[request.priority].toLowerCase()}</span>
                      </div>
                      <h3 className="font-semibold">{request.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {request.items.length} artículo(s) · Solicitó {request.requestedBy} · {new Date(request.createdAt).toLocaleDateString("es-CO")}
                      </p>
                      <p className="font-semibold">{money(request.estimatedTotal)}</p>
                    </div>
                    <button type="button" onClick={() => { setSelected(request); setReviewNotes(request.reviewNotes ?? ""); }} className="shrink-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      Ver detalle y revisar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="request-detail-title" className="my-auto max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{selected.code}</p>
                  <h2 id="request-detail-title" className="mt-1 text-xl font-bold">{selected.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{statusLabels[selected.status]}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar detalle">✕</button>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-semibold">Justificación</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selected.justification}</p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-slate-500">Solicitó:</span> {selected.requestedBy}</p>
                  <p><span className="text-slate-500">Prioridad:</span> {priorityLabels[selected.priority]}</p>
                  <p><span className="text-slate-500">Fecha:</span> {new Date(selected.createdAt).toLocaleDateString("es-CO")}</p>
                  <p><span className="text-slate-500">Fecha requerida:</span> {selected.requiredDate || "Sin definir"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Artículos</h3>
                {selected.items.map((item) => (
                  <div key={item.id} className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:flex-row">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.quantity} × {money(item.estimatedUnitCost)}</p>
                      {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
                    </div>
                    <p className="font-semibold">{money(item.quantity * item.estimatedUnitCost)}</p>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                  <span className="font-semibold">Total estimado</span>
                  <span className="text-lg font-bold">{money(selected.estimatedTotal)}</span>
                </div>
              </div>

              {selected.reviewedBy && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm font-semibold">Última revisión · {selected.reviewedBy}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{selected.reviewNotes || "Sin observaciones."}</p>
                </div>
              )}

              {selected.status === "approved" && !selected.purchaseId && (
                <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div>
                    <h3 className="font-semibold">Generar compra</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Selecciona el proveedor. La compra quedará pendiente y no aumentará el inventario hasta recibirla.
                    </p>
                  </div>
                  <Field label="Proveedor">
                    <select
                      value={selectedSupplierId}
                      onChange={(event) => setSelectedSupplierId(event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {suppliers.length === 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Primero registra y activa un proveedor en el módulo Proveedores.
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={converting || suppliers.length === 0 || !selectedSupplierId}
                    onClick={handleConvertApprovedRequest}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {converting ? "Generando compra..." : "Convertir solicitud en compra"}
                  </button>
                </div>
              )}

              {selected.status === "converted" && selected.purchaseId && (
                <div role="status" className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">✓</span>
                    <div>
                      <h3 className="font-bold">¡Compra creada correctamente!</h3>
                      <p className="mt-1">La solicitud {selected.code} ya está vinculada a una compra pendiente.</p>
                      <p className="mt-1">El inventario no cambiará hasta registrar la recepción de la mercancía.</p>
                    </div>
                  </div>
                  <a href="/finanzas/cuentas-por-pagar" className="inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800">
                    Ir a Cuentas por pagar
                  </a>
                </div>
              )}

              {(selected.status === "submitted" || selected.status === "changes_requested") && (
                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <Field label="Observaciones de la revisión">
                    <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={3} placeholder="Motivo de rechazo, ajustes solicitados o instrucciones..." className={inputClass} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleReview("approved")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Aprobar</button>
                    <button type="button" onClick={() => handleReview("changes_requested")} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Solicitar cambios</button>
                    <button type="button" onClick={() => handleReview("rejected")} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Rechazar</button>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Cerrar detalle</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
