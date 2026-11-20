"use client";

import { useCallback, useEffect, useState } from "react";
import { ROLE_LABELS, useAuth, type BusinessRole } from "../../lib/auth/AuthProvider";
import AddMemberForm, {
  CredentialsCard,
  EmailStatus,
} from "../../components/team/AddMemberForm";

type Member = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: BusinessRole;
  status: "active" | "invited" | "disabled";
  created_at: string;
  managed?: boolean;
};

type Invitation = {
  id: string;
  email: string;
  role: BusinessRole;
  created_at: string;
};

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

const ROLE_HELP: { role: BusinessRole; text: string }[] = [
  { role: "owner", text: "Control total del negocio y de su equipo. Puede nombrar a otros propietarios." },
  { role: "admin", text: "Administra el negocio y las personas del equipo." },
  { role: "manager", text: "Ve toda la operación y las finanzas, sin administrar accesos." },
  { role: "worker", text: "Trabaja el día a día: reservas, clientes, servicios, productos y ventas." },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TeamPage() {
  const { supabase, user, activeMembership } = useAuth();
  const business = activeMembership?.business;
  const myRole = activeMembership?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !business) return;

    setLoading(true);

    const [teamResult, invitationsResult] = await Promise.all([
      supabase.rpc("list_business_team", { p_business: business.id }),
      supabase
        .from("business_invitations")
        .select("id, email, role, created_at")
        .eq("business_id", business.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    if (teamResult.error) setError(teamResult.error.message);

    setMembers((teamResult.data as Member[] | null) ?? []);
    setInvitations((invitationsResult.data as Invitation[] | null) ?? []);
    setLoading(false);
  }, [supabase, business]);

  useEffect(() => {
    void load();
  }, [load]);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 6000);
  }

  const [resetResult, setResetResult] = useState<{
    email: string;
    password: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);

  async function resetPassword(member: Member) {
    if (!business) return;

    const confirmed = window.confirm(
      `¿Generar una contraseña temporal nueva para ${member.full_name || member.email}? La anterior dejará de servir.`,
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch("/api/team/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, userId: member.user_id }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        email?: string;
        password?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (response.ok && body.ok && body.password) {
        setResetResult({
          email: body.email ?? member.email ?? "",
          password: body.password,
          emailSent: Boolean(body.emailSent),
          emailError: body.emailError,
        });
      } else {
        setError(body.error ?? "No fue posible restablecer la contraseña.");
      }
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
    }
  }

  async function revoke(invitation: Invitation) {
    if (!supabase) return;

    const { error: rpcError } = await supabase.rpc("revoke_invitation", {
      p_invitation: invitation.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setError("");
    await load();
  }

  async function updateMember(
    member: Member,
    changes: { role?: BusinessRole; status?: "active" | "disabled" },
  ) {
    if (!supabase || !business) return;

    const { error: rpcError } = await supabase.rpc("update_member", {
      p_business: business.id,
      p_user: member.user_id,
      p_role: changes.role ?? null,
      p_status: changes.status ?? null,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setError("");
    await load();
  }

  function changeRole(member: Member, nextRole: BusinessRole) {
    if (nextRole === member.role) return;

    if (nextRole === "owner") {
      const confirmed = window.confirm(
        `${member.full_name || member.email} tendrá control total del negocio: podrá cambiar roles, quitar personas (incluyéndote) y ver todo. ¿Continuar?`,
      );

      if (!confirmed) return;
    } else if (nextRole === "admin") {
      const confirmed = window.confirm(
        `${member.full_name || member.email} podrá administrar el negocio y a las personas del equipo. ¿Continuar?`,
      );

      if (!confirmed) return;
    }

    void updateMember(member, { role: nextRole });
  }

  async function deleteUser(member: Member) {
    if (!business) return;

    const confirmed = window.confirm(
      `¿Eliminar por completo a ${member.full_name || member.email}?\n\nSu usuario y su contraseña dejarán de existir y no podrá volver a entrar. Lo que registró (ventas, citas, clientes) se conserva en ${business.name}.`,
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch("/api/team/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, userId: member.user_id }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        code?: string;
        accountDeleted?: boolean;
      };

      if (response.ok && body.ok) {
        flash(
          body.accountDeleted
            ? "Usuario eliminado por completo."
            : "La persona también pertenece a otra empresa: se retiró de esta y su cuenta se conservó.",
        );
        await load();
      } else if (body.code === "not_configured") {
        setError(
          "Eliminar cuentas requiere la clave secreta del servidor (SUPABASE_SECRET_KEY). Mientras tanto puedes quitarla del equipo.",
        );
      } else {
        setError(body.error ?? "No fue posible eliminar el usuario.");
      }
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
    }
  }

  async function removeMember(member: Member) {
    if (!supabase || !business) return;

    const confirmed = window.confirm(
      `¿Quitar a ${member.full_name || member.email} del equipo? Perderá el acceso a ${business.name}.`,
    );

    if (!confirmed) return;

    const { error: rpcError } = await supabase.rpc("remove_member", {
      p_business: business.id,
      p_user: member.user_id,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setError("");
    await load();
  }

  async function copySignupLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/registro`);
      flash("Enlace de registro copiado.");
    } catch {
      flash(`Comparte este enlace: ${window.location.origin}/registro`);
    }
  }

  if (!business) return null;

  return (
    <main className="min-h-screen bg-[#f5f6fc] text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/75 px-5 py-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1220]/80 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Accesos de {business.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Equipo y accesos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Invita personas a tu negocio y decide qué puede hacer cada una.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-6 p-5 sm:p-8 lg:p-10">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        )}

        {canManage && (
          <section className={cardClass}>
            <h2 className="font-bold">Agregar una persona</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cada persona tiene su propio usuario y contraseña, y ve solo lo que su
              rol permite.
            </p>

            <div className="mt-4">
              <AddMemberForm onDone={() => void load()} />
            </div>

            <button
              type="button"
              onClick={() => void copySignupLink()}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
            >
              Copiar enlace de registro
            </button>
          </section>
        )}

        {resetResult && (
          <div className="space-y-3">
            <EmailStatus
              sent={resetResult.emailSent}
              email={resetResult.email}
              error={resetResult.emailError}
            />
            <CredentialsCard
              email={resetResult.email}
              password={resetResult.password}
              businessName={business.name}
            />
          </div>
        )}

        <section className={cardClass}>
          <h2 className="font-bold">Integrantes</h2>

          {loading && <p className="mt-3 text-sm text-slate-500">Cargando...</p>}

          <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            {members.map((member) => {
              const isMe = member.user_id === user?.id;
              const locked =
                !canManage ||
                isMe ||
                (myRole === "admin" &&
                  (member.role === "admin" || member.role === "owner"));

              return (
                <li
                  key={member.user_id}
                  className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {member.full_name || member.email}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          (tú)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {member.email} · desde {formatDate(member.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {locked ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {ROLE_LABELS[member.role]}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(event) =>
                          changeRole(member, event.target.value as BusinessRole)
                        }
                        aria-label={`Rol de ${member.email}`}
                        className={`${inputClass} w-auto`}
                      >
                        <option value="worker">{ROLE_LABELS.worker}</option>
                        <option value="manager">{ROLE_LABELS.manager}</option>
                        {myRole === "owner" && (
                          <>
                            <option value="admin">{ROLE_LABELS.admin}</option>
                            <option value="owner">{ROLE_LABELS.owner}</option>
                          </>
                        )}
                      </select>
                    )}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        member.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {member.status === "active" ? "Activo" : "Desactivado"}
                    </span>

                    {!locked && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void updateMember(member, {
                              status: member.status === "active" ? "disabled" : "active",
                            })
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
                        >
                          {member.status === "active" ? "Desactivar" : "Activar"}
                        </button>
                        {member.managed && (
                          <button
                            type="button"
                            onClick={() => void resetPassword(member)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
                          >
                            Restablecer contraseña
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            void (member.managed ? deleteUser(member) : removeMember(member))
                          }
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          {member.managed ? "Eliminar usuario" : "Quitar del equipo"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {invitations.length > 0 && (
          <section className={cardClass}>
            <h2 className="font-bold">Invitaciones pendientes</h2>

            <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm">
                    <strong>{invitation.email}</strong> · {ROLE_LABELS[invitation.role]} ·
                    enviada el {formatDate(invitation.created_at)}
                  </span>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void revoke(invitation)}
                      className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancelar invitación
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={cardClass}>
          <h2 className="font-bold">Qué puede hacer cada rol</h2>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {ROLE_HELP.map((item) => (
              <div key={item.role}>
                <dt className="text-sm font-semibold">{ROLE_LABELS[item.role]}</dt>
                <dd className="text-sm text-slate-500 dark:text-slate-400">
                  {item.text}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
