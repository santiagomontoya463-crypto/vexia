"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "../supabase/client";
import { getBusiness, saveBusiness, setActiveBusinessId } from "../business";
import {
  startSync,
  stopSync,
  subscribeSync,
  type SyncStatus,
} from "../sync/cloud-sync";

export type BusinessRole = "owner" | "manager" | "admin" | "worker";
export type BusinessStatus = "trial" | "active" | "suspended" | "cancelled";

export type BusinessSummary = {
  id: string;
  name: string;
  business_type: string | null;
  status: BusinessStatus;
  suspended_reason: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  enabled_modules: string[];
  currency: string;
};

export type Membership = {
  role: BusinessRole;
  business: BusinessSummary;
};

export type SyncState = {
  status: SyncStatus;
  message: string | null;
};

type AuthContextValue = {
  supabase: SupabaseClient | null;
  configured: boolean;
  user: User | null;
  ready: boolean;
  dataReady: boolean;
  isMaster: boolean;
  memberships: Membership[];
  activeMembership: Membership | null;
  blockedReason: string | null;
  accountError: string | null;
  syncState: SyncState;
  setActiveBusiness: (businessId: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ACTIVE_KEY = "stian:auth-active-business";

export const ROLE_LABELS: Record<BusinessRole, string> = {
  owner: "Propietario",
  manager: "Gerente",
  admin: "Administrador",
  worker: "Trabajador",
};

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}

function getBlockedReason(business: BusinessSummary | undefined): string | null {
  if (!business) return null;

  const now = Date.now();

  if (business.status === "suspended") {
    return business.suspended_reason
      ? `Esta empresa está suspendida: ${business.suspended_reason}`
      : "Esta empresa está suspendida. Comunícate con soporte para reactivarla.";
  }

  if (business.status === "cancelled") {
    return "La suscripción de esta empresa fue cancelada.";
  }

  if (
    business.status === "trial" &&
    business.trial_ends_at &&
    new Date(business.trial_ends_at).getTime() < now
  ) {
    return "Tu prueba gratuita terminó. Activa un plan para seguir usando STIAN.";
  }

  if (
    business.status === "active" &&
    business.subscription_ends_at &&
    new Date(business.subscription_ends_at).getTime() < now
  ) {
    return "Tu suscripción venció. Renueva tu plan para seguir usando STIAN.";
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const supabase = useMemo<SupabaseClient | null>(() => {
    if (!configured) return null;

    try {
      return createClient();
    } catch {
      return null;
    }
  }, [configured]);

  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    message: null,
  });
  const userIdRef = useRef<string | null>(null);

  const loadAccount = useCallback(
    async (currentUser: User | null) => {
      if (!supabase || !currentUser) {
        setMemberships([]);
        setIsMaster(false);
        setAccountError(null);
        return;
      }

      const [memberResult, adminResult] = await Promise.all([
        supabase
          .from("business_members")
          .select(
            "role, business:businesses(id, name, business_type, status, suspended_reason, trial_ends_at, subscription_ends_at, enabled_modules, currency)",
          )
          .eq("user_id", currentUser.id)
          .eq("status", "active"),
        supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", currentUser.id)
          .maybeSingle(),
      ]);

      if (memberResult.error) {
        setAccountError(
          `No se pudieron cargar tus empresas: ${memberResult.error.message}`,
        );
      } else if (adminResult.error) {
        setAccountError(
          `No se pudo comprobar tu rol de administrador: ${adminResult.error.message}`,
        );
      } else {
        setAccountError(null);
      }

      const rows = (memberResult.data ?? []) as unknown as {
        role: BusinessRole;
        business: BusinessSummary | BusinessSummary[] | null;
      }[];

      const parsed: Membership[] = [];

      for (const row of rows) {
        const business = Array.isArray(row.business)
          ? row.business[0]
          : row.business;

        if (business) parsed.push({ role: row.role, business });
      }

      setMemberships(parsed);
      setIsMaster(Boolean(adminResult.data));
    },
    [supabase],
  );

  useEffect(() => subscribeSync((status, message) => setSyncState({ status, message })), []);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;

    try {
      setActiveId(window.localStorage.getItem(ACTIVE_KEY));
    } catch {
      // El navegador no permite leer el almacenamiento local.
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;

      if (cancelled) return;

      userIdRef.current = currentUser?.id ?? null;
      setUser(currentUser);
      await loadAccount(currentUser);

      if (!cancelled) setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        const nextId = currentUser?.id ?? null;

        if (event === "INITIAL_SESSION") return;

        // Renovaciones de sesión y regresos a la pestaña: no se recarga nada.
        if (nextId !== null && nextId === userIdRef.current) {
          setUser(currentUser);
          return;
        }

        userIdRef.current = nextId;
        setUser(currentUser);
        setReady(false);

        // Se aplaza para no hacer consultas dentro del propio evento de sesión.
        setTimeout(() => {
          void loadAccount(currentUser).then(() => setReady(true));
        }, 0);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase, loadAccount]);

  const activeMembership = useMemo<Membership | null>(() => {
    if (memberships.length === 0) return null;

    return (
      memberships.find((item) => item.business.id === activeId) ??
      memberships[0]
    );
  }, [memberships, activeId]);

  const userId = user?.id ?? null;
  const activeBusinessId = activeMembership?.business.id ?? null;

  // Descarga los datos de la empresa activa y sincroniza sus cambios.
  useEffect(() => {
    if (!supabase || !ready) return;

    let cancelled = false;

    if (!userId) {
      void stopSync({ clearLocal: true });
      setDataReady(true);
      return;
    }

    if (!activeBusinessId) {
      void stopSync({ clearLocal: true });
      setDataReady(true);
      return;
    }

    setDataReady(false);

    startSync(supabase, activeBusinessId)
      .catch((error: unknown) => {
        if (cancelled) return;

        setAccountError(
          `No se pudieron cargar los datos de tu negocio: ${
            error instanceof Error ? error.message : "error desconocido"
          }`,
        );
      })
      .finally(() => {
        if (!cancelled) setDataReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, ready, userId, activeBusinessId]);

  // Mientras algunos módulos usan el perfil local del negocio, se deja
  // registrada la empresa activa también allí (después de cargar los datos).
  useEffect(() => {
    const business = activeMembership?.business;

    if (!business || !dataReady) return;

    try {
      if (!getBusiness(business.id)) {
        const now = new Date().toISOString();

        saveBusiness({
          id: business.id,
          name: business.name,
          type: "general",
          countryCode: "CO",
          currency: business.currency || "COP",
          createdAt: now,
          updatedAt: now,
        });
      }

      setActiveBusinessId(business.id);
    } catch {
      // Si falla el almacenamiento local, la sesión sigue funcionando.
    }
  }, [activeMembership, dataReady]);

  const setActiveBusiness = useCallback((businessId: string) => {
    setActiveId(businessId);

    try {
      window.localStorage.setItem(ACTIVE_KEY, businessId);
    } catch {
      // Sin almacenamiento local no se recuerda la elección.
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadAccount(user);
  }, [loadAccount, user]);

  const signOut = useCallback(async () => {
    await stopSync({ clearLocal: true });

    if (supabase) await supabase.auth.signOut();
  }, [supabase]);

  const blockedReason = isMaster
    ? null
    : getBlockedReason(activeMembership?.business);

  const value: AuthContextValue = {
    supabase,
    configured: configured && supabase !== null,
    user,
    ready,
    dataReady,
    isMaster,
    memberships,
    activeMembership,
    blockedReason,
    accountError,
    syncState,
    setActiveBusiness,
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
