"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { printSubscriptionReceipt } from "../../lib/billing/subscription-receipt";
import { sendNotification } from "./notify";
import {
  cardClass,
  formatDate,
  ghostButton,
  money,
  primaryButton,
} from "./shared";

type PaymentRow = {
  id: string;
  business_id: string;
  receipt_number: number | null;
  business_name: string;
  plan_name: string | null;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  months: number;
  period_end: string;
  status: "confirmed" | "voided";
  notes: string | null;
  created_at: string;
  recorded_by_email: string | null;
};

const METHOD_LABELS: Record<string, string> = {
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
};

export default function PaymentsTab({
  refreshKey,
  onNewPayment,
  flash,
  setError,
}: {
  refreshKey: number;
  onNewPayment: () => void;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase.rpc("master_list_payments", {
      p_business: null,
    });

    if (error) setError(error.message);

    setRows((data as PaymentRow[] | null) ?? []);
    setLoading(false);
  }, [supabase, setError]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function voidPayment(row: PaymentRow) {
    const confirmed = window.confirm(
      `¿Anular el pago de ${money(row.amount, row.currency)} de ${row.business_name}?\n\nEl pago deja de contarse en los ingresos, pero NO cambia la fecha de suscripción de la empresa: si hace falta, ajústala en «Gestionar».`,
    );

    if (!confirmed || !supabase) return;

    const { error } = await supabase.rpc("master_void_payment", { p_payment: row.id });

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash("Pago anulado.");
    await load();
  }

  const confirmedTotal = rows
    .filter((row) => row.status === "confirmed")
    .reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total cobrado (pagos confirmados): <strong>{money(confirmedTotal)}</strong>
        </p>

        <button type="button" onClick={onNewPayment} className={primaryButton}>
          + Registrar pago
        </button>
      </div>

      <div className={`${cardClass} overflow-x-auto p-0 sm:p-0`}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10">
            <tr>
              {["No.", "Fecha", "Empresa", "Plan", "Valor", "Meses", "Activa hasta", "Forma", "Referencia", ""].map(
                (title) => (
                  <th key={title} className="px-4 py-3 font-semibold">
                    {title}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-slate-100 last:border-0 dark:border-white/5 ${
                  row.status === "voided" ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3 font-semibold">{row.receipt_number ?? "—"}</td>
                <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                <td className="px-4 py-3 font-medium">{row.business_name}</td>
                <td className="px-4 py-3">{row.plan_name ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">
                  {money(Number(row.amount), row.currency)}
                  {row.status === "voided" && (
                    <span className="ml-2 text-xs font-normal text-rose-600">anulado</span>
                  )}
                </td>
                <td className="px-4 py-3">{row.months}</td>
                <td className="px-4 py-3">{formatDate(row.period_end)}</td>
                <td className="px-4 py-3">{METHOD_LABELS[row.method] ?? row.method}</td>
                <td className="px-4 py-3">{row.reference ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {row.status === "confirmed" && (
                    <span className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          printSubscriptionReceipt({
                            number: row.receipt_number,
                            businessName: row.business_name,
                            planName: row.plan_name,
                            amount: Number(row.amount),
                            currency: row.currency,
                            months: row.months,
                            periodEnd: row.period_end,
                            method: row.method,
                            reference: row.reference,
                            date: row.created_at,
                          })
                        }
                        className={ghostButton}
                      >
                        Comprobante
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await sendNotification("receipt", row.business_id, row.id);

                          if (result.ok) {
                            setError("");
                            flash(result.message);
                          } else {
                            setError(result.message);
                          }
                        }}
                        className={ghostButton}
                      >
                        Enviar
                      </button>
                      <button type="button" onClick={() => void voidPayment(row)} className={ghostButton}>
                        Anular
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && rows.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            Todavía no hay pagos registrados.
          </p>
        )}
      </div>
    </section>
  );
}
