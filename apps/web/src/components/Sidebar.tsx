"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuSections = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "⌂",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        name: "Reservas",
        href: "/reservas",
        icon: "▣",
      },
      {
        name: "Clientes",
        href: "/clientes",
        icon: "◉",
      },
      {
        name: "Servicios",
        href: "/servicios",
        icon: "✦",
      },
      {
        name: "Productos",
        href: "/productos",
        icon: "□",
      },
      {
        name: "Ventas",
        href: "/ventas",
        icon: "$",
      },
      {
        name: "Trabajadores",
        href: "/trabajadores",
        icon: "♙",
      },
    ],
  },
  {
    title: "Negocio",
    items: [
      {
        name: "Mi negocio",
        href: "/negocio",
        icon: "◇",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        name: "Configuración",
        href: "/configuracion",
        icon: "⚙",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white">

      {/* IDENTIDAD VEXIA */}
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            <span className="text-xl font-bold">
              V
            </span>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              VEXIA
            </h1>

            <p className="text-xs text-slate-500">
              Gestiona. Conecta. Crece.
            </p>
          </div>

        </Link>
      </div>

      {/* NEGOCIO ACTUAL */}
      <div className="px-4 pt-5">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Negocio actual
          </p>

          <div className="mt-2 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-semibold text-slate-700 shadow-sm">
              MN
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Mi negocio
              </p>

              <p className="text-xs text-emerald-600">
                Cuenta activa
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">

        <div className="space-y-7">

          {menuSections.map((section) => (

            <div key={section.title}>

              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">

                {section.items.map((item) => {

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >

                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                          active
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:text-slate-900"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span>
                        {item.name}
                      </span>

                    </Link>
                  );
                })}

              </div>

            </div>

          ))}

        </div>

      </nav>

      {/* PERFIL */}
      <div className="border-t border-slate-200 p-4">

        <div className="flex items-center gap-3 rounded-xl p-2">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            SM
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              Usuario VEXIA
            </p>

            <p className="truncate text-xs text-slate-500">
              Propietario
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Opciones de usuario"
          >
            ⋮
          </button>

        </div>

      </div>

    </aside>
  );
}