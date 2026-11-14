import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sincronización de los datos de cada empresa con Supabase.
 *
 * Los módulos siguen leyendo y escribiendo en el almacenamiento local del
 * navegador (como siempre), y este motor:
 *  - al entrar a una empresa, descarga sus datos y reemplaza lo local;
 *  - cuando algo cambia, envía a Supabase solo los registros modificados;
 *  - al cambiar de empresa o cerrar sesión, limpia los datos locales.
 */

export const SYNC_KEYS = [
  "stian:clients",
  "stian:services",
  "stian:products",
  "stian:inventory-movements",
  "stian:sales",
  "stian:operations",
  "stian:payments",
  "stian:financial-movements",
  "stian:suppliers",
  "stian:purchases",
  "stian:purchase-payments",
  "stian:purchase-requests",
  "stian:billing:documents",
  "stian:billing:series",
  "stian:billing:settings",
  "stian:business-operations",
  "stian:business-settings",
  "stian:businesses",
  "stian:reservations",
  "stian:workers",
] as const;

export type SyncStatus = "idle" | "saving" | "error";

type Listener = (status: SyncStatus, message: string | null) => void;

type ParsedValue = {
  records: Map<string, string>;
  order: string[];
  isArray: boolean;
};

const TABLE = "business_records";
const ORDER_ID = "_order";
const VALUE_ID = "_value";
const PUSH_DELAY_MS = 600;
const RETRY_DELAY_MS = 5000;
const CHUNK_SIZE = 200;

let supabase: SupabaseClient | null = null;
let businessId: string | null = null;
let active = false;
let hydrating = false;
let patched = false;

const dirty = new Set<string>();
const snapshots = new Map<string, Map<string, string>>();
const orders = new Map<string, string>();
const listeners = new Set<Listener>();

let pushTimer: number | null = null;
let retryTimer: number | null = null;
let pushing: Promise<void> | null = null;
let status: SyncStatus = "idle";
let lastMessage: string | null = null;

let rawSetItem: ((key: string, value: string) => void) | null = null;
let rawRemoveItem: ((key: string) => void) | null = null;

function isSyncKey(key: string): boolean {
  return (SYNC_KEYS as readonly string[]).includes(key);
}

function collectionOf(key: string): string {
  return key.slice("stian:".length);
}

function setStatus(next: SyncStatus, message: string | null = null) {
  status = next;
  lastMessage = message;
  listeners.forEach((listener) => listener(status, lastMessage));
}

export function subscribeSync(listener: Listener): () => void {
  listeners.add(listener);
  listener(status, lastMessage);

  return () => {
    listeners.delete(listener);
  };
}

function parseValue(raw: string | null): ParsedValue | null {
  const records = new Map<string, string>();

  if (!raw) return { records, order: [], isArray: true };

  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch {
    // Texto dañado: no se envía nada para no borrar datos de la nube.
    return null;
  }

  if (value === null || value === undefined) {
    return { records, order: [], isArray: true };
  }

  if (Array.isArray(value)) {
    const allHaveIds = value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        (typeof (item as { id?: unknown }).id === "string" ||
          typeof (item as { id?: unknown }).id === "number"),
    );

    if (allHaveIds) {
      const order: string[] = [];

      for (const item of value as { id: string | number }[]) {
        const id = String(item.id);

        if (!records.has(id)) order.push(id);
        records.set(id, JSON.stringify(item));
      }

      return { records, order, isArray: true };
    }
  }

  records.set(VALUE_ID, JSON.stringify(value));
  return { records, order: [], isArray: false };
}

function chunk<T>(items: T[]): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += CHUNK_SIZE) {
    result.push(items.slice(index, index + CHUNK_SIZE));
  }

  return result;
}

async function pushKey(client: SupabaseClient, bid: string, key: string) {
  const parsed = parseValue(window.localStorage.getItem(key));

  if (!parsed) return;

  const collection = collectionOf(key);
  const previous = snapshots.get(key) ?? new Map<string, string>();

  const upserts: {
    business_id: string;
    collection: string;
    record_id: string;
    data: unknown;
  }[] = [];

  parsed.records.forEach((json, recordId) => {
    if (previous.get(recordId) !== json) {
      upserts.push({
        business_id: bid,
        collection,
        record_id: recordId,
        data: JSON.parse(json),
      });
    }
  });

  const removed = [...previous.keys()].filter((id) => !parsed.records.has(id));
  const orderJson = JSON.stringify(parsed.order);

  if (parsed.isArray && orders.get(key) !== orderJson) {
    upserts.push({
      business_id: bid,
      collection,
      record_id: ORDER_ID,
      data: parsed.order,
    });
  }

  for (const part of chunk(upserts)) {
    const { error } = await client
      .from(TABLE)
      .upsert(part, { onConflict: "business_id,collection,record_id" });

    if (error) throw new Error(error.message);
  }

  for (const part of chunk(removed)) {
    const { error } = await client
      .from(TABLE)
      .delete()
      .eq("business_id", bid)
      .eq("collection", collection)
      .in("record_id", part);

    if (error) throw new Error(error.message);
  }

  if (businessId === bid) {
    snapshots.set(key, parsed.records);
    if (parsed.isArray) orders.set(key, orderJson);
  }
}

async function doPush() {
  const client = supabase;
  const bid = businessId;

  if (!client || !bid) return;

  const keys = [...dirty];
  dirty.clear();

  setStatus("saving");

  let failure: string | null = null;

  for (const key of keys) {
    try {
      await pushKey(client, bid, key);
    } catch (error) {
      dirty.add(key);
      failure = error instanceof Error ? error.message : "Error desconocido.";
    }
  }

  if (failure) {
    setStatus("error", failure);

    const blockedByPolicy = failure.toLowerCase().includes("row-level security");

    if (!blockedByPolicy && retryTimer === null) {
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void flushSync();
      }, RETRY_DELAY_MS);
    }

    return;
  }

  setStatus("idle");

  if (dirty.size > 0) schedulePush();
}

function schedulePush() {
  if (pushTimer !== null) window.clearTimeout(pushTimer);

  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void flushSync();
  }, PUSH_DELAY_MS);
}

export async function flushSync(): Promise<void> {
  if (pushTimer !== null) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }

  if (pushing) await pushing;

  if (dirty.size === 0 || !supabase || !businessId) return;

  pushing = doPush().finally(() => {
    pushing = null;
  });

  await pushing;
}

function onLocalChange(key: string) {
  if (!active || hydrating || !isSyncKey(key)) return;

  dirty.add(key);
  schedulePush();
}

function patchStorage() {
  if (patched || typeof window === "undefined") return;

  patched = true;

  const proto = Storage.prototype;
  const originalSet = proto.setItem;
  const originalRemove = proto.removeItem;

  rawSetItem = (key, value) => originalSet.call(window.localStorage, key, value);
  rawRemoveItem = (key) => originalRemove.call(window.localStorage, key);

  proto.setItem = function (this: Storage, key: string, value: string) {
    originalSet.call(this, key, value);

    if (this === window.localStorage) onLocalChange(key);
  };

  proto.removeItem = function (this: Storage, key: string) {
    originalRemove.call(this, key);

    if (this === window.localStorage) onLocalChange(key);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushSync();
  });

  window.addEventListener("pagehide", () => {
    void flushSync();
  });
}

function clearLocalData() {
  for (const key of SYNC_KEYS) {
    if (rawRemoveItem) rawRemoveItem(key);
    else window.localStorage.removeItem(key);
  }
}

type CloudRow = {
  collection: string;
  record_id: string;
  data: unknown;
  created_at: string;
};

async function fetchAll(client: SupabaseClient, bid: string): Promise<CloudRow[]> {
  const rows: CloudRow[] = [];
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await client
      .from(TABLE)
      .select("collection, record_id, data, created_at")
      .eq("business_id", bid)
      .order("collection")
      .order("record_id")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);

    rows.push(...((data ?? []) as CloudRow[]));

    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return rows;
}

/** Detiene la sincronización (guardando antes lo pendiente). */
export async function stopSync(options?: { clearLocal?: boolean }) {
  try {
    await flushSync();
  } catch {
    // Si no se pudo enviar, se sigue con el cierre.
  }

  active = false;
  supabase = null;
  businessId = null;
  dirty.clear();
  snapshots.clear();
  orders.clear();

  if (retryTimer !== null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }

  if (options?.clearLocal) clearLocalData();

  setStatus("idle");
}

/** Descarga los datos de la empresa y empieza a sincronizar sus cambios. */
export async function startSync(client: SupabaseClient, bid: string) {
  patchStorage();

  await stopSync();

  supabase = client;
  businessId = bid;
  hydrating = true;

  try {
    const rows = await fetchAll(client, bid);

    const groups = new Map<
      string,
      {
        records: Map<string, { data: unknown; createdAt: string }>;
        order: string[] | null;
        value: unknown;
        hasValue: boolean;
      }
    >();

    for (const row of rows) {
      let group = groups.get(row.collection);

      if (!group) {
        group = { records: new Map(), order: null, value: undefined, hasValue: false };
        groups.set(row.collection, group);
      }

      if (row.record_id === ORDER_ID) {
        group.order = Array.isArray(row.data) ? (row.data as string[]) : null;
      } else if (row.record_id === VALUE_ID) {
        group.value = row.data;
        group.hasValue = true;
      } else {
        group.records.set(row.record_id, {
          data: row.data,
          createdAt: row.created_at,
        });
      }
    }

    for (const key of SYNC_KEYS) {
      const group = groups.get(collectionOf(key));

      // Lo que no está en la nube no existe para esta empresa: se descarta lo local.
      if (!group) {
        if (rawRemoveItem) rawRemoveItem(key);
        continue;
      }

      if (group.hasValue) {
        rawSetItem?.(key, JSON.stringify(group.value));
      } else {
        const known = new Set(group.records.keys());
        const ids = (group.order ?? []).filter((id) => known.has(id));
        const listed = new Set(ids);

        [...group.records.entries()]
          .filter(([id]) => !listed.has(id))
          .sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt))
          .forEach(([id]) => ids.push(id));

        rawSetItem?.(
          key,
          JSON.stringify(ids.map((id) => group.records.get(id)?.data)),
        );
      }

      const parsed = parseValue(window.localStorage.getItem(key));

      if (parsed) {
        snapshots.set(key, parsed.records);
        if (parsed.isArray) orders.set(key, JSON.stringify(parsed.order));
      }
    }

    active = true;
  } catch (error) {
    supabase = null;
    businessId = null;
    throw error;
  } finally {
    hydrating = false;
  }
}
