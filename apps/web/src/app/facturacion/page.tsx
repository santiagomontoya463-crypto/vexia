"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBillingDocuments,
  createBillingDraft,
} from "../../lib/billing";
import type {
  BillingDocument,
  BillingDocumentType,
} from "../../lib/billing";

const DOCUMENT_TYPES: { value: BillingDocumentType | "all"; label: string }[] = [
  { value: "all", label: "Todos los documentos" },
  { value: "invoice", label: "Facturas de venta" },
  { value: "received_invoice", label: "Facturas recibidas" },
  { value: "credit_note", label: "Notas crédito" },
  { value: "debit_note", label: "Notas débito" },
  { value: "receipt", label: "Recibos" },
  { value: "other", label: "Otros documentos" },
];

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 2,
  }).format(value);

const typeLabel = (type: BillingDocumentType) =>
  DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? "Documento";

export default function FacturacionPage() {
  const [businessId, setBusinessId] = useState("");
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [filterType, setFilterType] = useState<BillingDocumentType | "all">("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedBusiness = window.localStorage.getItem("vexia:active-business");
    if (savedBusiness) setBusinessId(savedBusiness);
  }, []);

  useEffect(() => {
    if (!businessId.trim()) {
      setDocuments([]);
      return;
    }

    try {
      setDocuments(getBillingDocuments(businessId));
    } catch {
      setDocuments([]);
    }
  }, [businessId]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = filterType === "all" || doc.type === filterType;
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        `${doc.number ?? ""} ${doc.series} ${doc.customerSnapshot?.name ?? ""} ${doc.notes ?? ""}`
          .toLowerCase()
          .includes(term);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [documents, filterType, filterStatus, search]);

  const totalIssued = documents
    .filter((doc) => doc.status === "issued" && doc.type === "invoice")
    .reduce((sum, doc) => sum + doc.total, 0);

  const totalDrafts = documents.filter((doc) => doc.status === "draft").length;

  function refreshDocuments() {
    if (!businessId.trim()) return;
    setDocuments(getBillingDocuments(businessId));
  }

  function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const price = Number(unitPrice);
    const qty = Number(quantity);

    if (!businessId.trim()) {
      setError("Configura primero el negocio activo en VEXIA.");
      return;
    }

    if (!description.trim() || !Number.isFinite(price) || price < 0 ||
        !Number.isFinite(qty) || qty <= 0) {
      setError("Revisa la descripción, la cantidad y el precio.");
      return;
    }

    const subtotal = Math.round(qty * price * 100) / 100;

    try {
      createBillingDraft({
        businessId,
        type: "invoice",
        customerSnapshot: { name: customerName.trim() || "Cliente sin identificar" },
        items: [{
          id: `item-${Date.now()}`,
          type: "other",
          description: description.trim(),
          quantity: qty,
          unitPrice: price,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: subtotal,
        }],
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        currency: "COP",
        createdBy: "usuario-actual",
        notes: "Borrador creado desde Facturación",
      });

      refreshDocuments();
      setShowForm(false);
      setDescription("");
      setQuantity("1");
      setUnitPrice("");
      setCustomerName("");
      setMessage("Borrador creado correctamente. Aún no es una factura emitida.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el borrador.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">VEXIA · Gestión empresarial</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="mt-2 text-sm text-gray-500">
            Administra tus documentos de venta y corrección desde un solo lugar.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          + Nueva factura
        </button>
      </header>

      {!businessId && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No se encontró un negocio activo. Esta pantalla necesita el identificador del
          negocio para mantener separada su facturación. No escribas un identificador
          inventado: debemos conectarlo al contexto real del negocio en VEXIA.
        </section>
      )}

      {message && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Facturas emitidas · total acumulado</p>
          <p className="mt-2 text-2xl font-bold">{money(totalIssued, "COP")}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Documentos registrados</p>
          <p className="mt-2 text-2xl font-bold">{documents.length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Borradores pendientes</p>
          <p className="mt-2 text-2xl font-bold">{totalDrafts}</p>
        </article>
      </section>

      {showForm && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Crear borrador de factura</h2>
          <p className="mt-1 text-sm text-gray-500">
            El documento quedará como borrador y no generará movimientos financieros.
          </p>

          <form onSubmit={createDraft} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Cliente
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                className="rounded-xl border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Concepto
              <input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Producto o servicio"
                className="rounded-xl border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Cantidad
              <input
                required
                min="0.01"
                step="any"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Precio unitario (COP)
              <input
                required
                min="0"
                step="any"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                className="rounded-xl border border-gray-300 px-3 py-2"
              />
            </label>
            <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
              <span className="text-sm text-gray-500">Total estimado</span>
              <p className="text-2xl font-bold">
                {money(Math.max(0, Number(quantity) || 0) * Math.max(0, Number(unitPrice) || 0), "COP")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Este formulario inicial no calcula impuestos ni descuentos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">
                Guardar borrador
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold">
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente o nota..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as BillingDocumentType | "all")}
            className="rounded-xl border border-gray-300 px-3 py-2">
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2">
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="issued">Emitido</option>
            <option value="cancelled">Cancelado</option>
            <option value="void">Anulado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Documento</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-semibold">{typeLabel(doc.type)}</p>
                    <p className="text-xs text-gray-500">
                      {doc.number ? `${doc.series}-${doc.number}` : "Sin consecutivo"}
                    </p>
                  </td>
                  <td className="px-3 py-4">{doc.customerSnapshot?.name ?? "—"}</td>
                  <td className="px-3 py-4">{doc.issueDate ?? "Sin emitir"}</td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                      {doc.status === "draft" ? "Borrador" :
                        doc.status === "issued" ? "Emitido" :
                        doc.status === "cancelled" ? "Cancelado" : "Anulado"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-right font-semibold">
                    {money(doc.total, doc.currency)}
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-gray-500">
                    {businessId
                      ? "No hay documentos que coincidan con los filtros."
                      : "Selecciona un negocio activo para consultar sus documentos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}