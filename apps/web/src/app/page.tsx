"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth/AuthProvider";

export default function HomeRedirect() {
  const router = useRouter();
  const { ready, user, configured } = useAuth();

  useEffect(() => {
    if (!ready || !configured) return;

    router.replace(user ? "/inicio" : "/login");
  }, [ready, user, configured, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6fc] text-sm text-slate-500 dark:bg-[#080d19] dark:text-slate-400">
      Cargando STIAN...
    </main>
  );
}
