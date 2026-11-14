"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/** Lee una lista guardada en el almacenamiento local (vacía si no hay nada). */
export function readStoredList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Estado de React que se guarda solo. Cada cambio se escribe en el
 * almacenamiento local, y de ahí lo sincroniza el motor con Supabase.
 */
export function usePersistentList<T>(
  key: string,
): [T[], Dispatch<SetStateAction<T[]>>] {
  const [items, setItems] = useState<T[]>(() => readStoredList<T>(key));
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // Si el navegador no permite guardar, la sesión sigue funcionando.
    }
  }, [items, key]);

  return [items, setItems];
}
