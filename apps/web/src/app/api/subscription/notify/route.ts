import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/server/mailer";
import { newRequestEmail, reviewEmail } from "@/lib/server/subscription-emails";
import {
  UUID_PATTERN,
  appOrigin,
  getAdminClient,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

/**
 * Avisos por correo de los pagos de suscripción.
 *
 *   event "submitted": la empresa reportó un pago  → avisa a los administradores
 *   event "reviewed":  el Master aprobó o rechazó  → avisa a quien lo reportó
 *
 * Es un aviso extra: si el envío no está configurado, la solicitud ya quedó
 * guardada y la respuesta solo indica que no se envió correo.
 */
export async function POST(request: Request) {
  let body: { requestId?: unknown; event?: unknown };

  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const requestId = String(body.requestId ?? "");
  const event = body.event;

  if (!UUID_PATTERN.test(requestId) || (event !== "submitted" && event !== "reviewed")) {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return reply({ ok: false, error: "Debes iniciar sesión." }, 401);
  }

  if (tooManyRequests(`subscription-notify:${user.id}`, 10)) {
    return reply({ ok: false, error: "Demasiados intentos. Espera un momento." }, 429);
  }

  const admin = getAdminClient();

  if (!admin) {
    return reply({ ok: true, emailSent: false, reason: "not_configured" }, 200);
  }

  const { data: row } = await admin
    .from("subscription_requests")
    .select(
      "id, business_id, months, amount, currency, reference, status, reject_reason, requested_by, plan:plans(name)",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (!row) {
    return reply({ ok: false, error: "No se encontró la solicitud." }, 404);
  }

  const { data: business } = await admin
    .from("businesses")
    .select("name, email")
    .eq("id", row.business_id)
    .maybeSingle();

  const planRef = Array.isArray(row.plan) ? row.plan[0] : row.plan;
  const planName = (planRef as { name?: string } | null)?.name ?? "—";
  const businessName = business?.name ?? "Una empresa";
  const origin = appOrigin(request);

  if (event === "submitted") {
    if (row.requested_by !== user.id || row.status !== "pending") {
      return reply({ ok: false, error: "No tienes permiso para esta acción." }, 403);
    }

    const { data: admins } = await admin.from("platform_admins").select("user_id");
    const ids = (admins ?? []).map((item: { user_id: string }) => item.user_id);

    if (ids.length === 0) {
      return reply({ ok: true, emailSent: false, reason: "no_recipients" }, 200);
    }

    const { data: profiles } = await admin.from("profiles").select("email").in("id", ids);
    const to = (profiles ?? [])
      .map((item: { email: string | null }) => item.email)
      .filter((email: string | null): email is string => Boolean(email));

    if (to.length === 0) {
      return reply({ ok: true, emailSent: false, reason: "no_recipients" }, 200);
    }

    const mail = newRequestEmail({
      businessName,
      planName,
      months: row.months,
      amount: Number(row.amount),
      currency: row.currency,
      reference: row.reference,
      panelUrl: `${origin}/master`,
    });

    const result = await sendMail({ ...mail, to, fromName: "STIAN" });

    return reply({ ok: true, emailSent: result.ok }, 200);
  }

  // event === "reviewed": solo un administrador de la plataforma puede avisar.
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");

  if (isAdmin !== true || row.status === "pending") {
    return reply({ ok: false, error: "No tienes permiso para esta acción." }, 403);
  }

  let recipient: string | null = null;

  if (row.requested_by) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", row.requested_by)
      .maybeSingle();

    recipient = profile?.email ?? null;
  }

  recipient = recipient ?? business?.email ?? null;

  if (!recipient) {
    return reply({ ok: true, emailSent: false, reason: "no_recipients" }, 200);
  }

  const mail = reviewEmail({
    businessName,
    approved: row.status === "approved",
    reason: row.reject_reason,
    planName,
    months: row.months,
    appUrl: `${origin}/suscripcion`,
  });

  const result = await sendMail({ ...mail, to: [recipient], fromName: "STIAN" });

  return reply({ ok: true, emailSent: result.ok }, 200);
}
