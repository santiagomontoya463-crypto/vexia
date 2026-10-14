"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createBillingDraft,
  getBillingDocuments,
} from "../../lib/billing";
import type {
  BillingDocument,
  BillingDocumentType,
  BillingPartySnapshot,
} from "../../lib/billing";

const DOCUMENT_TYPES: {
  value: BillingDocumentType | "all";
  label: string;
}[] = [
  { value: "all", label: "Todos los documentos" },
  { value: "invoice", label: "Facturas de venta" },
  { value: "received_invoice", label: "Facturas recibidas" },
  { value: "credit_note", label: "Notas crédito" },
  { value: "debit_note", label: "Notas débito" },
  { value: "receipt", label: "Recibos" },
  { value: "other", label: "Otros documentos" },
];

type FilterStatus =
  | "all"
  | BillingDocument["status"];

type DocumentView = "detail" | "preview";

const panelClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "grid gap-1.5 text-sm font-medium text-gray-700";

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency || "COP"} ${value}`;
  }
}

function typeLabel(type: BillingDocumentType) {
  return (
    DOCUMENT_TYPES.find((item) => item.value === type)?.label ??
    "Documento"
  );
}

function statusLabel(status: BillingDocument["status"]) {
  const labels: Record<BillingDocument["status"], string> = {
    draft: "Borrador",
    issued: "Emitido",
    cancelled: "Cancelado",
    void: "Anulado",
  };

  return labels[status];
}

function electronicStatusLabel(
  status: BillingDocument["electronicStatus"],
) {
  const labels: Record<BillingDocument["electronicStatus"], string> = {
    not_configured: "No configurado",
    not_required: "No requerido",
    pending: "Pendiente",
    processing: "En proceso",
    accepted: "Aceptado por el proveedor",
    rejected: "Rechazado",
    error: "Error",
  };

  return labels[status];
}

function formatDate(value?: string) {
  if (!value) return "Sin emitir";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function partyDocument(party?: BillingPartySnapshot) {
  if (!party) return "No registrado";

  const parts = [
    party.documentType,
    party.documentNumber,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "No registrado";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-gray-900">
        {value === undefined || value === null || value === ""
          ? "—"
          : value}
      </dd>
    </div>
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function FacturacionPage() {
  const [businessId, setBusinessId] = useState("");
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [filterType, setFilterType] =
    useState<BillingDocumentType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documentView, setDocumentView] =
    useState<DocumentView>("detail");

  useEffect(() => {
    const savedBusiness =
      window.localStorage.getItem("vexia:active-business");

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
      setError("No fue posible cargar los documentos del negocio.");
    }
  }, [businessId]);

  useEffect(() => {
    if (!selectedDocumentId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedDocumentId("");
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocumentId]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documents.filter((doc) => {
      const matchesType =
        filterType === "all" || doc.type === filterType;

      const matchesStatus =
        filterStatus === "all" || doc.status === filterStatus;

      const searchable = [
        doc.number,
        doc.series,
        doc.customerSnapshot?.name,
        doc.issuerSnapshot?.name,
        doc.notes,
        doc.sourceSaleId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesType &&
        matchesStatus &&
        (!term || searchable.includes(term))
      );
    });
  }, [documents, filterType, filterStatus, search]);

  const selectedDocument = useMemo(
    () =>
      documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const totalIssued = documents
    .filter(
      (doc) => doc.status === "issued" && doc.type === "invoice",
    )
    .reduce((sum, doc) => sum + doc.total, 0);

  const totalDrafts = documents.filter(
    (doc) => doc.status === "draft",
  ).length;

  const estimatedTotal =
    Math.round(
      Math.max(0, Number(quantity) || 0) *
        Math.max(0, Number(unitPrice) || 0) *
        100,
    ) / 100;

  function refreshDocuments() {
    if (!businessId.trim()) return;

    setDocuments(getBillingDocuments(businessId));
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const price = Number(unitPrice);
    const qty = Number(quantity);

    if (!businessId.trim()) {
      setError("Configura primero el negocio activo en VEXIA.");
      return;
    }

    if (
      !description.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      setError("Revisa la descripción, la cantidad y el precio.");
      return;
    }

    const subtotal = Math.round(qty * price * 100) / 100;

    try {
      createBillingDraft({
        businessId,
        type: "invoice",
        customerSnapshot: {
          name: customerName.trim() || "Cliente sin identificar",
        },
        items: [
          {
            id: `item-${Date.now()}`,
            type: "other",
            description: description.trim(),
            quantity: qty,
            unitPrice: price,
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: subtotal,
          },
        ],
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
      setMessage(
        "Borrador creado correctamente. Aún no es una factura emitida.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible crear el borrador.",
      );
    }
  }

  function openDocument(id: string, view: DocumentView) {
    setSelectedDocumentId(id);
    setDocumentView(view);
  }

  function printDocument(doc: BillingDocument) {
    const printWindow = window.open("", "_blank", "width=900,height=750");

    if (!printWindow) {
      setError(
        "El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e inténtalo de nuevo.",
      );
      return;
    }

    const rows = doc.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td class="num">${escapeHtml(item.quantity)}</td>
            <td class="num">${escapeHtml(money(item.unitPrice, doc.currency))}</td>
            <td class="num">${escapeHtml(money(item.discount, doc.currency))}</td>
            <td class="num">${escapeHtml(money(item.taxAmount, doc.currency))}</td>
            <td class="num">${escapeHtml(money(item.total, doc.currency))}</td>
          </tr>
        `,
      )
      .join("");

    const number = doc.number
      ? `${doc.series}-${doc.number}`
      : "Borrador sin consecutivo";

    const issuer = doc.issuerSnapshot;
    const customer = doc.customerSnapshot;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(typeLabel(doc.type))} ${escapeHtml(number)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            color: #111827;
            font: 14px/1.5 Arial, Helvetica, sans-serif;
          }
          .top {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #111827;
            padding-bottom: 22px;
          }
          h1 { font-size: 24px; margin: 6px 0; }
          h2 { font-size: 17px; margin: 0 0 10px; }
          h3 { font-size: 12px; text-transform: uppercase; color: #6b7280; }
          p { margin: 4px 0; }
          .brand { color: #4f46e5; font-weight: bold; letter-spacing: 3px; }
          .muted { color: #6b7280; }
          .right { text-align: right; }
          .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 0; border-bottom: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { padding: 10px 6px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
          th { border-bottom: 2px solid #111827; }
          .num { text-align: right; white-space: nowrap; }
          .totals { width: 340px; max-width: 100%; margin: 24px 0 0 auto; }
          .totalrow { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; }
          .grand { border-top: 2px solid #111827; font-size: 18px; font-weight: bold; margin-top: 5px; padding-top: 12px; }
          .notice { margin-top: 28px; border: 1px solid #f59e0b; background: #fffbeb; color: #92400e; padding: 14px; }
          .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            @page { size: A4; margin: 15mm; }
          }
          @media screen and (max-width: 650px) {
            body { padding: 16px; }
            .top { flex-direction: column; }
            .right { text-align: left; }
            .columns { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="top">
          <div>
            <div class="brand">VEXIA</div>
            <h1>${escapeHtml(issuer?.name || "Emisor sin identificar")}</h1>
            <p>${escapeHtml(partyDocument(issuer))}</p>
            <p>${escapeHtml(issuer?.address || "")}</p>
            <p>${escapeHtml(issuer?.phone || "")}</p>
            <p>${escapeHtml(issuer?.email || "")}</p>
          </div>
          <div class="right">
            <h2>${escapeHtml(typeLabel(doc.type))}</h2>
            <p><strong>Estado:</strong> ${escapeHtml(statusLabel(doc.status))}</p>
            <p><strong>Número:</strong> ${escapeHtml(number)}</p>
            <p><strong>Fecha:</strong> ${escapeHtml(formatDate(doc.issueDate))}</p>
            <p><strong>Vencimiento:</strong> ${escapeHtml(formatDate(doc.dueDate))}</p>
          </div>
        </div>

        <div class="columns">
          <div>
            <h3>Cliente</h3>
            <p><strong>${escapeHtml(customer?.name || "Cliente sin identificar")}</strong></p>
            <p>${escapeHtml(partyDocument(customer))}</p>
            <p>${escapeHtml(customer?.address || "")}</p>
            <p>${escapeHtml(customer?.email || "")}</p>
            <p>${escapeHtml(customer?.phone || "")}</p>
          </div>
          <div>
            <h3>Información del documento</h3>
            <p><strong>Moneda:</strong> ${escapeHtml(doc.currency)}</p>
            <p><strong>Creado:</strong> ${escapeHtml(formatDateTime(doc.createdAt))}</p>
            <p><strong>Venta asociada:</strong> ${escapeHtml(doc.sourceSaleId || "—")}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="num">Cant.</th>
              <th class="num">Precio unitario</th>
              <th class="num">Descuento</th>
              <th class="num">Impuesto</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals">
          <div class="totalrow"><span>Subtotal</span><strong>${escapeHtml(money(doc.subtotal, doc.currency))}</strong></div>
          <div class="totalrow"><span>Descuento</span><strong>${escapeHtml(money(doc.discount, doc.currency))}</strong></div>
          <div class="totalrow"><span>Impuestos</span><strong>${escapeHtml(money(doc.tax, doc.currency))}</strong></div>
          <div class="totalrow grand"><span>Total</span><span>${escapeHtml(money(doc.total, doc.currency))}</span></div>
        </div>

        ${doc.notes ? `<div style="margin-top:24px"><h3>Observaciones</h3><p>${escapeHtml(doc.notes)}</p></div>` : ""}

        <div class="notice">
          <strong>${escapeHtml(doc.status === "draft" ? "BORRADOR — NO EMITIDO" : statusLabel(doc.status).toUpperCase())}</strong>
          <p>Estado electrónico: ${escapeHtml(electronicStatusLabel(doc.electronicStatus))}.</p>
          <p>Este documento se genera en VEXIA. Su impresión no demuestra validación de factura electrónica ante la DIAN.</p>
        </div>

        <div class="footer">Generado desde VEXIA · Gestiona. Conecta. Crece.</div>
        <div class="no-print" style="margin-top:24px;text-align:center">
          <button onclick="window.print()" style="padding:12px 18px;background:#4f46e5;color:white;border:0;border-radius:8px;font-weight:bold;cursor:pointer">Imprimir / Guardar PDF</button>
        </div>
        <script>
          window.addEventListener("load", function () {
            setTimeout(function () { window.focus(); window.print(); }, 250);
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setError("");
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            VEXIA · Gestión empresarial
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Facturación
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Administra tus documentos y consulta su información desde un solo lugar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            clearMessages();
            setShowForm((current) => !current);
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          {showForm ? "Cerrar formulario" : "+ Nueva factura"}
        </button>
      </header>

      {!businessId && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          No se encontró un negocio activo. Selecciona un negocio en VEXIA
          para consultar y guardar su facturación. No se mostrarán documentos
          de otros negocios.
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
        <article className={panelClass}>
          <p className="text-sm text-gray-500">
            Facturas emitidas · total acumulado
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {money(totalIssued, "COP")}
          </p>
        </article>

        <article className={panelClass}>
          <p className="text-sm text-gray-500">Documentos registrados</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {documents.length}
          </p>
        </article>

        <article className={panelClass}>
          <p className="text-sm text-gray-500">Borradores pendientes</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalDrafts}
          </p>
        </article>
      </section>

      {showForm && (
        <section className={panelClass}>
          <h2 className="text-lg font-bold text-gray-900">
            Crear borrador de factura
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            El documento se guardará como borrador. No se emitirá ni generará
            movimientos financieros.
          </p>

          <form onSubmit={createDraft} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Cliente
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nombre del cliente"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Concepto
              <input
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Producto o servicio"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Cantidad
              <input
                required
                min="0.01"
                step="any"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Precio unitario (COP)
              <input
                required
                min="0"
                step="any"
                type="number"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </label>

            <div className="rounded-xl bg-gray-50 p-4 md:col-span-2">
              <span className="text-sm text-gray-500">Total estimado</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {money(estimatedTotal, "COP")}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Esta versión inicial no calcula impuestos ni descuentos.
                La creación de un borrador no equivale a emitir una factura.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={!businessId}
                className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar borrador
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  clearMessages();
                }}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={panelClass}>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Documentos registrados
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Consulta los documentos del negocio activo. Abre el detalle,
            revisa su presentación o imprime una copia.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, cliente, nota o venta..."
            className={`${inputClass} min-w-0 flex-1`}
          />

          <select
            value={filterType}
            onChange={(event) =>
              setFilterType(event.target.value as BillingDocumentType | "all")
            }
            className={inputClass}
            aria-label="Filtrar por tipo de documento"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as FilterStatus)
            }
            className={inputClass}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="issued">Emitido</option>
            <option value="cancelled">Cancelado</option>
            <option value="void">Anulado</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-3 py-3 font-medium">Documento</th>
                <th className="px-3 py-3 font-medium">Cliente</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-gray-900">
                      {typeLabel(doc.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.number
                        ? `${doc.series}-${doc.number}`
                        : "Sin consecutivo"}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-gray-700">
                    {doc.customerSnapshot?.name ?? "—"}
                  </td>

                  <td className="px-3 py-4 text-gray-700">
                    {formatDate(doc.issueDate)}
                  </td>

                  <td className="px-3 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {statusLabel(doc.status)}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-right font-semibold text-gray-900">
                    {money(doc.total, doc.currency)}
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openDocument(doc.id, "detail")}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Ver detalle
                      </button>

                      <button
                        type="button"
                        onClick={() => openDocument(doc.id, "preview")}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Vista previa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-gray-500">
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

      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="billing-document-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDocumentId("");
            }
          }}
        >
          <div className="mx-auto my-4 max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-gray-200 bg-white p-4">
              <div>
                <h2
                  id="billing-document-title"
                  className="text-lg font-bold text-gray-900"
                >
                  {documentView === "preview"
                    ? "Vista previa del documento"
                    : "Detalle del documento"}
                </h2>
                <p className="text-sm text-gray-500">
                  {typeLabel(selectedDocument.type)} ·{" "}
                  {statusLabel(selectedDocument.status)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDocumentView((current) =>
                      current === "detail" ? "preview" : "detail",
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {documentView === "preview" ? "Ver detalle" : "Vista previa"}
                </button>

                <button
                  type="button"
                  onClick={() => printDocument(selectedDocument)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Imprimir / Guardar PDF
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDocumentId("")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {documentView === "preview" ? (
                <article className="mx-auto max-w-3xl text-gray-900">
                  <div className="flex flex-col justify-between gap-5 border-b-2 border-gray-900 pb-6 sm:flex-row">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                        VEXIA
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">
                        {selectedDocument.issuerSnapshot?.name ||
                          "Emisor sin identificar"}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {partyDocument(selectedDocument.issuerSnapshot)}
                      </p>
                      {selectedDocument.issuerSnapshot?.address && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedDocument.issuerSnapshot.address}
                        </p>
                      )}
                      {selectedDocument.issuerSnapshot?.phone && (
                        <p className="mt-1 text-sm text-gray-600">
                          Tel. {selectedDocument.issuerSnapshot.phone}
                        </p>
                      )}
                      {selectedDocument.issuerSnapshot?.email && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedDocument.issuerSnapshot.email}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <h4 className="text-xl font-bold">
                        {typeLabel(selectedDocument.type)}
                      </h4>
                      <p className="mt-2 text-sm">
                        <strong>Estado:</strong>{" "}
                        {statusLabel(selectedDocument.status)}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>Número:</strong>{" "}
                        {selectedDocument.number
                          ? `${selectedDocument.series}-${selectedDocument.number}`
                          : "Borrador sin consecutivo"}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>Fecha:</strong>{" "}
                        {formatDate(selectedDocument.issueDate)}
                      </p>
                      {selectedDocument.dueDate && (
                        <p className="mt-1 text-sm">
                          <strong>Vencimiento:</strong>{" "}
                          {formatDate(selectedDocument.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <section className="grid gap-5 border-b border-gray-200 py-6 sm:grid-cols-2">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Facturar a
                      </h5>
                      <p className="mt-2 font-semibold">
                        {selectedDocument.customerSnapshot?.name ||
                          "Cliente sin identificar"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {partyDocument(selectedDocument.customerSnapshot)}
                      </p>
                      {selectedDocument.customerSnapshot?.address && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedDocument.customerSnapshot.address}
                        </p>
                      )}
                      {selectedDocument.customerSnapshot?.email && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedDocument.customerSnapshot.email}
                        </p>
                      )}
                      {selectedDocument.customerSnapshot?.phone && (
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedDocument.customerSnapshot.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Información del documento
                      </h5>
                      <p className="mt-2 text-sm">
                        <strong>Moneda:</strong> {selectedDocument.currency}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>Creado:</strong>{" "}
                        {formatDateTime(selectedDocument.createdAt)}
                      </p>
                      {selectedDocument.sourceSaleId && (
                        <p className="mt-1 break-all text-sm">
                          <strong>Venta asociada:</strong>{" "}
                          {selectedDocument.sourceSaleId}
                        </p>
                      )}
                    </div>
                  </section>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-800">
                          <th className="py-3 pr-3">Concepto</th>
                          <th className="px-2 py-3 text-right">Cant.</th>
                          <th className="px-2 py-3 text-right">Valor unitario</th>
                          <th className="px-2 py-3 text-right">Descuento</th>
                          <th className="py-3 pl-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDocument.items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-200">
                            <td className="py-3 pr-3">
                              <p className="font-medium">{item.description}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {item.type === "product"
                                  ? "Producto"
                                  : item.type === "service"
                                    ? "Servicio"
                                    : "Otro"}
                              </p>
                            </td>
                            <td className="px-2 py-3 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-2 py-3 text-right">
                              {money(item.unitPrice, selectedDocument.currency)}
                            </td>
                            <td className="px-2 py-3 text-right">
                              {money(item.discount, selectedDocument.currency)}
                            </td>
                            <td className="py-3 pl-2 text-right font-semibold">
                              {money(item.total, selectedDocument.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <section className="ml-auto mt-6 max-w-sm space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {money(selectedDocument.subtotal, selectedDocument.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-gray-600">Descuentos</span>
                      <span className="font-medium">
                        {money(selectedDocument.discount, selectedDocument.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-gray-600">Impuestos</span>
                      <span className="font-medium">
                        {money(selectedDocument.tax, selectedDocument.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t-2 border-gray-900 pt-3 text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {money(selectedDocument.total, selectedDocument.currency)}
                      </span>
                    </div>
                  </section>

                  {selectedDocument.notes && (
                    <section className="mt-8 border-t border-gray-200 pt-5">
                      <h5 className="text-sm font-bold">Observaciones</h5>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {selectedDocument.notes}
                      </p>
                    </section>
                  )}

                  <section className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-bold">
                      {selectedDocument.status === "draft"
                        ? "BORRADOR — NO EMITIDO"
                        : `DOCUMENTO ${statusLabel(selectedDocument.status).toUpperCase()}`}
                    </p>
                    <p className="mt-2 leading-6">
                      Estado electrónico:{" "}
                      {electronicStatusLabel(selectedDocument.electronicStatus)}.
                      Esta vista previa se genera en VEXIA y no acredita por sí
                      sola validación de factura electrónica ante la DIAN.
                    </p>
                  </section>

                  <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
                    Generado desde VEXIA · Gestiona. Conecta. Crece.
                  </footer>
                </article>
              ) : (
                <div className="space-y-7">
                  <section>
                    <h3 className="text-base font-bold text-gray-900">
                      Estado y datos generales
                    </h3>
                    <dl className="mt-3">
                      <DetailRow label="Tipo" value={typeLabel(selectedDocument.type)} />
                      <DetailRow label="Estado" value={statusLabel(selectedDocument.status)} />
                      <DetailRow
                        label="Número"
                        value={
                          selectedDocument.number
                            ? `${selectedDocument.series}-${selectedDocument.number}`
                            : "Sin consecutivo"
                        }
                      />
                      <DetailRow
                        label="Fecha de emisión"
                        value={formatDate(selectedDocument.issueDate)}
                      />
                      <DetailRow
                        label="Fecha de vencimiento"
                        value={formatDate(selectedDocument.dueDate)}
                      />
                      <DetailRow
                        label="Estado electrónico"
                        value={electronicStatusLabel(selectedDocument.electronicStatus)}
                      />
                      <DetailRow
                        label="Creado"
                        value={formatDateTime(selectedDocument.createdAt)}
                      />
                      <DetailRow
                        label="Última actualización"
                        value={formatDateTime(selectedDocument.updatedAt)}
                      />
                      <DetailRow
                        label="Venta asociada"
                        value={selectedDocument.sourceSaleId}
                      />
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-base font-bold text-gray-900">
                      Datos del emisor
                    </h3>
                    <dl className="mt-3">
                      <DetailRow label="Nombre" value={selectedDocument.issuerSnapshot?.name} />
                      <DetailRow
                        label="Identificación"
                        value={partyDocument(selectedDocument.issuerSnapshot)}
                      />
                      <DetailRow label="Correo" value={selectedDocument.issuerSnapshot?.email} />
                      <DetailRow label="Teléfono" value={selectedDocument.issuerSnapshot?.phone} />
                      <DetailRow label="Dirección" value={selectedDocument.issuerSnapshot?.address} />
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-base font-bold text-gray-900">
                      Datos del cliente
                    </h3>
                    <dl className="mt-3">
                      <DetailRow label="Nombre" value={selectedDocument.customerSnapshot?.name} />
                      <DetailRow
                        label="Identificación"
                        value={partyDocument(selectedDocument.customerSnapshot)}
                      />
                      <DetailRow label="Correo" value={selectedDocument.customerSnapshot?.email} />
                      <DetailRow label="Teléfono" value={selectedDocument.customerSnapshot?.phone} />
                      <DetailRow label="Dirección" value={selectedDocument.customerSnapshot?.address} />
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-base font-bold text-gray-900">Conceptos</h3>
                    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3">Descripción</th>
                            <th className="px-3 py-3 text-right">Cantidad</th>
                            <th className="px-3 py-3 text-right">Precio</th>
                            <th className="px-3 py-3 text-right">Impuesto</th>
                            <th className="px-3 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDocument.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="px-3 py-3">{item.description}</td>
                              <td className="px-3 py-3 text-right">{item.quantity}</td>
                              <td className="px-3 py-3 text-right">
                                {money(item.unitPrice, selectedDocument.currency)}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {money(item.taxAmount, selectedDocument.currency)}
                              </td>
                              <td className="px-3 py-3 text-right font-semibold">
                                {money(item.total, selectedDocument.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-base font-bold text-gray-900">
                      Resumen de valores
                    </h3>
                    <dl className="mt-3">
                      <DetailRow
                        label="Subtotal"
                        value={money(selectedDocument.subtotal, selectedDocument.currency)}
                      />
                      <DetailRow
                        label="Descuento"
                        value={money(selectedDocument.discount, selectedDocument.currency)}
                      />
                      <DetailRow
                        label="Impuestos"
                        value={money(selectedDocument.tax, selectedDocument.currency)}
                      />
                      <DetailRow
                        label="Total"
                        value={money(selectedDocument.total, selectedDocument.currency)}
                      />
                    </dl>
                  </section>

                  {selectedDocument.notes && (
                    <section>
                      <h3 className="text-base font-bold text-gray-900">
                        Observaciones
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                        {selectedDocument.notes}
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}