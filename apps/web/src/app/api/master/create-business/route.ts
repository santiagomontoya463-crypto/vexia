import { sendMail } from "@/lib/server/mailer";
import { welcomeEmail } from "@/lib/server/team-emails";
import {
  EMAIL_PATTERN,
  UUID_PATTERN,
  appOrigin,
  authorizePlatformAdmin,
  generateTempPassword,
  getAdminClient,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = {
  name?: string;
  businessType?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerName?: string;
  ownerEmail?: string;
  planId?: string;
  mode?: "trial" | "active";
  trialDays?: number;
  months?: number;
  amount?: number;
  method?: string;
  reference?: string;
  sendEmail?: boolean;
  prospectId?: string;
};

const clip = (value: unknown, max = 200) => String(value ?? "").trim().slice(0, max);

/**
 * Inscribe una empresa nueva desde el panel Master: crea la empresa, la cuenta
 * del propietario (con contraseña temporal) y, si se pide, registra el pago.
 */
export async function POST(request: Request) {
  const admin = getAdminClient();

  if (!admin) {
    return reply(
      {
        ok: false,
        code: "not_configured",
        error:
          "Falta la clave secreta del servidor (SUPABASE_SECRET_KEY) para crear cuentas desde el panel.",
      },
      501,
    );
  }

  const caller = await authorizePlatformAdmin();

  if (caller instanceof Response) return caller;

  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return reply({ ok: false, error: "Solicitud no válida." }, 400);
  }

  const name = clip(payload.name, 120);
  const ownerEmail = clip(payload.ownerEmail, 254).toLowerCase();
  const ownerName = clip(payload.ownerName, 120);
  const mode = payload.mode === "active" ? "active" : "trial";
  const planId = payload.planId && UUID_PATTERN.test(payload.planId) ? payload.planId : null;

  if (!name) return reply({ ok: false, error: "Escribe el nombre de la empresa." }, 400);

  if (!EMAIL_PATTERN.test(ownerEmail)) {
    return reply({ ok: false, error: "El correo del propietario no es válido." }, 400);
  }

  if (!ownerName) return reply({ ok: false, error: "Escribe el nombre del propietario." }, 400);

  if (tooManyRequests(`create-business:${caller.userId}`, 60)) {
    return reply({ ok: false, error: "Demasiados intentos. Inténtalo más tarde." }, 429);
  }

  // ¿El propietario ya tiene cuenta?
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", ownerEmail)
    .maybeSingle();

  let ownerId: string | null = existing?.id ?? null;
  const existingUser = Boolean(ownerId);
  const password = generateTempPassword();
  let createdUser = false;

  if (!ownerId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: ownerName, must_change_password: true },
    });

    if (createError || !created.user) {
      return reply({ ok: false, error: "No fue posible crear la cuenta del propietario." }, 500);
    }

    ownerId = created.user.id;
    createdUser = true;
  }

  async function rollback(businessId?: string) {
    if (businessId) await admin!.from("businesses").delete().eq("id", businessId);
    if (createdUser && ownerId) await admin!.auth.admin.deleteUser(ownerId);
  }

  // Días de prueba por defecto de la plataforma.
  let trialDays = Number(payload.trialDays);

  if (!Number.isFinite(trialDays) || trialDays < 0) {
    const { data: setting } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "trial_days")
      .maybeSingle();

    trialDays = Number(setting?.value ?? 3) || 3;
  }

  const months = Math.min(Math.max(Number(payload.months) || 1, 1), 36);
  const now = new Date();
  const until = new Date(now);

  if (mode === "active") until.setMonth(until.getMonth() + months);
  else until.setDate(until.getDate() + trialDays);

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name,
      business_type: clip(payload.businessType) || null,
      document_number: clip(payload.documentNumber, 40) || null,
      email: clip(payload.email, 254) || null,
      phone: clip(payload.phone, 40) || null,
      address: clip(payload.address, 200) || null,
      status: mode === "active" ? "active" : "trial",
      plan_id: planId,
      trial_ends_at: mode === "trial" ? until.toISOString() : null,
      subscription_ends_at: mode === "active" ? until.toISOString() : null,
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    await rollback();
    return reply({ ok: false, error: "No fue posible crear la empresa." }, 500);
  }

  const { error: memberError } = await admin.from("business_members").insert({
    business_id: business.id,
    user_id: ownerId,
    role: "owner",
    status: "active",
  });

  if (memberError) {
    await rollback(business.id);
    return reply({ ok: false, error: "No fue posible asignar al propietario." }, 500);
  }

  if (createdUser) {
    await admin.auth.admin.updateUserById(ownerId, {
      user_metadata: {
        full_name: ownerName,
        must_change_password: true,
        managed_by_business: business.id,
      },
    });
  }

  // Si se inscribe ya pagada, se deja registrado el pago.
  if (mode === "active" && payload.amount !== undefined && Number(payload.amount) >= 0) {
    const method = ["transfer", "cash", "card", "other"].includes(String(payload.method))
      ? String(payload.method)
      : "transfer";

    await admin.from("subscription_payments").insert({
      business_id: business.id,
      plan_id: planId,
      amount: Number(payload.amount),
      method,
      reference: clip(payload.reference) || null,
      months,
      period_start: now.toISOString(),
      period_end: until.toISOString(),
      notes: "Inscripción desde el panel Master",
      recorded_by: caller.userId,
    });
  }

  await admin.from("audit_log").insert({
    business_id: business.id,
    user_id: caller.userId,
    action: "business.created",
    entity: "business",
    entity_id: business.id,
    details: { name, byMaster: true, mode, owner: ownerEmail },
  });

  if (payload.prospectId && UUID_PATTERN.test(payload.prospectId)) {
    await admin
      .from("business_prospects")
      .update({
        status: "enrolled",
        business_id: business.id,
        enrolled_at: now.toISOString(),
      })
      .eq("id", payload.prospectId);
  }

  let emailSent = false;
  let emailError: string | undefined;

  if (payload.sendEmail !== false && createdUser) {
    const mail = welcomeEmail({
      businessName: name,
      fullName: ownerName,
      email: ownerEmail,
      password,
      role: "owner",
      loginUrl: `${appOrigin(request)}/login`,
    });

    const sent = await sendMail({
      to: [ownerEmail],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      fromName: name,
      replyTo: clip(payload.email, 254) || undefined,
    });

    emailSent = sent.ok;
    emailError = sent.ok ? undefined : sent.error;
  }

  return reply(
    {
      ok: true,
      businessId: business.id,
      ownerEmail,
      existingUser,
      password: createdUser ? password : undefined,
      emailSent,
      emailError,
    },
    200,
  );
}
