import { formatMoney, printHtml } from "./print";

export type SubscriptionReceipt = {
  number: string | number | null;
  businessName: string;
  planName: string | null;
  amount: number;
  currency: string;
  months: number;
  periodEnd: string;
  method: string;
  reference: string | null;
  date: string;
};

const METHOD_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function longDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Imprime (o guarda en PDF) el comprobante de un pago de suscripción. */
export function printSubscriptionReceipt(receipt: SubscriptionReceipt): void {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b7280">${esc(label)}</td><td style="padding:6px 0"><strong>${esc(value)}</strong></td></tr>`;

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Comprobante de pago ${esc(receipt.number ?? "")}</title>
<style>
  @page { size: A5; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
  h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
  .muted { color: #6b7280; }
  .total { margin-top: 18px; padding: 14px; border: 2px solid #111827; border-radius: 10px; text-align: center; }
  .total strong { font-size: 24px; }
</style></head>
<body>
  <h1>STIAN</h1>
  <p class="muted" style="margin:2px 0 22px">Comprobante de pago de suscripción</p>
  <p style="font-size:18px;margin:0 0 4px"><strong>No. ${esc(receipt.number ?? "—")}</strong></p>
  <p class="muted" style="margin:0 0 18px">${esc(longDate(receipt.date))}</p>
  <table style="font-size:14px;border-collapse:collapse">
    ${row("Empresa", receipt.businessName)}
    ${row("Plan", receipt.planName ?? "Suscripción STIAN")}
    ${row("Periodo pagado", `${receipt.months} ${receipt.months === 1 ? "mes" : "meses"}`)}
    ${row("Activa hasta", longDate(receipt.periodEnd))}
    ${row("Forma de pago", METHOD_LABELS[receipt.method] ?? receipt.method)}
    ${receipt.reference ? row("Referencia", receipt.reference) : ""}
  </table>
  <div class="total"><span class="muted">Valor pagado</span><br><strong>${esc(formatMoney(receipt.amount, receipt.currency))}</strong></div>
  <p class="muted" style="margin-top:22px;font-size:12px;text-align:center">Gracias por confiar en STIAN.</p>
</body></html>`;

  printHtml(html);
}
