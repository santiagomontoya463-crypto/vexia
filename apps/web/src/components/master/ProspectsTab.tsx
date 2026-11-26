"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import BusinessTypePicker from "../BusinessTypePicker";
import type { CreatePrefill } from "./CreateBusinessModal";
import { cardClass, formatDate, ghostButton, inputClass, primaryButton, type Plan } from "./shared";

export type Prospect = {
  id: string;
  name: string;
  business_type: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  plan_id: string | null;
  status: "prospect" | "contacted" | "ready" | "enrolled" | "discarded";
  notes: string | null;
  expected_date: string | null;
  business_id: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<Prospect["status"], string> = {
  prospect: "Prospecto",
  contacted: "Contactado",
  ready: "Listo para inscribir",
  enrolled: "Inscrito",
  discarded: "Descartado",
};

const STATUS_STYLES: Record<Prospect["status"], string> = {
  prospect: "bg-slate-200 text-slate-700",
  contacted: "bg-sky-100 text-sky-800",
  ready: "bg-amber-100 text-amber-800",
  enrolled: "bg-emerald-100 text-emerald-800",
  discarded: "bg-rose-100 text-rose-800",
};

export default function ProspectsTab({
  prospects,
  missingTable,
  plans,
  onChanged,
  onEnroll,
  flash,
  setError,
}: {
  prospects: Prospect[];
  missingTable: boolean;
  plans: Plan[];
  onChanged: () => Promise<void>;
  onEnroll: (prefill: CreatePrefill) => void;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [editing, setEditing] = useState<Prospect | "new" | null>(null);
  const [filter, setFilter] = useState<"activos" | Prospect["status"]>("activos");

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");

  function open(target: Prospect | "new") {
    setEditing(target);

    const item = target === "new" ? null : target;

    setName(item?.name ?? "");
    setType(item?.business_type ?? "");
    setContactName(item?.contact_name ?? "");
    setContactPhone(item?.contact_phone ?? "");
    setContactEmail(item?.contact_email ?? "");
    setPlanId(item?.plan_id ?? "");
    setExpected(item?.expected_date ?? "");
    setNotes(item?.notes ?? "");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !editing) return;

    if (!name.trim()) {
      setError("Escribe el nombre de la cuenta.");
      return;
    }

    const values = {
      name: name.trim(),
      business_type: type || null,
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_email: contactEmail.trim().toLowerCase() || null,
      plan_id: planId || null,
      expected_date: expected || null,
      notes: notes.trim() || null,
    };

    const { error } =
      editing === "new"
        ? await supabase.from("business_prospects").insert(values)
        : await supabase.from("business_prospects").update(values).eq("id", editing.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    flash(editing === "new" ? "Cuenta agregada a la lista." : "Cuenta actualizada.");
    setEditing(null);
    await onChanged();
  }

  async function setStatus(prospect: Prospect, status: Prospect["status"]) {
    if (!supabase) return;

    const { error } = await supabase
      .from("business_prospects")
      .update({ status })
      .eq("id", prospect.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    await onChanged();
  }

  async function remove(prospect: Prospect) {
    if (!supabase || !window.confirm(`¿Quitar «${prospect.name}» de la lista?`)) return;

    const { error } = await supabase.from("business_prospects").delete().eq("id", prospect.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    await onChanged();
  }

  if (missingTable) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Falta ejecutar la migración <strong>0010_prospectos.sql</strong> en Supabase para usar esta
        lista.
      </p>
    );
  }

  const visible = prospects.filter((item) =>
    filter === "activos"
      ? item.status !== "enrolled" && item.status !== "discarded"
      : item.status === filter,
  );

  const filters: { id: typeof filter; label: string }[] = [
    { id: "activos", label: "Por inscribir" },
    { id: "ready", label: "Listas" },
    { id: "enrolled", label: "Inscritas" },
    { id: "discarded", label: "Descartadas" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Las cuentas que piensas inscribir. Cuando una esté lista, presiona «Inscribir» para crear
          la empresa y su acceso.
        </p>
        <button type="button" onClick={() => open("new")} className={primaryButton}>
          + Agregar cuenta
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === item.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 dark:border-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-slate-500">No hay cuentas en este grupo.</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visible.map((item) => (
          <article key={item.id} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-bold">{item.name}</h3>
                <p className="truncate text-xs text-slate-500">{item.business_type ?? "Sin tipo"}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            <dl className="mt-3 space-y-1 text-sm">
              {(item.contact_name || item.contact_phone) && (
                <div>
                  <dt className="inline text-xs text-slate-500">Contacto: </dt>
                  <dd className="inline">
                    {[item.contact_name, item.contact_phone].filter(Boolean).join(" · ")}
                  </dd>
                </div>
              )}
              {item.contact_email && (
                <div>
                  <dt className="inline text-xs text-slate-500">Correo: </dt>
                  <dd className="inline break-all">{item.contact_email}</dd>
                </div>
              )}
              {item.plan_id && (
                <div>
                  <dt className="inline text-xs text-slate-500">Plan: </dt>
                  <dd className="inline">{plans.find((plan) => plan.id === item.plan_id)?.name ?? "—"}</dd>
                </div>
              )}
              {item.expected_date && (
                <div>
                  <dt className="inline text-xs text-slate-500">Inscribir el: </dt>
                  <dd className="inline">{formatDate(item.expected_date)}</dd>
                </div>
              )}
            </dl>

            {item.notes && <p className="mt-2 text-xs text-slate-500">{item.notes}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {item.status !== "enrolled" && (
                <button
                  type="button"
                  onClick={() =>
                    onEnroll({
                      name: item.name,
                      businessType: item.business_type ?? undefined,
                      phone: item.contact_phone ?? undefined,
                      ownerName: item.contact_name ?? undefined,
                      ownerEmail: item.contact_email ?? undefined,
                      planId: item.plan_id ?? undefined,
                      prospectId: item.id,
                    })
                  }
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Inscribir
                </button>
              )}

              {item.status !== "enrolled" && (
                <select
                  value={item.status}
                  onChange={(event) => void setStatus(item, event.target.value as Prospect["status"])}
                  aria-label="Estado"
                  className="rounded-lg border border-slate-200 bg-transparent px-2 py-2 text-xs dark:border-white/10"
                >
                  <option value="prospect">Prospecto</option>
                  <option value="contacted">Contactado</option>
                  <option value="ready">Listo para inscribir</option>
                  <option value="discarded">Descartado</option>
                </select>
              )}

              <button type="button" onClick={() => open(item)} className={ghostButton}>
                Editar
              </button>
              <button type="button" onClick={() => void remove(item)} className={ghostButton}>
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={save}
            onClick={(event) => event.stopPropagation()}
            noValidate
            className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
          >
            <h2 className="text-lg font-bold">
              {editing === "new" ? "Agregar cuenta por inscribir" : "Editar cuenta"}
            </h2>

            <label className="block text-sm font-medium">
              Nombre de la empresa
              <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} mt-1`} />
            </label>

            <div>
              <p className="text-sm font-medium">Tipo de negocio</p>
              <div className="mt-1">
                <BusinessTypePicker value={type} onChange={setType} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Persona de contacto
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-sm font-medium">
                Teléfono
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-sm font-medium">
                Correo
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
              <label className="text-sm font-medium">
                Plan previsto
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={`${inputClass} mt-1`}>
                  <option value="">Sin definir</option>
                  {plans.filter((plan) => plan.active).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Fecha prevista
                <input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className={`${inputClass} mt-1`} />
              </label>
            </div>

            <label className="block text-sm font-medium">
              Notas
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} mt-1`} />
            </label>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10">
                Cancelar
              </button>
              <button type="submit" className={primaryButton}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
