"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuth } from "../lib/auth/AuthProvider";
import { canAccessPath } from "../lib/access";

// Páginas abiertas, sin menú lateral ni sesión obligatoria.
const PUBLIC_ROUTES = ["/", "/login", "/registro", "/recuperar", "/restablecer"];

// Páginas que exigen sesión pero se muestran sin menú.
const FOCUSED_ROUTES = ["/crear-negocio"];

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f5f6fc] p-6 text-slate-900 dark:bg-[#080d19] dark:text-slate-100">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm shadow-sm dark:border-white/10 dark:bg-[#111827]">
        {children}
      </div>
    </main>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    configured,
    ready,
    user,
    isMaster,
    memberships,
    activeMembership,
    blockedReason,
    accountError,
    dataReady,
    syncState,
    refresh,
    signOut,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isFocused = FOCUSED_ROUTES.includes(pathname);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (isPublic || !configured || !ready) return;

    // Si hubo un error al cargar la cuenta, se muestra el mensaje en pantalla
    // y no se redirige (así se evitan los rebotes entre páginas).
    if (accountError) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (pathname === "/master") {
      if (!isMaster) router.replace("/inicio");
      return;
    }

    if (memberships.length === 0) {
      if (isMaster) router.replace("/master");
      else if (!isFocused) router.replace("/crear-negocio");
      return;
    }

    if (
      !canAccessPath(
        activeMembership?.role,
        activeMembership?.business.enabled_modules,
        pathname,
      )
    ) {
      router.replace("/inicio");
    }
  }, [
    isPublic,
    isFocused,
    configured,
    ready,
    user,
    isMaster,
    memberships,
    activeMembership,
    accountError,
    pathname,
    router,
  ]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!configured) {
    return (
      <FullScreenMessage>
        <p className="font-bold">Falta configurar Supabase</p>
        <p className="mt-2 text-slate-500">
          Revisa que el archivo .env.local tenga NEXT_PUBLIC_SUPABASE_URL y
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, y reinicia la aplicación.
        </p>
      </FullScreenMessage>
    );
  }

  if (!ready || !user) {
    return <FullScreenMessage>Cargando tu espacio de trabajo...</FullScreenMessage>;
  }

  if (accountError) {
    return (
      <FullScreenMessage>
        <p className="font-bold">No pudimos cargar tu cuenta</p>
        <p className="mt-2 break-words text-slate-500">{accountError}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  if (isFocused) {
    return <>{children}</>;
  }

  if (blockedReason && pathname !== "/master") {
    return (
      <FullScreenMessage>
        <p className="font-bold">Acceso suspendido</p>
        <p className="mt-2 text-slate-500">{blockedReason}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          Cerrar sesión
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <div className="flex min-h-screen flex-1">
      {/* Menú fijo en pantallas grandes */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <Sidebar />
      </div>

      {/* Menú deslizable en celular y tableta */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:pl-72">
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0b1020]/90 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-700 dark:border-white/10 dark:text-slate-200"
          >
            ☰
          </button>
          <span className="text-sm font-extrabold tracking-[0.16em] text-slate-900 dark:text-white">
            STIAN
          </span>
        </div>

        <div key={activeMembership?.business.id ?? "sin-negocio"}>
          {dataReady || memberships.length === 0 ? (
            children
          ) : (
            <p className="p-10 text-sm text-slate-500 dark:text-slate-400">
              Cargando los datos de tu negocio...
            </p>
          )}
        </div>
      </div>

      {syncState.status === "saving" && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-[60] rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          Guardando...
        </div>
      )}

      {syncState.status === "error" && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl bg-red-600 p-4 text-sm text-white shadow-lg"
        >
          <p className="font-bold">No se pudieron guardar los cambios</p>
          <p className="mt-1 break-words text-white/90">{syncState.message}</p>
        </div>
      )}
    </div>
  );
}
