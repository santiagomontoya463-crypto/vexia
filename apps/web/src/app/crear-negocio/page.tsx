"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthProvider";
import BusinessTypePicker from "../../components/BusinessTypePicker";
import AuthCard, {
  authButtonClass,
  authInputClass,
} from "../../components/auth/AuthCard";

export default function CreateBusinessPage() {
  const router = useRouter();
  const { supabase, user, refresh, setActiveBusiness, signOut } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Falta configurar la conexión con Supabase.");
      return;
    }

    if (!name.trim()) {
      setError("Escribe el nombre de tu negocio.");
      return;
    }

    if (!type.trim()) {
      setError("Elige el tipo de negocio. Si no aparece, escríbelo en el buscador.");
      return;
    }

    setBusy(true);

    const { data, error: rpcError } = await supabase.rpc("create_business", {
      p_name: name.trim(),
      p_business_type: type,
      p_document_number: documentNumber.trim() || null,
      p_country_code: "CO",
      p_currency: "COP",
      p_email: email.trim() || null,
      p_phone: phone.trim() || null,
      p_address: address.trim() || null,
    });

    if (rpcError || !data) {
      setBusy(false);
      setError(
        rpcError?.message ?? "No fue posible crear el negocio. Inténtalo de nuevo.",
      );
      return;
    }

    await refresh();
    setActiveBusiness(String(data));
    setBusy(false);
    router.replace("/inicio");
  }

  return (
    <AuthCard
      title="Crea tu negocio"
      subtitle="Será tu espacio de trabajo. Podrás cambiar estos datos después."
      footer={
        <button
          type="button"
          onClick={() => void signOut()}
          className="font-semibold text-violet-600 hover:underline dark:text-violet-300"
        >
          Cerrar sesión
        </button>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block text-sm font-medium">
          Nombre del negocio
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

        <div className="block text-sm font-medium">
          Tipo de negocio
          <span className="mt-0.5 block text-xs font-normal text-slate-500">
            STIAN adapta los nombres (citas, órdenes de servicio, pacientes,
            técnicos…) a tu tipo de negocio.
          </span>
          <div className="mt-1">
            <BusinessTypePicker value={type} onChange={setType} />
          </div>
        </div>

        <label className="block text-sm font-medium">
          NIT o documento (opcional)
          <input
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Teléfono
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${authInputClass} mt-1`}
            />
          </label>

          <label className="block text-sm font-medium">
            Correo del negocio
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${authInputClass} mt-1`}
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Dirección
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={`${authInputClass} mt-1`}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? "Creando..." : "Crear negocio"}
        </button>
      </form>
    </AuthCard>
  );
}
