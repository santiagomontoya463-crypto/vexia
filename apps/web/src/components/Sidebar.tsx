"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, useAuth } from "../lib/auth/AuthProvider";
import { canAccessPath } from "../lib/access";
import { useIndustry } from "../lib/industry";

const menuSections = [
  {
    title: "Principal",
    items: [{ name: "Inicio", href: "/inicio", icon: "⌂" }],
  },
  {
    title: "Gestión",
    items: [
      { name: "Reservas", href: "/reservas", icon: "◷" },
      { name: "Clientes", href: "/clientes", icon: "◎" },
      { name: "Servicios", href: "/servicios", icon: "✳" },
      { name: "Productos", href: "/productos", icon: "◇" },
      { name: "Ventas", href: "/ventas", icon: "↗" },
      { name: "Facturación", href: "/facturacion", icon: "▤" },
      { name: "Finanzas", href: "/finanzas", icon: "$" },
      {
        name: "Cuentas por cobrar",
        href: "/finanzas/cuentas-por-cobrar",
        icon: "↗",
      },
      {
        name: "Cuentas por pagar",
        href: "/finanzas/cuentas-por-pagar",
        icon: "↙",
      },
      { name: "Trabajadores", href: "/trabajadores", icon: "♙" },
    ],
  },
  {
    title: "Negocio",
    items: [
      {
        name: "Solicitudes de compra",
        href: "/solicitudes-compra",
        icon: "🛒",
      },
      { name: "Proveedores", href: "/proveedores", icon: "▤" },
      { name: "Mi negocio", href: "/negocio", icon: "◇" },
    ],
  },
  {
    title: "Sistema",
    items: [{ name: "Configuración", href: "/configuracion", icon: "⚙" }],
  },
];

function StianLogo() {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#050B1D] shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-blue-600/10 to-violet-600/20"
      />

      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="relative h-11 w-11"
        role="img"
        aria-label="Símbolo geométrico de STIAN"
      >
        <defs>
          <linearGradient id="stianTop" x1="8" y1="15" x2="51" y2="7">
            <stop offset="0%" stopColor="#27D9FF" />
            <stop offset="48%" stopColor="#168BFF" />
            <stop offset="100%" stopColor="#8B5CFF" />
          </linearGradient>

          <linearGradient id="stianFront" x1="10" y1="20" x2="40" y2="39">
            <stop offset="0%" stopColor="#16CFFF" />
            <stop offset="100%" stopColor="#1264E8" />
          </linearGradient>

          <linearGradient id="stianSide" x1="25" y1="23" x2="52" y2="35">
            <stop offset="0%" stopColor="#526BFF" />
            <stop offset="100%" stopColor="#743DFF" />
          </linearGradient>

          <linearGradient id="stianMiddle" x1="10" y1="32" x2="53" y2="29">
            <stop offset="0%" stopColor="#20D8FF" />
            <stop offset="50%" stopColor="#178BFF" />
            <stop offset="100%" stopColor="#8A54FF" />
          </linearGradient>

          <linearGradient id="stianBottom" x1="13" y1="44" x2="48" y2="55">
            <stop offset="0%" stopColor="#168CFF" />
            <stop offset="55%" stopColor="#415BFF" />
            <stop offset="100%" stopColor="#A044FF" />
          </linearGradient>

          <filter id="stianGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* Resplandor sutil del símbolo */}
        <g opacity="0.35" filter="url(#stianGlow)">
          <path
            d="M12 17L52 3L40 20L12 34Z"
            fill="#168BFF"
          />
          <path
            d="M12 34L53 20L41 38L12 50Z"
            fill="#773FFF"
          />
          <path
            d="M12 50L40 37L53 42L24 62Z"
            fill="#168BFF"
          />
        </g>

        {/* Primera pieza diagonal */}
        <path
          d="M12 17L52 3L40 20L12 34Z"
          fill="url(#stianTop)"
        />
        <path
          d="M12 17L12 29L40 20L52 3Z"
          fill="url(#stianFront)"
        />
        <path
          d="M12 29L40 20L52 3L24 26Z"
          fill="#102D73"
          opacity="0.3"
        />

        {/* Segunda pieza diagonal */}
        <path
          d="M12 34L53 20L41 38L12 50Z"
          fill="url(#stianMiddle)"
        />
        <path
          d="M12 34L12 45L41 38L53 20Z"
          fill="url(#stianFront)"
        />
        <path
          d="M12 45L41 38L53 20L25 42Z"
          fill="#1A287F"
          opacity="0.32"
        />

        {/* Tercera pieza diagonal */}
        <path
          d="M12 50L40 37L53 42L24 62Z"
          fill="url(#stianBottom)"
        />
        <path
          d="M12 50L24 55L53 42L40 37Z"
          fill="url(#stianSide)"
        />
        <path
          d="M24 55L24 62L53 42L53 49Z"
          fill="#6F3DFA"
        />
      </svg>

      <span
        aria-hidden="true"
        className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_7px_rgba(103,232,249,0.9)]"
      />
    </span>
  );
}

function businessInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return letters || "MN";
}

export default function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const {
    user,
    isMaster,
    memberships,
    activeMembership,
    setActiveBusiness,
    signOut,
  } = useAuth();

  const industry = useIndustry();

  const labelByHref: Record<string, string> = {
    "/reservas": industry.reservations,
    "/clientes": industry.clients,
    "/servicios": industry.services,
    "/productos": industry.products,
    "/trabajadores": industry.workers,
  };

  const businessName = activeMembership?.business.name ?? "Mi negocio";
  const role = activeMembership?.role;
  const enabledModules = activeMembership?.business.enabled_modules;

  // Sin negocio (por ejemplo, el propietario de la plataforma) solo se muestra el panel Master.
  const baseSections: typeof menuSections =
    memberships.length === 0 ? [] : menuSections;

  const visibleSections = [
    ...baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          canAccessPath(role, enabledModules, item.href),
        ),
      }))
      .filter((section) => section.items.length > 0),
    ...(isMaster
      ? [
          {
            title: "Plataforma",
            items: [{ name: "Panel Master", href: "/master", icon: "★" }],
          },
        ]
      : []),
  ];

  const userLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Usuario STIAN";

  const userInitials = businessInitials(userLabel);
  const roleLabel = isMaster && !role ? "Propietario de la plataforma" : role ? ROLE_LABELS[role] : "";

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-r border-slate-200/80 bg-white text-slate-800 transition-colors dark:border-white/[0.08] dark:bg-[#0b1020] dark:text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-20 h-52 w-52 rounded-full bg-violet-500/[0.08] blur-3xl"
      />

      {/* Identidad STIAN */}
      <div className="relative border-b border-slate-200/80 px-5 py-6 dark:border-white/[0.08] sm:px-6">
        <Link
          href="/inicio"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="STIAN, ir al panel principal"
        >
          <StianLogo />

          <span className="min-w-0">
            <span className="block text-xl font-extrabold tracking-[0.16em] text-slate-950 dark:text-white">
              STIAN
            </span>
            <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
              Gestiona. Conecta. Crece.
            </span>
          </span>
        </Link>
      </div>

      {/* Negocio actual */}
      <div className="relative px-4 pt-5">
        <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50/70 p-4 dark:border-violet-400/20 dark:from-violet-500/[0.10] dark:via-white/[0.025] dark:to-cyan-500/[0.08]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            Espacio de trabajo
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white shadow-md shadow-violet-500/20">
              {businessInitials(businessName)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {businessName}
              </p>
              {memberships.length > 1 && (
                <select
                  value={activeMembership?.business.id}
                  onChange={(event) => setActiveBusiness(event.target.value)}
                  aria-label="Cambiar de negocio"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-transparent text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                >
                  {memberships.map((item) => (
                    <option key={item.business.id} value={item.business.id}>
                      {item.business.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cuenta activa
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav
        aria-label="Navegación principal"
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6"
      >
        <div className="space-y-6">
          {visibleSections.map((section) => (
            <section key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/inicio" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                        active
                          ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 text-white shadow-md shadow-violet-500/20"
                          : "text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-200"
                        />
                      )}

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-all ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100/90 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-700 dark:bg-white/[0.05] dark:text-slate-400 dark:group-hover:bg-violet-400/15 dark:group-hover:text-cyan-200"
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span className="min-w-0 flex-1 leading-5">
                        {labelByHref[item.href] ?? item.name}
                      </span>

                      {active && (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(165,243,252,0.8)]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      {/* Perfil */}
      <div className="relative border-t border-slate-200/80 p-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/[0.06] dark:bg-white/[0.025]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold text-white shadow-sm dark:from-violet-600 dark:to-indigo-600">
            {userInitials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {userLabel}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {roleLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}