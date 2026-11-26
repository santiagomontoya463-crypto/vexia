/** Pide al servidor enviar un recordatorio de cobro o un comprobante. */
export async function sendNotification(
  type: "reminder" | "receipt",
  businessId: string,
  paymentId?: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch("/api/master/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, businessId, paymentId }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      to?: string;
      code?: string;
      error?: string;
    };

    if (response.ok && body.ok) {
      return { ok: true, message: `Correo enviado a ${body.to}.` };
    }

    if (body.code === "not_configured") {
      return {
        ok: false,
        message:
          "El envío de correos no está configurado (falta el servicio de correo en .env.local).",
      };
    }

    return { ok: false, message: body.error ?? "No fue posible enviar el correo." };
  } catch {
    return { ok: false, message: "No hay conexión con el servidor." };
  }
}

export function whatsappLink(phone: string | null, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");

  if (digits.length < 7) return null;

  const full = digits.length === 10 ? `57${digits}` : digits;

  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
