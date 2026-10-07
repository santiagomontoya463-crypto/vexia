const SERVICES_KEY = "vexia:services";

export function loadServices(): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SERVICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveServices(services: unknown[]): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SERVICES_KEY,
    JSON.stringify(services),
  );
}
