"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { PaymentMethod } from "../../lib/finance";
import { registerQuickSale } from "../../lib/sales/register";
import { createDocumentFromSale } from "../../lib/billing/from-sale";
import type { BillingDocument } from "../../lib/billing";
import { getActiveBusinessId } from "../../lib/business";
import {
  documentNumber,
  documentTypeLabel,
  formatMoney,
  printTicket,
} from "../../lib/billing/print";
import ShareDocumentModal from "../billing/ShareDocumentModal";

type Target = {
  id: number;
  client: string;
  phone: string;
  service: string;
  professional: string;
  price: number;
  notes?: string;
};

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "credit", label: "Queda pendiente (crédito)" },
  { value: "other", label: "Otro" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

/**
 * Cobra una cita: registra la venta, el pago en Finanzas y, si se elige,
 * genera el recibo o la factura. Todo en un solo paso.
 */
export default function ChargeReservationModal({
  reservation,
  onClose,
  onCharged,
}: {
  reservation: Target;
  onClose: () => void;
  onCharged: (info: { saleId: string; documentId?: string }) => void;
}) {
  const [total, setTotal] = useState(String(reservation.price));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState(String(reservation.price));
  const [touched, setTouched] = useState(false);
  const [docKind, setDocKind] = useState<"none" | "receipt" | "invoice">("receipt");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    paid: number;
    pending: number;
    total: number;
    doc?: BillingDocument;
  } | null>(null);
  const [sharing, setSharing] = useState(false);

  function changeTotal(value: string) {
    setTotal(value);

    if (!touched) setReceived(value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWarning("");

    const totalValue = Number(total);
    const receivedValue = Number(received);

    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      setError("Ingresa el valor a cobrar.");
      return;
    }

    if (method !== "credit" && (!Number.isFinite(receivedValue) || receivedValue < 0)) {
      setError("Ingresa el valor recibido.");
      return;
    }

    setBusy(true);

    try {
      const sale = registerQuickSale({
        customerName: reservation.client,
        workerName: reservation.professional,
        items: [
          {
            name: reservation.service,
            quantity: 1,
            unitPrice: totalValue,
            type: "service",
          },
        ],
        paymentMethod: method,
        amountReceived: receivedValue,
        notes: reservation.notes,
      });

      let doc: BillingDocument | undefined;

      if (docKind !== "none") {
        try {
          doc = createDocumentFromSale(sale, docKind, {
            name: reservation.client,
            phone: reservation.phone,
          });
        } catch (docError) {
          setWarning(
            docError instanceof Error
              ? `El cobro quedó registrado, pero no se pudo generar el documento: ${docError.message}`
              : "El cobro quedó registrado, pero no se pudo generar el documento.",
          );
        }
      }

      onCharged({ saleId: sale.id, documentId: doc?.id });
      setDone({ paid: sale.paid, pending: sale.pending, total: sale.total, doc });
    } catch (saleError) {
      setError(
        saleError instanceof Error
          ? saleError.message
          : "No fue posible registrar el cobro.",
      );
    }

    setBusy(false);
  }

  const businessId = getActiveBusinessId() ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {done ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Cobro registrado</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {reservation.client} · {reservation.service}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Total</dt>
                <dd className="font-bold">{formatMoney(done.total, "COP")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Recibido</dt>
                <dd className="font-bold text-emerald-600">{formatMoney(done.paid, "COP")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pendiente</dt>
                <dd className="font-bold text-amber-600">{formatMoney(done.pending, "COP")}</dd>
              </div>
            </dl>

            {warning && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                {warning}{" "}
                <Link href="/negocio" className="font-bold underline">
                  Ir a Mi negocio
                </Link>
              </p>
            )}

            {done.doc && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-900">
                <p className="font-semibold">
                  {documentTypeLabel(done.doc.type)} {documentNumber(done.doc)} emitido
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => printTicket(done.doc as BillingDocument)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Imprimir recibo (80 mm)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSharing(true)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    Compartir por correo
                  </button>

                  <Link
                    href="/facturacion"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                  >
                    Ver en Facturación
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Listo
              </button>
            </div>

            {sharing && done.doc && (
              <ShareDocumentModal
                doc={done.doc}
                businessId={businessId}
                onClose={() => setSharing(false)}
              />
            )}
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">Cobrar</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {reservation.client} · {reservation.service}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Valor a cobrar
                <input
                  type="number"
                  min="0"
                  value={total}
                  onChange={(event) => changeTotal(event.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </label>

              <label className="text-sm font-medium">
                Forma de pago
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                  className={`${inputClass} mt-1`}
                >
                  {METHODS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {method !== "credit" && (
                <label className="text-sm font-medium">
                  Valor recibido
                  <input
                    type="number"
                    min="0"
                    value={received}
                    onChange={(event) => {
                      setTouched(true);
                      setReceived(event.target.value);
                    }}
                    className={`${inputClass} mt-1`}
                  />
                </label>
              )}

              <label className="text-sm font-medium">
                Documento
                <select
                  value={docKind}
                  onChange={(event) =>
                    setDocKind(event.target.value as "none" | "receipt" | "invoice")
                  }
                  className={`${inputClass} mt-1`}
                >
                  <option value="receipt">Recibo de caja</option>
                  <option value="invoice">Factura de venta</option>
                  <option value="none">Ninguno por ahora</option>
                </select>
              </label>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Se registra la venta, el ingreso en Finanzas y la visita del cliente. Si
              recibes menos del total, el resto queda como cuenta por cobrar.
            </p>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Cobrando..." : "Cobrar y registrar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
