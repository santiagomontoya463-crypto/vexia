/**
 * Envío de correos desde el servidor. Funciona con Resend o con Brevo, según
 * la clave que esté configurada (variables de entorno del servidor):
 *
 *   EMAIL_FROM       dirección remitente verificada en el proveedor
 *   RESEND_API_KEY   clave de Resend      (opción 1)
 *   BREVO_API_KEY    clave de Brevo       (opción 2, permite verificar solo un
 *                    correo remitente, sin necesidad de un dominio propio)
 */

export type MailInput = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  /** Nombre que ve quien recibe el correo (por ejemplo, el nombre del negocio). */
  fromName: string;
  replyTo?: string;
};

export type MailResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "failed"; error: string };

function parseSender(value: string): { name?: string; email: string } {
  const match = value.match(/^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/);

  if (match) return { name: match[1]?.trim() || undefined, email: match[2].trim() };

  return { email: value.trim() };
}

function safeName(value: string): string {
  return value.replace(/[<>",;\r\n]/g, "").trim().slice(0, 60) || "STIAN";
}

export function mailerConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_FROM &&
      (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY),
  );
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  if (!mailerConfigured()) {
    return {
      ok: false,
      code: "not_configured",
      error: "El envío de correos no está configurado.",
    };
  }

  const sender = parseSender(process.env.EMAIL_FROM as string);
  const name = safeName(input.fromName);

  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${name} <${sender.email}>`,
          to: input.to,
          reply_to: input.replyTo,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 300);

        return {
          ok: false,
          code: "failed",
          error: `El servicio de correo rechazó el envío. ${detail}`.trim(),
        };
      }

      return { ok: true };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY as string,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name, email: sender.email },
        to: input.to.map((email) => ({ email })),
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      }),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);

      return {
        ok: false,
        code: "failed",
        error: `El servicio de correo rechazó el envío. ${detail}`.trim(),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      code: "failed",
      error: "No fue posible conectar con el servicio de correo.",
    };
  }
}
