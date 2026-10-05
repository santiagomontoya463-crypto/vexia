"use client";

import { useState } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <main
      className={
        darkMode
          ? "min-h-screen bg-[#080b12] text-white transition-colors duration-300"
          : "min-h-screen bg-[#f5f7fb] text-[#111827] transition-colors duration-300"
      }
    >
      <div className="min-h-screen">

        {/* BARRA SUPERIOR */}
        <header
          className={
            darkMode
              ? "border-b border-white/10 bg-[#0d111a]"
              : "border-b border-slate-200 bg-white"
          }
        >
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg">
                <span className="text-xl font-bold">V</span>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  VEXIA
                </h1>

                <p
                  className={
                    darkMode
                      ? "text-xs text-slate-400"
                      : "text-xs text-slate-500"
                  }
                >
                  Gestiona. Conecta. Crece.
                </p>
              </div>
            </div>

            {/* CONTROLES */}
            <div className="flex items-center gap-3">

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={
                  darkMode
                    ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                }
              >
                {darkMode ? "☀️ Modo claro" : "🌙 Modo oscuro"}
              </button>

              <button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-slate-800">
                Iniciar sesión
              </button>

            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <section className="mx-auto max-w-7xl px-6 py-20">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* TEXTO */}
            <div>

              <div
                className={
                  darkMode
                    ? "mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
                    : "mb-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"
                }
              >
                Plataforma inteligente para negocios
              </div>

              <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
                Todo tu negocio.
                <br />
                <span className="text-slate-500">
                  En un solo lugar.
                </span>
              </h2>

              <p
                className={
                  darkMode
                    ? "mt-7 max-w-xl text-lg leading-8 text-slate-400"
                    : "mt-7 max-w-xl text-lg leading-8 text-slate-600"
                }
              >
                VEXIA reúne la gestión de servicios, clientes,
                reservas, trabajadores, productos, ventas y
                suscripciones en una sola plataforma.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">

                <button className="rounded-xl bg-slate-950 px-6 py-3.5 font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">
                  Comenzar con VEXIA
                </button>

                <button
                  className={
                    darkMode
                      ? "rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-white transition hover:bg-white/10"
                      : "rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-medium text-slate-800 transition hover:bg-slate-50"
                  }
                >
                  Conocer la plataforma
                </button>

              </div>

            </div>

            {/* PANEL VISUAL */}
            <div
              className={
                darkMode
                  ? "rounded-3xl border border-white/10 bg-[#0d111a] p-6 shadow-2xl"
                  : "rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
              }
            >

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p
                    className={
                      darkMode
                        ? "text-sm text-slate-400"
                        : "text-sm text-slate-500"
                    }
                  >
                    Vista general
                  </p>

                  <h3 className="mt-1 text-xl font-bold">
                    Panel VEXIA
                  </h3>
                </div>

                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  Sistema activo
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div
                  className={
                    darkMode
                      ? "rounded-2xl border border-white/10 bg-white/5 p-5"
                      : "rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  }
                >
                  <p className="text-sm text-slate-500">
                    Reservas
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    24
                  </p>

                  <p className="mt-2 text-xs text-emerald-600">
                    +12% esta semana
                  </p>
                </div>

                <div
                  className={
                    darkMode
                      ? "rounded-2xl border border-white/10 bg-white/5 p-5"
                      : "rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  }
                >
                  <p className="text-sm text-slate-500">
                    Clientes
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    186
                  </p>

                  <p className="mt-2 text-xs text-emerald-600">
                    +8 nuevos
                  </p>
                </div>

                <div
                  className={
                    darkMode
                      ? "rounded-2xl border border-white/10 bg-white/5 p-5"
                      : "rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  }
                >
                  <p className="text-sm text-slate-500">
                    Servicios
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    32
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Catálogo activo
                  </p>
                </div>

                <div
                  className={
                    darkMode
                      ? "rounded-2xl border border-white/10 bg-white/5 p-5"
                      : "rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  }
                >
                  <p className="text-sm text-slate-500">
                    Ventas
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    $2.8M
                  </p>

                  <p className="mt-2 text-xs text-emerald-600">
                    Este mes
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* MÓDULOS */}
        <section
          className={
            darkMode
              ? "border-t border-white/10 bg-[#0d111a]"
              : "border-t border-slate-200 bg-white"
          }
        >

          <div className="mx-auto max-w-7xl px-6 py-16">

            <div className="mb-10">
              <p className="text-sm font-medium text-slate-500">
                Ecosistema VEXIA
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                Una plataforma. Todos tus procesos.
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

              {[
                {
                  title: "Servicios",
                  description:
                    "Gestiona servicios, precios, disponibilidad y agenda.",
                },
                {
                  title: "Clientes",
                  description:
                    "Organiza clientes y su historial dentro de tu negocio.",
                },
                {
                  title: "Reservas",
                  description:
                    "Permite reservar, reprogramar y cancelar fácilmente.",
                },
                {
                  title: "Productos",
                  description:
                    "Administra catálogo, inventario, ventas y promociones.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={
                    darkMode
                      ? "rounded-2xl border border-white/10 bg-white/5 p-6"
                      : "rounded-2xl border border-slate-200 bg-slate-50 p-6"
                  }
                >
                  <h4 className="text-lg font-semibold">
                    {item.title}
                  </h4>

                  <p
                    className={
                      darkMode
                        ? "mt-3 text-sm leading-6 text-slate-400"
                        : "mt-3 text-sm leading-6 text-slate-600"
                    }
                  >
                    {item.description}
                  </p>
                </div>
              ))}

            </div>

          </div>

        </section>

        {/* PIE */}
        <footer
          className={
            darkMode
              ? "border-t border-white/10 bg-[#080b12]"
              : "border-t border-slate-200 bg-slate-50"
          }
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="font-bold">
                VEXIA
              </p>

              <p className="text-sm text-slate-500">
                Gestiona. Conecta. Crece.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Plataforma de gestión empresarial
            </p>

          </div>
        </footer>

      </div>
    </main>
  );
}