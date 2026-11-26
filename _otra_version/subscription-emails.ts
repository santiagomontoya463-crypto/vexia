function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function layout(body: string): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
    <p style="margin:0 0 18px;font-size:20px;font-weight:bold">STIAN</p>
    ${body}
    <p style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      Mensaje automático de STIAN.
    </p>
  </div>
</body></html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${esc(url)}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

/** Aviso al administrador de la plataforma: una empresa reportó un pago. */
export function newRequestEmail(input: {
  businessName: string;
  planName: string;
  months: number;
  amount: number;
  currency: string;
  reference: string;
  panelUrl: string;
}) {
  const total = money(input.amount, input.currency);
  const monthsText = `${input.months} ${input.months === 1 ? "mes" : "meses"}`;

  const html = layout(
    `<p><strong>${esc(input.businessName)}</strong> reportó un pago de suscripción.</p>
     <table style="margin:16px 0;font-size:15px">
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Plan</td><td><strong>${esc(input.planName)} · ${esc(monthsText)}</strong></td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Valor</td><td><strong>${esc(total)}</strong></td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Referencia</td><td><strong>${esc(input.reference)}</strong></td></tr>
     </table>
     <p>Verifica la transferencia en tu cuenta y apruébala desde el panel Master.</p>
     ${button(input.panelUrl, "Revisar solicitud")}`,
  );

  const text = `${input.businessName} reportó un pago de suscripción.\nPlan: ${input.planName} · ${monthsText}\nValor: ${total}\nReferencia: ${input.reference}\n\nRevísalo en: ${input.panelUrl}`;

  return {
    subject: `Pago reportado por ${input.businessName}`,
    html,
    text,
  };
}

/** Respuesta a la empresa cuando el Master aprueba o rechaza su pago. */
export function reviewEmail(input: {
  businessName: string;
  approved: boolean;
  reason: string | null;
  planName: string;
  months: number;
  appUrl: string;
}) {
  const monthsText = `${input.months} ${input.months === 1 ? "mes" : "meses"}`;

  if (input.approved) {
    const html = layout(
      `<p>¡Gracias! Confirmamos tu pago y <strong>${esc(input.businessName)}</strong> ya tiene su suscripción activa.</p>
       <p style="margin:12px 0;font-size:15px">Plan <strong>${esc(input.planName)}</strong> · ${esc(monthsText)}.</p>
       ${button(input.appUrl, "Entrar a STIAN")}`,
    );

    return {
      subject: `Tu suscripción de ${input.businessName} está activa`,
      html,
      text: `Confirmamos tu pago. ${input.businessName} ya tiene su suscripción activa (plan ${input.planName}, ${monthsText}).\n\nEntra en: ${input.appUrl}`,
    };
  }

  const reason = input.reason || "No pudimos confirmar la transferencia.";
  const html = layout(
    `<p>No pudimos confirmar el pago que reportaste para <strong>${esc(input.businessName)}</strong>.</p>
     <p style="margin:12px 0;padding:12px;background:#fef2f2;border-radius:8px;font-size:15px">${esc(reason)}</p>
     <p>Revisa los datos y vuelve a reportarlo desde la pantalla de suscripción.</p>
     ${button(input.appUrl, "Ir a Suscripción")}`,
  );

  return {
    subject: `No pudimos confirmar tu pago de ${input.businessName}`,
    html,
    text: `No pudimos confirmar el pago que reportaste para ${input.businessName}.\nMotivo: ${reason}\n\nVuelve a reportarlo en: ${input.appUrl}`,
  };
}
