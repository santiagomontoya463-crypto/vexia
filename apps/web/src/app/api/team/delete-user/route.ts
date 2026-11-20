import {
  UUID_PATTERN,
  authorizeManager,
  getAdminClient,
  reply,
  tooManyRequests,
} from "@/lib/server/team-auth";

type Payload = { businessId?: string; userId?: string };

/**
 * Elimina por completo la cuenta de una persona creada por la empresa
 * (por ejemplo, cuando un trabajador se retira). Si esa cuenta además
 * pertenece a otra empresa, solo se la retira de esta.
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
    return reply({ ok: false, error: "No puedes eliminar tu propia cuenta desde aquí." }, 400);
  }

  if (tooManyRequests(`delete:${caller.userId}`, 20)) {
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

  if (caller.role === "admin" && (member.role === "owner" || member.role === "admin")) {
    return reply({ ok: false, error: "No tienes permiso sobre esta persona." }, 403);
  }

  const { data: target } = await admin.auth.admin.getUserById(targetId);
  const metadata = (target?.user?.user_metadata ?? {}) as Record<string, unknown>;

  if (metadata.managed_by_business !== businessId) {
    return reply(
      {
        ok: false,
        code: "not_managed",
        error:
          "Esta persona creó su propia cuenta, así que no se puede eliminar desde aquí. Puedes quitarla del equipo.",
      },
      403,
    );
  }

  // ¿Pertenece a otras empresas?
  const { count: otherMemberships } = await admin
    .from("business_members")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", targetId)
    .neq("business_id", businessId);

  if ((otherMemberships ?? 0) > 0) {
    await admin
      .from("business_members")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", targetId);

    await admin.from("audit_log").insert({
      business_id: businessId,
      user_id: caller.userId,
      action: "team.member_removed",
      entity: "member",
      entity_id: targetId,
      details: { accountKept: true },
    });

    return reply({ ok: true, accountDeleted: false }, 200);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);

  if (deleteError) {
    return reply({ ok: false, error: "No fue posible eliminar la cuenta." }, 500);
  }

  await admin.from("audit_log").insert({
    business_id: businessId,
    user_id: caller.userId,
    action: "team.user_deleted",
    entity: "member",
    entity_id: targetId,
    details: { email: target?.user?.email },
  });

  return reply({ ok: true, accountDeleted: true }, 200);
}
