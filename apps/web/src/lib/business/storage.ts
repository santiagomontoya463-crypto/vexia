import type { Business, BusinessSettings } from "./types";

const BUSINESSES_KEY = "vexia:businesses";
const ACTIVE_BUSINESS_KEY = "vexia:active-business";
const SETTINGS_KEY = "vexia:business-settings";

function readBusinesses(): Business[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BUSINESSES_KEY);
    return raw ? JSON.parse(raw) as Business[] : [];
  } catch {
    return [];
  }
}

function writeBusinesses(businesses: Business[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses));
}

export function getBusinesses(): Business[] {
  return readBusinesses();
}

export function getBusiness(businessId: string): Business | undefined {
  return readBusinesses().find((business) => business.id === businessId);
}

export function saveBusiness(input: Business): Business {
  const business: Business = {
    ...input,
    name: input.name.trim(),
    countryCode: input.countryCode.trim().toUpperCase(),
    currency: input.currency.trim().toUpperCase(),
    updatedAt: new Date().toISOString(),
  };

  if (!business.id.trim() || !business.name || !business.countryCode || !business.currency) {
    throw new Error("El negocio requiere identificador, nombre, país y moneda.");
  }

  const businesses = readBusinesses();
  const index = businesses.findIndex((item) => item.id === business.id);

  if (index >= 0) {
    businesses[index] = business;
  } else {
    businesses.push(business);
  }

  writeBusinesses(businesses);
  return business;
}

export function getActiveBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function setActiveBusinessId(businessId: string): void {
  if (typeof window === "undefined") return;

  const exists = readBusinesses().some((business) => business.id === businessId);
  if (!exists) {
    throw new Error("El negocio seleccionado no existe.");
  }

  window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
}

export function getActiveBusiness(): Business | undefined {
  const id = getActiveBusinessId();
  return id ? getBusiness(id) : undefined;
}

export function getBusinessSettings(businessId: string): BusinessSettings | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const all = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}") as Record<string, BusinessSettings>;
    return all[businessId];
  } catch {
    return undefined;
  }
}

export function saveBusinessSettings(settings: BusinessSettings): void {
  if (typeof window === "undefined") return;
  if (!getBusiness(settings.businessId)) {
    throw new Error("No se puede guardar la configuración de un negocio inexistente.");
  }

  let all: Record<string, BusinessSettings> = {};

  try {
    all = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}") as Record<string, BusinessSettings>;
  } catch {
    all = {};
  }

  all[settings.businessId] = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
}