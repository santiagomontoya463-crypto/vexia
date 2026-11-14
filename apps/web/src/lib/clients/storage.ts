import type { Client } from "./types";

const CLIENTS_KEY = "stian:clients";

/** Devuelve null si todavía no se ha guardado nada. */
export function loadClients(): Client[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CLIENTS_KEY);
    return raw ? (JSON.parse(raw) as Client[]) : null;
  } catch {
    return null;
  }
}

export function saveClients(clients: Client[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch {
    // Si el navegador no permite guardar, la sesión sigue funcionando.
  }
}
