"use client";

import { useEffect, useState } from "react";
import { getActiveBusiness, saveBusiness, setActiveBusinessId } from "../../lib/business";
import { getBusinessOperations, saveBusinessOperations } from "../../lib/business/operations";
import { useNotifications } from "../../components/notifications/NotificationProvider";
export default function BusinessPage() {
  const { success, error } = useNotifications();
  const [saved, setSaved] = useState(false);
  const [business, setBusiness] = useState<ReturnType<typeof getActiveBusiness>>();
  const [operations, setOperations] = useState<ReturnType<typeof getBusinessOperations>>();

  useEffect(() => {
    const active = getActiveBusiness();
    setBusiness(active);
    if (active) setOperations(getBusinessOperations(active.id));
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const existing = getActiveBusiness();
      const now = new Date().toISOString();

      const business = saveBusiness({
        id: existing?.id ?? `business-${Date.now()}`,
        name: String(data.get("name") ?? "").trim(),
        type: String(data.get("type") ?? "Servicios"),
        description: String(data.get("description") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        address: String(data.get("address") ?? "").trim(),
        countryCode: existing?.countryCode ?? "CO",
        currency: existing?.currency ?? "COP",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });

      setActiveBusinessId(business.id);

      const hours: Record<string, { enabled: boolean; open: string; close: string }> = {};
      for (const day of ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]) {
        hours[day] = {
          enabled: data.get(`hours.${day}.enabled`) === "on",
          open: String(data.get(`hours.${day}.open`) ?? "08:00"),
          close: String(data.get(`hours.${day}.close`) ?? "18:00"),
        };
      }

      const nextOperations = {
        businessId: business.id,
        social: {
          instagram: String(data.get("instagram") ?? "").trim(),
          facebook: String(data.get("facebook") ?? "").trim(),
          tiktok: String(data.get("tiktok") ?? "").trim(),
          whatsapp: String(data.get("whatsapp") ?? "").trim(),
          website: String(data.get("website") ?? "").trim(),
        },
        hours,
        cancellationHours: Number(data.get("cancellationHours") ?? 3),
        rescheduleHours: Number(data.get("rescheduleHours") ?? 3),
        sundayBookings: data.get("sundayBookings") === "on",
        appointmentReminders: data.get("appointmentReminders") === "on",
        updatedAt: now,
      };

      saveBusinessOperations(nextOperations);
      setOperations(nextOperations);
      setBusiness(business);
      setSaved(true);
      success("La información de tu negocio se guardó correctamente.");
      window.setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible guardar los datos del negocio."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-slate-500">
            Configuración del negocio
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Mi negocio
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Administra la información que tus clientes podrán consultar
            desde el perfil público de tu negocio.
          </p>
        </div>

        {saved && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Los cambios fueron guardados correctamente.
          </div>
        )}

        <form key={business?.id ?? "new-business"} onSubmit={handleSubmit} className="space-y-6">

          {/* INFORMACIÓN GENERAL */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Información general
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Información básica de tu negocio.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nombre del negocio
                </label>

                <input
                  type="text"
                  name="name"
                  defaultValue={business?.name ?? "Mi negocio"}
                  placeholder="Ej. VEXIA Studio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo de negocio
                </label>

                <select
                  name="type"
                  defaultValue={business?.type ?? "Servicios"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  <option>Servicios</option>
                  <option>Productos</option>
                  <option>Servicios y productos</option>
                  <option>Barbería</option>
                  <option>Spa</option>
                  <option>Clínica</option>
                  <option>Taller</option>
                  <option>Servicio técnico</option>
                  <option>Otro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descripción
                </label>

                <textarea
                  name="description"
                  defaultValue={business?.description ?? ""}
                  rows={4}
                  placeholder="Describe brevemente tu negocio..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

            </div>

          </section>

          {/* INFORMACIÓN DE CONTACTO */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Información de contacto
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Datos que tus clientes podrán utilizar para comunicarse.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Teléfono
                </label>

                <input
                  type="tel"
                  name="phone"
                  defaultValue={business?.phone ?? ""}
                  placeholder="300 000 0000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  name="email"
                  defaultValue={business?.email ?? ""}
                  placeholder="contacto@negocio.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Dirección
                </label>

                <input
                  type="text"
                  name="address"
                  defaultValue={business?.address ?? ""}
                  placeholder="Dirección del negocio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

            </div>

          </section>

          {/* REDES SOCIALES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Redes sociales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Agrega los perfiles que quieres mostrar a tus clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Instagram
                </label>

                <input
                  type="text"
                  name="instagram"
                  defaultValue={operations?.social.instagram ?? ""}
                  placeholder="@tunegocio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Facebook
                </label>

                <input
                  type="text"
                  name="facebook"
                  defaultValue={operations?.social.facebook ?? ""}
                  placeholder="facebook.com/tunegocio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  TikTok
                </label>

                <input
                  type="text"
                  name="tiktok"
                  defaultValue={operations?.social.tiktok ?? ""}
                  placeholder="@tunegocio"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  WhatsApp
                </label>

                <input
                  type="tel"
                  name="whatsapp"
                  defaultValue={operations?.social.whatsapp ?? ""}
                  placeholder="300 000 0000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sitio web
                </label>

                <input
                  type="url"
                  name="website"
                  defaultValue={operations?.social.website ?? ""}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

            </div>

          </section>

          {/* HORARIOS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Horarios de atención
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define cuándo está disponible tu negocio para recibir clientes.
              </p>
            </div>

            <div className="space-y-4">

              {[
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo",
              ].map((day) => (
                <div
                  key={day}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      name={`hours.${day}.enabled`}
                      defaultChecked={operations?.hours?.[day]?.enabled ?? day !== "Domingo"}
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    <span className="text-sm font-medium text-slate-800">
                      {day}
                    </span>

                  </div>

                  <div className="flex items-center gap-3">

                    <input
                      type="time"
                      name={`hours.${day}.open`}
                      defaultValue={operations?.hours?.[day]?.open ?? "08:00"}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />

                    <span className="text-sm text-slate-400">
                      a
                    </span>

                    <input
                      type="time"
                      name={`hours.${day}.close`}
                      defaultValue={operations?.hours?.[day]?.close ?? "18:00"}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* RESERVAS Y CANCELACIONES */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Reservas y cancelaciones
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define las condiciones para que tus clientes puedan gestionar sus reservas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tiempo mínimo para cancelar
                </label>

                <select
                  name="cancellationHours"
                  defaultValue={String(operations?.cancellationHours ?? 3)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="3">3 horas</option>
                  <option value="6">6 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tiempo mínimo para reprogramar
                </label>

                <select
                  name="rescheduleHours"
                  defaultValue={String(operations?.rescheduleHours ?? 3)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="3">3 horas</option>
                  <option value="6">6 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
                <input
                  type="checkbox"
                  name="sundayBookings"
                  defaultChecked={operations?.sundayBookings ?? true}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span className="text-sm text-slate-700">
                  Permitir reservas los domingos
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-100 p-4">
                <input
                  type="checkbox"
                  name="appointmentReminders"
                  defaultChecked={operations?.appointmentReminders ?? true}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span className="text-sm text-slate-700">
                  Enviar recordatorio antes de la cita
                </span>
              </label>

            </div>

          </section>

          {/* GUARDAR */}

          <div className="flex justify-end pb-8">

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Guardar cambios
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}
