function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ROLE_TEXT: Record<string, string> = {
  owner: "propietario",
  admin: "administrador",
  manager: "gerente",
  worker: "trabajador",
};

function layout(businessName: string, body: string): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
    <p style="margin:0 0 18px;font-size:20px;font-weight:bold">${esc(businessName)}</p>
    ${body}
    <p style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
      Mensaje enviado desde STIAN en nombre de ${esc(businessName)}.
    </p>
  </div>
</body></html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${esc(url)}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

export function welcomeEmail(input: {
  businessName: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  loginUrl: string;
}) {
  const role = ROLE_TEXT[input.role] ?? input.role;

  const html = layout(
    input.businessName,
    `<p>Hola ${esc(input.fullName)},</p>
     <p>Ya tienes acceso a <strong>${esc(input.businessName)}</strong> en STIAN como <strong>${esc(role)}</strong>.</p>
     <table style="margin:16px 0;font-size:15px">
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Usuario (correo)</td><td><strong>${esc(input.email)}</strong></td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Contraseña temporal</td><td><strong style="font-family:monospace;font-size:17px;letter-spacing:1px">${esc(input.password)}</strong></td></tr>
     </table>
     ${button(input.loginUrl, "Entrar a STIAN")}
     <p style="color:#6b7280;font-size:13px">Al entrar por primera vez te pediremos crear tu propia contraseña. Si no esperabas este correo, ignóralo.</p>`,
  );

  const text = `Hola ${input.fullName},

Ya tienes acceso a ${input.businessName} en STIAN como ${role}.

Entra en: ${input.loginUrl}
Usuario (correo): ${input.email}
Contraseña temporal: ${input.password}

Al entrar por primera vez te pediremos crear tu propia contraseña.`;

  return { subject: `Tu acceso a ${input.businessName}`, html, text };
}

export function resetEmail(input: {
  businessName: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const html = layout(
    input.businessName,
    `<p>Se generó una contraseña temporal nueva para tu acceso a <strong>${esc(input.businessName)}</strong>.</p>
     <table style="margin:16px 0;font-size:15px">
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Usuario (correo)</td><td><strong>${esc(input.email)}</strong></td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Contraseña temporal</td><td><strong style="font-family:monospace;font-size:17px;letter-spacing:1px">${esc(input.password)}</strong></td></tr>
     </table>
     ${button(input.loginUrl, "Entrar a STIAN")}
     <p style="color:#6b7280;font-size:13px">Al entrar te pediremos crear una contraseña nueva.</p>`,
  );

  const text = `Se generó una contraseña temporal nueva para tu acceso a ${input.businessName}.

Entra en: ${input.loginUrl}
Usuario (correo): ${input.email}
Contraseña temporal: ${input.password}

Al entrar te pediremos crear una contraseña nueva.`;

  return { subject: `Nueva contraseña temporal · ${input.businessName}`, html, text };
}

export function invitationEmail(input: {
  businessName: string;
  email: string;
  role: string;
  signupUrl: string;
  loginUrl: string;
}) {
  const role = ROLE_TEXT[input.role] ?? input.role;

  const html = layout(
    input.businessName,
    `<p>Te invitaron a <strong>${esc(input.businessName)}</strong> en STIAN como <strong>${esc(role)}</strong>.</p>
     <p>Crea tu cuenta con este mismo correo (<strong>${esc(input.email)}</strong>) y acepta la invitación al entrar.</p>
     ${button(input.signupUrl, "Crear mi cuenta")}
     <p style="color:#6b7280;font-size:13px">Si ya tienes cuenta en STIAN, inicia sesión en ${esc(input.loginUrl)} y verás la invitación arriba.</p>`,
  );

  const text = `Te invitaron a ${input.businessName} en STIAN como ${role}.

Crea tu cuenta con este mismo correo (${input.email}) y acepta la invitación al entrar:
${input.signupUrl}

Si ya tienes cuenta, inicia sesión en ${input.loginUrl} y verás la invitación.`;

  return { subject: `Invitación a ${input.businessName}`, html, text };
}
