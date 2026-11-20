import { sendMail } from "@/lib/server/mailer";
import { invitationEmail } from "@/lib/server/team-emails";
import {
  EMAIL_PATTERN,
  appOrigin,
  authorizeManager,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = { businessId?: string; email?: string; role?: string };

/** Crea una invitación al equipo y le avisa a la persona por correo. */
export async function POST(request: Request) {
  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const businessId = String(payload.businessId ?? "");
  const email = String(payload.email ?? "").trim().toLowerCase();
  const role = String(payload.role ?? "");

  const caller = await authorizeManager(businessId);

  if (caller instanceof Response) return caller;

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return reply({ ok: false, error: "El correo no tiene un formato válido." }, 400);
  }

  if (!["manager", "admin", "worker"].includes(role)) {
    return reply({ ok: false, error: "Rol no válido." }, 400);
  }

  if (tooManyRequests(`invite:${caller.userId}`)) {
    return reply({ ok: false, error: "Demasiados intentos. Inténtalo más tarde." }, 429);
  }

  // La función de la base de datos valida permisos, plan y duplicados.
  const { error: rpcError } = await caller.supabase.rpc("invite_member", {
    p_business: businessId,
    p_email: email,
    p_role: role,
  });

  if (rpcError) {
    return reply({ ok: false, error: rpcError.message }, 400);
  }

  const { data: businessRow } = await caller.supabase
    .from("businesses")
    .select("name, email")
    .eq("id", businessId)
    .maybeSingle();

  const businessName = businessRow?.name ?? "un negocio";
  const origin = appOrigin(request);

  const mail = invitationEmail({
    businessName,
    email,
    role,
    signupUrl: `${origin}/registro`,
    loginUrl: `${origin}/login`,
  });

  const sent = await sendMail({
    to: [email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    fromName: businessName,
    replyTo: businessRow?.email ?? undefined,
  });

  return reply(
    {
      ok: true,
      email,
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    },
    200,
  );
}
