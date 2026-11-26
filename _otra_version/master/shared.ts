import type { BusinessStatus } from "../../lib/auth/AuthProvider";

export type MasterBusiness = {
  id: string;
  name: string;
  business_type: string | null;
  status: BusinessStatus;
  suspended_reason: string | null;
  plan_id: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  enabled_modules: string[];
  created_at: string;
  owner_email: string | null;
  members_count: number;
  last_activity: string | null;
  payments_total: number;
  currency: string;
};

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  currency: string;
  modules: string[];
  max_users: number | null;
  active: boolean;
  sort_order: number;
};

export type Overview = {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  cancelled: number;
  trials_expiring: number;
  trials_expired: number;
  subs_expiring: number;
  subs_expired: number;
  users: number;
  mrr: number;
  revenue_month: number;
  revenue_total: number;
};

export type Metrics = {
  growth: { month: string; businesses: number; revenue: number }[];
  by_type: { type: string; count: number }[];
};

export type PaymentAccount = {
  id: string;
  label: string;
  kind: "bank" | "wallet" | "other";
  bank_name: string | null;
  account_type: string | null;
  account_number: string;
  holder_name: string;
  holder_document: string | null;
  instructions: string | null;
  active: boolean;
  sort_order: number;
};

export type PaymentRequest = {
  id: string;
  business_id: string;
  business_name: string;
  plan_id: string | null;
  plan_name: string | null;
  months: number;
  amount: number;
  currency: string;
  account_label: string | null;
  reference: string;
  paid_on: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  requested_by_email: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type EffectiveState =
  | "trial"
  | "trial_expired"
  | "active"
  | "subscription_expired"
  | "suspended"
  | "cancelled";

export function effectiveState(business: MasterBusiness): EffectiveState {
  if (business.status === "suspended") return "suspended";
  if (business.status === "cancelled") return "cancelled";

  const now = Date.now();

  if (business.status === "trial") {
    return business.trial_ends_at && new Date(business.trial_ends_at).getTime() < now
      ? "trial_expired"
      : "trial";
  }

  return business.subscription_ends_at &&
    new Date(business.subscription_ends_at).getTime() < now
    ? "subscription_expired"
    : "active";
}

export const STATE_LABELS: Record<EffectiveState, string> = {
  trial: "En prueba",
  trial_expired: "Prueba vencida",
  active: "Activa",
  subscription_expired: "Suscripción vencida",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

export const STATE_STYLES: Record<EffectiveState, string> = {
  trial: "bg-amber-100 text-amber-800",
  trial_expired: "bg-orange-200 text-orange-900",
  active: "bg-emerald-100 text-emerald-800",
  subscription_expired: "bg-orange-200 text-orange-900",
  suspended: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-200 text-slate-700",
};

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#111827]/90 sm:p-6";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100";

export const primaryButton =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 disabled:opacity-60";

export const ghostButton =
  "rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.05]";

export function money(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

/** Días que faltan (negativo si ya pasó). */
export function daysUntil(value: string | null): number | null {
  if (!value) return null;

  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export const COLLECTION_LABELS: Record<string, string> = {
  clients: "Clientes",
  services: "Servicios",
  products: "Productos",
  sales: "Ventas",
  reservations: "Citas / reservas",
  workers: "Trabajadores",
  suppliers: "Proveedores",
  purchases: "Compras",
  "purchase-requests": "Solicitudes de compra",
  "financial-movements": "Movimientos financieros",
  "billing:documents": "Documentos de facturación",
  operations: "Operaciones",
  payments: "Pagos de ventas",
  "inventory-movements": "Movimientos de inventario",
};

export const ACTION_LABELS: Record<string, string> = {
  "business.created": "Empresa creada",
  "master.business_updated": "Empresa modificada por el Master",
  "master.business_deleted": "Empresa eliminada",
  "master.payment_recorded": "Pago registrado",
  "master.payment_voided": "Pago anulado",
  "master.request_approved": "Solicitud de pago aprobada",
  "master.request_rejected": "Solicitud de pago rechazada",
  "subscription.request_submitted": "Pago reportado por la empresa",
  "master.admin_added": "Administrador de plataforma agregado",
  "master.admin_removed": "Administrador de plataforma quitado",
  "team.invited": "Invitación enviada",
  "team.joined": "Invitación aceptada",
  "team.member_updated": "Integrante modificado",
  "team.member_removed": "Integrante retirado",
  "team.user_created": "Usuario creado",
  "team.user_deleted": "Usuario eliminado",
  "team.password_reset": "Contraseña restablecida",
  "billing.emailed": "Documento enviado por correo",
};
