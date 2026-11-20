import { sendMail } from "@/lib/server/mailer";
import { resetEmail } from "@/lib/server/team-emails";
import {
  UUID_PATTERN,
  appOrigin,
  authorizeManager,
  generateTempPassword,
  getAdminClient,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = { businessId?: string; userId?: string };

/**
 * Genera una contraseña temporal nueva para una persona creada por la empresa.
 * Solo funciona con usuarios creados desde STIAN para ESA empresa; las cuentas
 * que alguien creó por su cuenta usan «Olvidé mi contraseña».
 */
export async function POST(request: Request) {
  const admin = getAdminClient();

  if (!admin) {
    return reply(
      { ok: false, code: "not_configured", error: "Función no configurada." },
      501,
    );
  }

  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const businessId = String(payload.businessId ?? "");
  const targetId = String(payload.userId ?? "");

  const caller = await authorizeManager(businessId);

  if (caller instanceof Response) return caller;

  if (!UUID_PATTERN.test(targetId)) {
    return reply({ ok: false, error: "Persona no válida." }, 400);
  }

  if (targetId === caller.userId) {
    return reply({ ok: false, error: "Cambia tu propia contraseña desde tu cuenta." }, 400);
  }

  if (tooManyRequests(`reset:${caller.userId}`, 20)) {
    return reply({ ok: false, error: "Demasiados intentos. Inténtalo más tarde." }, 429);
  }

  const { data: member } = await caller.supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", targetId)
    .maybeSingle();

  if (!member) {
    return reply({ ok: false, error: "La persona no hace parte de este equipo." }, 404);
  }

  if (member.role === "owner" || (caller.role === "admin" && member.role === "admin")) {
    return reply({ ok: false, error: "No tienes permiso sobre esta persona." }, 403);
  }

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(targetId);

  if (targetError || !target.user) {
    return reply({ ok: false, error: "No se encontró la cuenta." }, 404);
  }

  const metadata = (target.user.user_metadata ?? {}) as Record<string, unknown>;

  if (metadata.managed_by_business !== businessId) {
    return reply(
      {
        ok: false,
        code: "not_managed",
        error:
          "Esta persona creó su propia cuenta. Debe usar «Olvidé mi contraseña» en la pantalla de inicio de sesión.",
      },
      403,
    );
  }

  const password = generateTempPassword();

  const { error: updateError } = await admin.auth.admin.updateUserById(targetId, {
    password,
    user_metadata: { ...metadata, must_change_password: true },
  });

  if (updateError) {
    return reply({ ok: false, error: "No fue posible restablecer la contraseña." }, 500);
  }

  await admin.from("audit_log").insert({
    business_id: businessId,
    user_id: caller.userId,
    action: "team.password_reset",
    entity: "member",
    entity_id: targetId,
    details: { email: target.user.email },
  });

  const { data: businessRow } = await caller.supabase
    .from("businesses")
    .select("name, email")
    .eq("id", businessId)
    .maybeSingle();

  const businessName = businessRow?.name ?? "tu negocio";
  let emailSent = false;
  let emailError: string | undefined;

  if (target.user.email) {
    const mail = resetEmail({
      businessName,
      email: target.user.email,
      password,
      loginUrl: `${appOrigin(request)}/login`,
    });

    const sent = await sendMail({
      to: [target.user.email],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: businessName,
      replyTo: businessRow?.email ?? undefined,
    });

    emailSent = sent.ok;
    emailError = sent.ok ? undefined : sent.error;
  }

  return reply(
    { ok: true, email: target.user.email, password, emailSent, emailError },
    200,
  );
}
