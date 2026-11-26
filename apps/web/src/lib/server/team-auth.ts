import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

/**
 * Utilidades del servidor para crear usuarios y restablecer contraseñas.
 *
 * Requieren una clave secreta de Supabase en el servidor (NUNCA con el
 * prefijo NEXT_PUBLIC_):
 *   SUPABASE_SECRET_KEY   (o SUPABASE_SERVICE_ROLE_KEY en proyectos antiguos)
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status });
}

export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";

/** Contraseña temporal de 12 caracteres, sin letras que se confundan. */
export function generateTempPassword(): string {
  const pick = (set: string) => set[randomInt(set.length)];
  const all = UPPER + LOWER + DIGITS;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];

  while (chars.length < 12) chars.push(pick(all));

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  return chars.join("");
}

/** Dirección pública de la aplicación, para los enlaces de los correos. */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) return configured.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (host) {
    const local = host.startsWith("localhost") || host.startsWith("127.");
    const proto = request.headers.get("x-forwarded-proto") ?? (local ? "http" : "https");

    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

const recent = new Map<string, number[]>();

export function tooManyRequests(key: string, max = 30): boolean {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((time) => now - time < 3600_000);

  if (list.length >= max) {
    recent.set(key, list);
    return true;
  }

  list.push(now);
  recent.set(key, list);
  return false;
}

export type Caller = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: "owner" | "admin";
  /** Verdadero si quien llama es administrador de la plataforma (Master). */
  platform: boolean;
};

/** Verifica que quien llama sea administrador de la plataforma. */
export async function authorizePlatformAdmin(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | Response
> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return reply({ ok: false, error: "Debes iniciar sesión." }, 401);
  }

  const { data: admin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return reply({ ok: false, error: "Solo el administrador de la plataforma puede hacer esto." }, 403);
  }

  return { supabase, userId: user.id };
}

/** Verifica la sesión y que quien llama sea propietario o administrador. */
export async function authorizeManager(
  businessId: string,
): Promise<Caller | Response> {
  if (!UUID_PATTERN.test(businessId)) {
    return reply({ ok: false, error: "Empresa no válida." }, 400);
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return reply({ ok: false, error: "Debes iniciar sesión." }, 401);
  }

  // El administrador de la plataforma puede gestionar el equipo de cualquier empresa.
  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformAdmin) {
    return { supabase, userId: user.id, role: "owner", platform: true };
  }

  const { data: member } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return reply(
      { ok: false, error: "Solo el propietario o un administrador puede hacer esto." },
      403,
    );
  }

  return { supabase, userId: user.id, role: member.role, platform: false };
}
