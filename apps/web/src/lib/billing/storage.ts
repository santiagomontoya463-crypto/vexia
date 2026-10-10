import type {
  BillingDocument,
  BillingSeries,
  BillingSettings,
} from "./types";

const DOCUMENTS_KEY = "vexia:billing:documents";
const SERIES_KEY = "vexia:billing:series";
const SETTINGS_KEY = "vexia:billing:settings";

function loadList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function loadBillingDocuments(
  businessId?: string,
): BillingDocument[] {
  const documents = loadList<BillingDocument>(DOCUMENTS_KEY);

  return businessId
    ? documents.filter((item) => item.businessId === businessId)
    : documents;
}

export function saveBillingDocument(
  document: BillingDocument,
): BillingDocument {
  if (!document.businessId.trim()) {
    throw new Error("El documento debe pertenecer a un negocio.");
  }

  if (!document.id.trim()) {
    throw new Error("El documento debe tener un identificador.");
  }

  if (!Number.isFinite(document.total) || document.total < 0) {
    throw new Error("El total del documento no es válido.");
  }

  const documents = loadList<BillingDocument>(DOCUMENTS_KEY);
  const existing = documents.find((item) => item.id === document.id);

  if (existing) {
    if (existing.businessId !== document.businessId) {
      throw new Error("No se puede modificar un documento de otro negocio.");
    }

    if (existing.status === "issued" && document.status !== "issued") {
      throw new Error(
        "Un documento emitido no puede cambiarse de estado mediante esta operación.",
      );
    }

    if (existing.status === "issued") {
      throw new Error(
        "Los documentos emitidos son inmutables; utiliza una nota de corrección.",
      );
    }

    saveList(
      DOCUMENTS_KEY,
      documents.map((item) => item.id === document.id ? document : item),
    );

    return document;
  }

  saveList(DOCUMENTS_KEY, [...documents, document]);
  return document;
}

export function loadBillingSeries(
  businessId?: string,
): BillingSeries[] {
  const series = loadList<BillingSeries>(SERIES_KEY);

  return businessId
    ? series.filter((item) => item.businessId === businessId)
    : series;
}

export function saveBillingSeries(
  series: BillingSeries,
): BillingSeries {
  if (!series.businessId.trim() || !series.id.trim()) {
    throw new Error("La serie debe pertenecer a un negocio y tener ID.");
  }

  if (!Number.isInteger(series.nextNumber) || series.nextNumber < 1) {
    throw new Error("El próximo consecutivo debe ser un entero positivo.");
  }

  const all = loadList<BillingSeries>(SERIES_KEY);
  const existing = all.find((item) => item.id === series.id);

  if (existing && existing.businessId !== series.businessId) {
    throw new Error("No puedes modificar una serie de otro negocio.");
  }

  const duplicate = all.find(
    (item) =>
      item.businessId === series.businessId &&
      item.documentType === series.documentType &&
      item.series === series.series &&
      item.id !== series.id,
  );

  if (duplicate) {
    throw new Error("Ya existe una serie con ese tipo y nombre para este negocio.");
  }

  saveList(
    SERIES_KEY,
    existing
      ? all.map((item) => item.id === series.id ? series : item)
      : [...all, series],
  );

  return series;
}

export function loadBillingSettings(
  businessId: string,
): BillingSettings | undefined {
  return loadList<BillingSettings>(SETTINGS_KEY).find(
    (item) => item.businessId === businessId,
  );
}

export function saveBillingSettings(
  settings: BillingSettings,
): BillingSettings {
  if (!settings.businessId.trim()) {
    throw new Error("La configuración debe pertenecer a un negocio.");
  }

  if (!/^[A-Z]{2}$/.test(settings.countryCode)) {
    throw new Error("El país debe indicarse mediante su código de dos letras.");
  }

  if (!settings.currency.trim()) {
    throw new Error("Debes configurar la moneda del negocio.");
  }

  const all = loadList<BillingSettings>(SETTINGS_KEY);
  const exists = all.some((item) => item.businessId === settings.businessId);

  saveList(
    SETTINGS_KEY,
    exists
      ? all.map((item) =>
          item.businessId === settings.businessId ? settings : item,
        )
      : [...all, settings],
  );

  return settings;
}
