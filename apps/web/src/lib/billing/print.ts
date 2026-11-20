import type { BillingDocument, BillingDocumentType } from "./types";

const TYPE_LABELS: Record<BillingDocumentType, string> = {
  invoice: "Factura de venta",
  received_invoice: "Factura recibida",
  credit_note: "Nota crédito",
  debit_note: "Nota débito",
  receipt: "Recibo de caja",
  other: "Documento",
};

export function documentTypeLabel(type: BillingDocumentType): string {
  return TYPE_LABELS[type] ?? "Documento";
}

export function documentNumber(doc: BillingDocument): string {
  return doc.number ? `${doc.series}-${doc.number}` : "Borrador";
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: currency === "COP" ? 0 : 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency || "COP"} ${value}`;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value?: string): string {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) return value ?? "";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Recibo para impresora térmica de 80 mm. */
export function buildTicketHtml(doc: BillingDocument): string {
  const isReceived = doc.type === "received_invoice";
  const business = isReceived ? doc.customerSnapshot : doc.issuerSnapshot;
  const other = isReceived ? doc.supplierSnapshot ?? doc.issuerSnapshot : doc.customerSnapshot;
  const money = (value: number) => formatMoney(value, doc.currency);

  const lines = doc.items
    .map(
      (item) => `
        <div class="item">
          <div>${escapeHtml(item.description)}</div>
          <div class="row">
            <span>${escapeHtml(item.quantity)} x ${escapeHtml(money(item.unitPrice))}</span>
            <span>${escapeHtml(money(item.total))}</span>
          </div>
        </div>`,
    )
    .join("");

  const nit = business?.documentNumber
    ? `<div>${escapeHtml(business.documentType ?? "NIT")}: ${escapeHtml(business.documentNumber)}</div>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(documentTypeLabel(doc.type))} ${escapeHtml(documentNumber(doc))}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; color: #000; font: 12px/1.35 "Courier New", monospace; }
  .center { text-align: center; }
  .name { font-size: 15px; font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 7px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .item { margin-bottom: 5px; }
  .total { font-size: 15px; font-weight: bold; margin-top: 4px; }
  .small { font-size: 10px; }
</style>
</head>
<body>
  <div class="center">
    <div class="name">${escapeHtml(business?.name ?? "")}</div>
    ${nit}
    ${business?.address ? `<div>${escapeHtml(business.address)}</div>` : ""}
    ${business?.phone ? `<div>Tel. ${escapeHtml(business.phone)}</div>` : ""}
  </div>
  <div class="sep"></div>
  <div class="center"><strong>${escapeHtml(documentTypeLabel(doc.type).toUpperCase())}</strong></div>
  <div class="center">No. ${escapeHtml(documentNumber(doc))}</div>
  <div class="center">${escapeHtml(formatDate(doc.issueDate ?? doc.createdAt))}</div>
  ${other?.name ? `<div class="sep"></div><div>${isReceived ? "Proveedor" : "Cliente"}: ${escapeHtml(other.name)}</div>${other.documentNumber ? `<div>${escapeHtml(other.documentType ?? "Doc.")}: ${escapeHtml(other.documentNumber)}</div>` : ""}` : ""}
  <div class="sep"></div>
  ${lines}
  <div class="sep"></div>
  <div class="row"><span>Subtotal</span><span>${escapeHtml(money(doc.subtotal))}</span></div>
  ${doc.discount > 0 ? `<div class="row"><span>Descuento</span><span>-${escapeHtml(money(doc.discount))}</span></div>` : ""}
  ${doc.tax > 0 ? `<div class="row"><span>Impuestos</span><span>${escapeHtml(money(doc.tax))}</span></div>` : ""}
  <div class="row total"><span>TOTAL</span><span>${escapeHtml(money(doc.total))}</span></div>
  ${doc.notes ? `<div class="sep"></div><div class="small">${escapeHtml(doc.notes)}</div>` : ""}
  <div class="sep"></div>
  <div class="center">¡Gracias por su compra!</div>
  ${doc.status === "draft" ? '<div class="center small">BORRADOR - sin valor como soporte</div>' : ""}
  <div class="center small">Documento interno generado en STIAN.<br>No es factura electrónica DIAN.</div>
</body>
</html>`;
}

/**
 * Imprime un HTML sin abrir ventanas nuevas: usa un marco invisible y abre
 * directamente el cuadro de impresión del navegador.
 */
export function printHtml(html: string): void {
  const frame = document.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;";

  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;

  if (!frameWindow) {
    frame.remove();
    return;
  }

  frameWindow.document.open();
  frameWindow.document.write(html);
  frameWindow.document.close();

  const cleanup = () => window.setTimeout(() => frame.remove(), 500);

  frameWindow.addEventListener("afterprint", cleanup);

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => frame.remove(), 120000);
  }, 250);
}

export function printTicket(doc: BillingDocument): void {
  printHtml(buildTicketHtml(doc));
}

/** Texto plano con el resumen del documento (correo, WhatsApp, portapapeles). */
export function buildSummaryText(doc: BillingDocument, message: string): string {
  const money = (value: number) => formatMoney(value, doc.currency);
  const isReceived = doc.type === "received_invoice";
  const business = isReceived ? doc.customerSnapshot : doc.issuerSnapshot;
  const other = isReceived ? doc.supplierSnapshot ?? doc.issuerSnapshot : doc.customerSnapshot;

  const lines = doc.items.map(
    (item) => `- ${item.description}: ${item.quantity} x ${money(item.unitPrice)} = ${money(item.total)}`,
  );

  return [
    message.trim(),
    "",
    `${documentTypeLabel(doc.type)} ${documentNumber(doc)}`,
    business?.name ? `De: ${business.name}` : "",
    other?.name ? `Para: ${other.name}` : "",
    "",
    ...lines,
    "",
    `Total: ${money(doc.total)}`,
  ]
    .filter((line, index, all) => !(line === "" && all[index - 1] === ""))
    .join("\n");
}
