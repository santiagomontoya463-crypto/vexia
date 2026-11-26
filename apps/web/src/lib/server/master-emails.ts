function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(body: string): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
    <p style="margin:0 0 18px;font-size:20px;font-weight:bold">STIAN</p>
    ${body}
    <p style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      Mensaje enviado desde STIAN.
    </p>
  </div>
</body></html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${esc(url)}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

export function reminderEmail(input: {
  businessName: string;
  situation: string;
  amountText?: string;
  instructions: string;
  support: string;
  payUrl: string;
}) {
  const html = layout(
    `<p>Hola, equipo de <strong>${esc(input.businessName)}</strong>.</p>
     <p>${esc(input.situation)}</p>
     ${input.amountText ? `<p>Valor de tu plan: <strong>${esc(input.amountText)}</strong></p>` : ""}
     ${input.instructions ? `<p style="white-space:pre-line;background:#f9fafb;padding:12px 14px;border-radius:8px"><strong>Cómo pagar</strong>\n${esc(input.instructions)}</p>` : ""}
     ${button(input.payUrl, "Ver mi suscripción y avisar mi pago")}
     ${input.support ? `<p style="color:#6b7280;font-size:13px">¿Dudas? Escríbenos: ${esc(input.support)}</p>` : ""}`,
  );

  const text = `Hola, equipo de ${input.businessName}.

${input.situation}
${input.amountText ? `\nValor de tu plan: ${input.amountText}\n` : ""}
${input.instructions ? `Cómo pagar:\n${input.instructions}\n` : ""}
Ver mi suscripción y avisar mi pago: ${input.payUrl}
${input.support ? `\n¿Dudas? Escríbenos: ${input.support}` : ""}`;

  return { subject: `Recordatorio de pago · ${input.businessName}`, html, text };
}

export function receiptEmail(input: {
  businessName: string;
  receiptNumber: string;
  planName: string;
  amountText: string;
  months: number;
  until: string;
  method: string;
  reference?: string | null;
  date: string;
  payUrl: string;
}) {
  const html = layout(
    `<p>Hola, equipo de <strong>${esc(input.businessName)}</strong>.</p>
     <p>Recibimos tu pago. ¡Gracias! Tu suscripción está activa.</p>
     <table style="margin:16px 0;font-size:15px">
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Comprobante</td><td><strong>No. ${esc(input.receiptNumber)}</strong></td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Fecha</td><td>${esc(input.date)}</td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Plan</td><td>${esc(input.planName)}</td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Periodo</td><td>${esc(input.months)} ${input.months === 1 ? "mes" : "meses"}</td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Valor</td><td><strong>${esc(input.amountText)}</strong></td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Forma de pago</td><td>${esc(input.method)}${input.reference ? ` · ${esc(input.reference)}` : ""}</td></tr>
       <tr><td style="padding:4px 14px 4px 0;color:#6b7280">Activa hasta</td><td><strong>${esc(input.until)}</strong></td></tr>
     </table>
     ${button(input.payUrl, "Ver mi suscripción")}`,
  );

  const text = `Hola, equipo de ${input.businessName}.

Recibimos tu pago. Tu suscripción está activa.

Comprobante No. ${input.receiptNumber}
Fecha: ${input.date}
Plan: ${input.planName}
Periodo: ${input.months} ${input.months === 1 ? "mes" : "meses"}
Valor: ${input.amountText}
Forma de pago: ${input.method}${input.reference ? ` · ${input.reference}` : ""}
Activa hasta: ${input.until}

Ver mi suscripción: ${input.payUrl}`;

  return { subject: `Comprobante de pago No. ${input.receiptNumber} · ${input.businessName}`, html, text };
}
