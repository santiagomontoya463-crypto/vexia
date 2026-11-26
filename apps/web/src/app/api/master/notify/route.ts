import { sendMail } from "@/lib/server/mailer";
import { receiptEmail, reminderEmail } from "@/lib/server/master-emails";
import {
  UUID_PATTERN,
  appOrigin,
  authorizePlatformAdmin,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = {
  type?: "reminder" | "receipt";
  businessId?: string;
  paymentId?: string;
};

type BusinessRow = {
  id: string;
  name: string;
  status: string;
  plan_id: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  owner_email: string | null;
  currency: string;
};

type PaymentRow = {
  id: string;
  business_id: string;
  plan_name: string | null;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  months: number;
  period_end: string;
  created_at: string;
  receipt_number: number | null;
};

const METHOD_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function longDate(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Envía por correo un recordatorio de cobro o el comprobante de un pago. */
export async function POST(request: Request) {
  const caller = await authorizePlatformAdmin();

  if (caller instanceof Response) return caller;

  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const businessId = String(payload.businessId ?? "");

  if (!UUID_PATTERN.test(businessId) || !payload.type) {
    return reply({ ok: false, error: "Faltan datos." }, 400);
  }

  if (tooManyRequests(`notify:${caller.userId}`, 200)) {
    return reply({ ok: false, error: "Demasiados envíos. Inténtalo más tarde." }, 429);
  }

  const { supabase } = caller;

  const { data: businesses } = await supabase.rpc("master_list_businesses");
  const business = ((businesses ?? []) as BusinessRow[]).find((item) => item.id === businessId);

  if (!business) {
    return reply({ ok: false, error: "La empresa no existe." }, 404);
  }

  if (!business.owner_email) {
    return reply({ ok: false, error: "La empresa no tiene un propietario con correo." }, 400);
  }

  const payUrl = `${appOrigin(request)}/suscripcion`;

  if (payload.type === "receipt") {
    const { data: payments } = await supabase.rpc("master_list_payments", {
      p_business: businessId,
    });

    const payment = ((payments ?? []) as PaymentRow[]).find(
      (item) => item.id === payload.paymentId,
    );

    if (!payment) {
      return reply({ ok: false, error: "No se encontró el pago." }, 404);
    }

    const mail = receiptEmail({
      businessName: business.name,
      receiptNumber: String(payment.receipt_number ?? "—"),
      planName: payment.plan_name ?? "Suscripción STIAN",
      amountText: money(Number(payment.amount), payment.currency),
      months: payment.months,
      until: longDate(payment.period_end),
      method: METHOD_LABELS[payment.method] ?? payment.method,
      reference: payment.reference,
      date: longDate(payment.created_at),
      payUrl,
    });

    const sent = await sendMail({
      to: [business.owner_email],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: "STIAN",
    });

    return sent.ok
      ? reply({ ok: true, to: business.owner_email }, 200)
      : reply({ ok: false, code: sent.code, error: sent.error }, sent.code === "not_configured" ? 501 : 502);
  }

  // Recordatorio de cobro
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["payment_instructions", "support_contact"]);

  const setting = (key: string) =>
    String((settings ?? []).find((item) => item.key === key)?.value ?? "");

  let price = 0;

  if (business.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("price_monthly")
      .eq("id", business.plan_id)
      .maybeSingle();

    price = Number(plan?.price_monthly ?? 0);
  }

  const reference =
    business.status === "trial" ? business.trial_ends_at : business.subscription_ends_at;
  const expired = reference ? new Date(reference).getTime() < Date.now() : false;
  const label = business.status === "trial" ? "tu prueba gratuita" : "tu suscripción";

  const situation = reference
    ? expired
      ? `${label[0].toUpperCase()}${label.slice(1)} venció el ${longDate(reference)}. Para seguir usando STIAN, realiza tu pago y avísanos desde la aplicación.`
      : `${label[0].toUpperCase()}${label.slice(1)} vence el ${longDate(reference)}. Realiza tu pago para no perder el acceso y avísanos desde la aplicación.`
    : "Te recordamos que tienes un pago pendiente de tu suscripción.";

  const mail = reminderEmail({
    businessName: business.name,
    situation,
    amountText: price > 0 ? money(price, business.currency) + " al mes" : undefined,
    instructions: setting("payment_instructions"),
    support: setting("support_contact"),
    payUrl,
  });

  const sent = await sendMail({
    to: [business.owner_email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    fromName: "STIAN",
  });

  return sent.ok
    ? reply({ ok: true, to: business.owner_email }, 200)
    : reply({ ok: false, code: sent.code, error: sent.error }, sent.code === "not_configured" ? 501 : 502);
}
