import { sendMail } from "@/lib/server/mailer";
import { welcomeEmail } from "@/lib/server/team-emails";
import {
  EMAIL_PATTERN,
  appOrigin,
  authorizeManager,
  generateTempPassword,
  getAdminClient,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = {
  businessId?: string;
  email?: string;
  fullName?: string;
  role?: string;
};

/** Crea el usuario de una persona del equipo con una contraseña temporal. */
export async function POST(request: Request) {
  const admin = getAdminClient();

  if (!admin) {
    return reply(
      {
        ok: false,
        code: "not_configured",
        error: "La creación de usuarios con contraseña no está configurada.",
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

  const businessId = String(payload.businessId ?? "");
  const email = String(payload.email ?? "").trim().toLowerCase();
  const fullName = String(payload.fullName ?? "").trim().slice(0, 120);
  const role = String(payload.role ?? "");

  const caller = await authorizeManager(businessId);

  if (caller instanceof Response) return caller;

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return reply({ ok: false, error: "El correo no tiene un formato válido." }, 400);
  }

  if (!fullName) {
    return reply({ ok: false, error: "Escribe el nombre de la persona." }, 400);
  }

  if (!["manager", "admin", "worker", "owner"].includes(role)) {
    return reply({ ok: false, error: "Rol no válido." }, 400);
  }

  if ((role === "admin" || role === "owner") && caller.role !== "owner") {
    return reply({ ok: false, error: "Solo el propietario puede crear administradores o propietarios." }, 403);
  }

  if (tooManyRequests(`create:${caller.userId}`)) {
    return reply({ ok: false, error: "Demasiados intentos. Inténtalo más tarde." }, 429);
  }

  const { supabase } = caller;

  const { data: operational } = await supabase.rpc("business_is_operational", {
    p_business: businessId,
  });

  if (!operational && !caller.platform) {
    return reply({ ok: false, error: "La empresa no está activa." }, 403);
  }

  // Límite de usuarios del plan.
  const { data: business } = await supabase
    .from("businesses")
    .select("plan_id")
    .eq("id", businessId)
    .maybeSingle();

  if (business?.plan_id && !caller.platform) {
    const { data: plan } = await supabase
      .from("plans")
      .select("max_users")
      .eq("id", business.plan_id)
      .maybeSingle();

    if (plan?.max_users) {
      const [{ count: members }, { count: invitations }] = await Promise.all([
        supabase
          .from("business_members")
          .select("user_id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "active"),
        supabase
          .from("business_invitations")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "pending"),
      ]);

      if ((members ?? 0) + (invitations ?? 0) >= plan.max_users) {
        return reply(
          {
            ok: false,
            error: `Tu plan permite hasta ${plan.max_users} usuarios. Mejora el plan para agregar más personas.`,
          },
          403,
        );
      }
    }
  }

  const password = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      must_change_password: true,
      managed_by_business: businessId,
    },
  });

  if (createError || !created.user) {
    const text = (createError?.message ?? "").toLowerCase();

    if (text.includes("already") || text.includes("registered") || text.includes("exists")) {
      return reply(
        {
          ok: false,
          code: "exists",
          error: "Ya existe una cuenta con ese correo.",
        },
        409,
      );
    }

    return reply({ ok: false, error: "No fue posible crear el usuario." }, 500);
  }

  const { error: memberError } = await admin.from("business_members").insert({
    business_id: businessId,
    user_id: created.user.id,
    role,
    status: "active",
  });

  if (memberError) {
    await admin.auth.admin.deleteUser(created.user.id);

    return reply({ ok: false, error: "No fue posible agregar a la persona al equipo." }, 500);
  }

  await admin.from("audit_log").insert({
    business_id: businessId,
    user_id: caller.userId,
    action: "team.user_created",
    entity: "member",
    entity_id: created.user.id,
    details: { email, role },
  });

  // Correo con los datos de acceso (si el envío de correos está configurado).
  const { data: businessRow } = await supabase
    .from("businesses")
    .select("name, email")
    .eq("id", businessId)
    .maybeSingle();

  const businessName = businessRow?.name ?? "tu negocio";
  const origin = appOrigin(request);

  const mail = welcomeEmail({
    businessName,
    fullName,
    email,
    password,
    role,
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
      userId: created.user.id,
      email,
      password,
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    },
    200,
  );
}
