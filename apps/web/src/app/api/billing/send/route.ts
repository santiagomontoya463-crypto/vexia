import { createClient } from "@/lib/supabase/server";
import { mailerConfigured, sendMail } from "@/lib/server/mailer";
import {
  documentNumber,
  documentTypeLabel,
  formatMoney,
} from "@/lib/billing/print";
import type { BillingDocument } from "@/lib/billing";

/**
 * Envía un documento de facturación por correo, en nombre de la empresa.
 *
 * Requiere dos variables de entorno en el servidor (nunca con NEXT_PUBLIC_):
 *   RESEND_API_KEY  clave de la cuenta de Resend
 *   EMAIL_FROM      dirección remitente verificada, por ejemplo facturas@tudominio.com
 *
 * El nombre visible del remitente y la dirección de respuesta salen de la
 * empresa que envía, así cada negocio aparece con su propia identidad.
 */

type Party = {
  name?: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Item = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  taxAmount?: number;
  total?: number;
};

type Payload = {
  businessId?: string;
  to?: string[];
  message?: string;
  document?: {
    id?: string;
    type?: BillingDocument["type"];
    status?: string;
    series?: string;
    number?: string;
    issueDate?: string;
    dueDate?: string;
    currency?: string;
    issuer?: Party;
    customer?: Party;
    supplier?: Party;
    items?: Item[];
    subtotal?: number;
    discount?: number;
    tax?: number;
    total?: number;
    notes?: string;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PER_HOUR = 20;

const recentSends = new Map<string, number[]>();

function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status });
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clip(value: unknown, max = 300): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").slice(0, max);
}

function num(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function tooManySends(userId: string): boolean {
  const now = Date.now();
  const recent = (recentSends.get(userId) ?? []).filter(
    (time) => now - time < 3600_000,
  );

  if (recent.length >= MAX_PER_HOUR) {
    recentSends.set(userId, recent);
    return true;
  }

  recent.push(now);
  recentSends.set(userId, recent);
  return false;
}

export async function POST(request: Request) {
  if (!mailerConfigured()) {
    return reply(
      {
        ok: false,
        code: "not_configured",
        error: "El envío automático de correos no está configurado.",
      },
      501,
    );
  }

  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return reply({ ok: false, error: "Debes iniciar sesión." }, 401);
  }

  const businessId = String(payload.businessId ?? "");
  const doc = payload.document;
  const recipients = Array.isArray(payload.to)
    ? payload.to.map((item) => clip(item, 254).trim().toLowerCase()).filter(Boolean)
    : [];

  if (!UUID_PATTERN.test(businessId) || !doc || !doc.type) {
    return reply({ ok: false, error: "Faltan datos del documento." }, 400);
  }

  if (recipients.length === 0 || recipients.length > 3) {
    return reply({ ok: false, error: "Indica entre 1 y 3 correos." }, 400);
  }

  if (recipients.some((address) => !EMAIL_PATTERN.test(address))) {
    return reply({ ok: false, error: "Hay un correo con formato no válido." }, 400);
  }

  if (!Array.isArray(doc.items) || doc.items.length === 0 || doc.items.length > 100) {
    return reply({ ok: false, error: "El documento no tiene conceptos válidos." }, 400);
  }

  if (tooManySends(user.id)) {
    return reply(
      { ok: false, error: "Alcanzaste el límite de envíos por hora. Inténtalo más tarde." },
      429,
    );
  }

  const { data: member } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member || member.role === "worker") {
    return reply({ ok: false, error: "No tienes permiso para enviar documentos." }, 403);
  }

  const { data: operational } = await supabase.rpc("business_is_operational", {
    p_business: businessId,
  });

  if (!operational) {
    return reply({ ok: false, error: "La empresa no está activa." }, 403);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("name, email")
    .eq("id", businessId)
    .maybeSingle();

  const businessName = clip(business?.name || "STIAN", 80);
  const displayName = businessName.replace(/[<>",;]/g, "").trim() || "STIAN";
  const replyTo =
    business?.email && EMAIL_PATTERN.test(business.email) ? business.email : undefined;

  const currency = clip(doc.currency || "COP", 3).toUpperCase() || "COP";
  const money = (value: unknown) => formatMoney(num(value), currency);

  const typeLabel = documentTypeLabel(doc.type);
  const number = documentNumber({
    series: clip(doc.series, 10),
    number: doc.number ? clip(doc.number, 30) : undefined,
  } as BillingDocument);

  const ownParty = doc.type === "received_invoice" ? doc.customer : doc.issuer;
  const ownTax = ownParty?.documentNumber
    ? `${clip(ownParty.documentType || "NIT", 10)}: ${clip(ownParty.documentNumber, 30)}`
    : "";

  const subject = `${typeLabel} ${number} · ${businessName}`;
  const message = clip(payload.message, 1000);

  const rows = doc.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${esc(clip(item.description))}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(num(item.quantity))}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(money(item.unitPrice))}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${esc(money(item.total))}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
    <p style="margin:0;font-size:20px;font-weight:bold">${esc(businessName)}</p>
    ${ownTax ? `<p style="margin:2px 0 0;color:#6b7280">${esc(ownTax)}</p>` : ""}
    <p style="margin:8px 0 20px;color:#6b7280">${esc(typeLabel)} ${esc(number)}</p>
    ${message ? `<p style="white-space:pre-line">${esc(message)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
      <thead>
        <tr>
          <th style="padding:8px;border-bottom:2px solid #111827;text-align:left">Concepto</th>
          <th style="padding:8px;border-bottom:2px solid #111827;text-align:right">Cant.</th>
          <th style="padding:8px;border-bottom:2px solid #111827;text-align:right">Precio</th>
          <th style="padding:8px;border-bottom:2px solid #111827;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;margin:16px 0 0;color:#6b7280">Subtotal: ${esc(money(doc.subtotal))}</p>
    ${num(doc.discount) > 0 ? `<p style="text-align:right;margin:2px 0;color:#6b7280">Descuento: -${esc(money(doc.discount))}</p>` : ""}
    ${num(doc.tax) > 0 ? `<p style="text-align:right;margin:2px 0;color:#6b7280">Impuestos: ${esc(money(doc.tax))}</p>` : ""}
    <p style="text-align:right;margin:8px 0 0;font-size:20px;font-weight:bold">Total: ${esc(money(doc.total))}</p>
    ${doc.notes ? `<p style="margin-top:20px;color:#6b7280">${esc(clip(doc.notes, 500))}</p>` : ""}
    <p style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      Documento enviado desde STIAN en nombre de ${esc(businessName)}. No es factura electrónica DIAN.
    </p>
  </div>
</body></html>`;

  const text = [
    message,
    "",
    `${typeLabel} ${number} · ${businessName}`,
    "",
    ...doc.items.map(
      (item) =>
        `- ${clip(item.description)}: ${num(item.quantity)} x ${money(item.unitPrice)} = ${money(item.total)}`,
    ),
    "",
    `Total: ${money(doc.total)}`,
  ].join("\n");

  const sent = await sendMail({
    to: recipients,
    subject,
    html,
    text,
    fromName: displayName,
    replyTo,
  });

  if (!sent.ok) {
    return reply(
      {
        ok: false,
        error:
          "El servicio de correo rechazó el envío. Revisa que el remitente esté verificado.",
      },
      502,
    );
  }

  await supabase.from("audit_log").insert({
    business_id: businessId,
    action: "billing.emailed",
    entity: "billing_document",
    entity_id: clip(doc.id, 80),
    details: { to: recipients, number },
  });

  return reply({ ok: true }, 200);
}
