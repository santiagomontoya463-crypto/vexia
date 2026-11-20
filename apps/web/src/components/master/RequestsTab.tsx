"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  cardClass,
  formatDate,
  formatDateTime,
  ghostButton,
  inputClass,
  money,
  primaryButton,
  type PaymentRequest,
} from "./shared";

const STATUS_LABELS: Record<PaymentRequest["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_STYLES: Record<PaymentRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

/** Avisa por correo; si el envío no está configurado no pasa nada. */
async function notify(requestId: string) {
  try {
    await fetch("/api/subscription/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, event: "reviewed" }),
    });
  } catch {
    // El correo es un aviso extra: la revisión ya quedó guardada.
  }
}

export default function RequestsTab({
  flash,
  setError,
  onChanged,
}: {
  flash: (message: string) => void;
  setError: (message: string) => void;
  onChanged: () => void | Promise<void>;
}) {
  const { supabase } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyPending, setOnlyPending] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase.rpc("master_list_requests", {
      p_status: onlyPending ? "pending" : null,
    });

    if (error) {
      setError(
        "No fue posible cargar las solicitudes. ¿Ya ejecutaste la migración 0011_cobros.sql en Supabase?",
      );
    } else {
      setError("");
      setRequests((data as PaymentRequest[] | null) ?? []);
    }

    setLoading(false);
  }, [supabase, onlyPending, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(request: PaymentRequest, approve: boolean) {
    if (!supabase) return;

    if (!approve && reason.trim().length === 0) {
      setError("Escribe el motivo del rechazo para que la empresa lo vea.");
      return;
    }

    if (
      approve &&
      !window.confirm(
        `¿Confirmas que recibiste ${money(request.amount, request.currency)} de ${request.business_name}? Se activará su suscripción por ${request.months} ${
          request.months === 1 ? "mes" : "meses"
        }.`,
      )
    ) {
      return;
    }

    setBusy(request.id);

    const { error } = await supabase.rpc("master_review_request", {
      p_request: request.id,
      p_approve: approve,
      p_reason: approve ? null : reason.trim(),
    });

    setBusy(null);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    setRejecting(null);
    setReason("");
    flash(
      approve
        ? `Pago aprobado: ${request.business_name} quedó activa.`
        : `Solicitud de ${request.business_name} rechazada.`,
    );

    void notify(request.id);
    await load();
    await onChanged();
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Solicitudes de pago</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pagos que las empresas reportan haber hecho. Verifica la transferencia en tu cuenta
              y aprueba: la suscripción se activa o se renueva sola.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOnlyPending(true)}
              className={onlyPending ? primaryButton : ghostButton}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setOnlyPending(false)}
              className={!onlyPending ? primaryButton : ghostButton}
            >
              Todas
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-500">Cargando solicitudes...</p>}

      {!loading && requests.length === 0 && (
        <section className={cardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {onlyPending
              ? "No hay solicitudes pendientes por revisar."
              : "Todavía no hay solicitudes de pago."}
          </p>
        </section>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <article key={request.id} className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{request.business_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enviada el {formatDateTime(request.created_at)}
                  {request.requested_by_email ? ` · ${request.requested_by_email}` : ""}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[request.status]}`}
              >
                {STATUS_LABELS[request.status]}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-400">Plan</dt>
                <dd className="mt-1 font-semibold">
                  {request.plan_name ?? "—"} · {request.months}{" "}
                  {request.months === 1 ? "mes" : "meses"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Valor</dt>
                <dd className="mt-1 font-semibold">{money(request.amount, request.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Referencia</dt>
                <dd className="mt-1 break-all font-mono font-semibold">{request.reference}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Pagó el</dt>
                <dd className="mt-1 font-semibold">{formatDate(request.paid_on)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Cuenta usada</dt>
                <dd className="mt-1 font-semibold">{request.account_label ?? "No indicó"}</dd>
              </div>
            </dl>

            {request.notes && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/[0.04]">
                {request.notes}
              </p>
            )}

            {request.status === "rejected" && request.reject_reason && (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                Motivo del rechazo: {request.reject_reason}
              </p>
            )}

            {request.status !== "pending" && request.reviewed_at && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Revisada el {formatDateTime(request.reviewed_at)}
              </p>
            )}

            {request.status === "pending" && (
              <div className="mt-4 space-y-3">
                {rejecting === request.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={2}
                      placeholder="Motivo del rechazo (la empresa lo verá)"
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === request.id}
                        onClick={() => void review(request, false)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Confirmar rechazo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(null);
                          setReason("");
                        }}
                        className={ghostButton}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === request.id}
                      onClick={() => void review(request, true)}
                      className={primaryButton}
                    >
                      {busy === request.id ? "Procesando..." : "Aprobar pago"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejecting(request.id);
                        setReason("");
                      }}
                      className={`${ghostButton} text-rose-600`}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
