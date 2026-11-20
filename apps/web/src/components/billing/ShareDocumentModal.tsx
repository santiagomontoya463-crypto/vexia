"use client";

import { useState, type FormEvent } from "react";
import type { BillingDocument } from "../../lib/billing";
import {
  buildSummaryText,
  documentNumber,
  documentTypeLabel,
  formatMoney,
} from "../../lib/billing/print";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

export default function ShareDocumentModal({
  doc,
  businessId,
  onClose,
}: {
  doc: BillingDocument;
  businessId: string;
  onClose: () => void;
}) {
  const isReceived = doc.type === "received_invoice";
  const other = isReceived
    ? doc.supplierSnapshot ?? doc.issuerSnapshot
    : doc.customerSnapshot;
  const business = isReceived ? doc.customerSnapshot : doc.issuerSnapshot;

  const [to, setTo] = useState(other?.email ?? "");
  const [message, setMessage] = useState(
    `Hola${other?.name ? ` ${other.name}` : ""}, te compartimos ${documentTypeLabel(doc.type).toLowerCase()} ${documentNumber(doc)} por ${formatMoney(doc.total, doc.currency)}. Gracias por tu confianza.`,
  );
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const subject = `${documentTypeLabel(doc.type)} ${documentNumber(doc)}${business?.name ? ` · ${business.name}` : ""}`;
  const summary = buildSummaryText(doc, message);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");

    const recipients = to
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      setError("Escribe al menos un correo.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/billing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          to: recipients,
          message,
          document: {
            id: doc.id,
            type: doc.type,
            status: doc.status,
            series: doc.series,
            number: doc.number,
            issueDate: doc.issueDate,
            dueDate: doc.dueDate,
            currency: doc.currency,
            issuer: doc.issuerSnapshot,
            customer: doc.customerSnapshot,
            supplier: doc.supplierSnapshot,
            items: doc.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxAmount: item.taxAmount,
              total: item.total,
            })),
            subtotal: doc.subtotal,
            discount: doc.discount,
            tax: doc.tax,
            total: doc.total,
            notes: doc.notes,
          },
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        code?: string;
      };

      if (response.ok && body.ok) {
        setInfo(`Enviado a ${recipients.join(", ")}.`);
      } else if (body.code === "not_configured") {
        setError(
          "El envío automático todavía no está configurado en esta instalación. Usa «Abrir en mi correo» o «Copiar texto».",
        );
      } else {
        setError(body.error ?? "No fue posible enviar el correo.");
      }
    } catch {
      setError("No hay conexión con el servidor. Inténtalo de nuevo.");
    }

    setBusy(false);
  }

  function openMailClient() {
    const address = to.split(/[,;\s]+/).filter(Boolean).join(",");
    const link = `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;

    window.location.href = link;
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: subject, text: summary });
    } catch {
      // La persona canceló el cuadro de compartir.
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${summary}`);
      setInfo("Texto copiado. Ya puedes pegarlo donde quieras.");
      setError("");
    } catch {
      setError("No se pudo copiar. Selecciona el texto manualmente.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={send}
        onClick={(event) => event.stopPropagation()}
        noValidate
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
      >
        <div>
          <h2 className="text-lg font-bold">Compartir documento</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {documentTypeLabel(doc.type)} {documentNumber(doc)} ·{" "}
            {formatMoney(doc.total, doc.currency)}
          </p>
        </div>

        <label className="block text-sm font-medium">
          Enviar a (separa varios con coma)
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="cliente@correo.com"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm font-medium">
          Mensaje
          <textarea
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {info && (
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            {info}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Enviando..." : "Enviar por correo"}
          </button>

          <button
            type="button"
            onClick={openMailClient}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
          >
            Abrir en mi correo
          </button>

          {canShare && (
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
            >
              Compartir…
            </button>
          )}

          <button
            type="button"
            onClick={() => void copyText()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
          >
            Copiar texto
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}
