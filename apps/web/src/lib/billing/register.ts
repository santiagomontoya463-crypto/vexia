import type {
  BillingDocument,
  BillingDocumentType,
  BillingSeries,
  BillingSettings,
} from "./types";
import {
  loadBillingDocuments,
  loadBillingSeries,
  loadBillingSettings,
  saveBillingDocument,
  saveBillingSeries,
} from "./storage";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateDocument(document: BillingDocument): void {
  if (!document.businessId.trim()) {
    throw new Error("El documento debe pertenecer a un negocio.");
  }

  if (!document.createdBy.trim()) {
    throw new Error("Debes identificar quién creó el documento.");
  }

  if (!document.currency.trim()) {
    throw new Error("Debes indicar la moneda del documento.");
  }

  if (!document.items.length) {
    throw new Error("Agrega al menos un concepto al documento.");
  }

  for (const item of document.items) {
    if (!item.description.trim()) {
      throw new Error("Cada concepto debe tener una descripción.");
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor que cero.");
    }

    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new Error("El precio unitario no es válido.");
    }

    if (!Number.isFinite(item.discount) || item.discount < 0) {
      throw new Error("El descuento no es válido.");
    }

    if (!Number.isFinite(item.taxRate) || item.taxRate < 0) {
      throw new Error("La tarifa de impuesto no es válida.");
    }
  }

  const subtotal = roundMoney(
    document.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    ),
  );

  const discount = roundMoney(
    document.items.reduce((sum, item) => sum + item.discount, 0),
  );

  const tax = roundMoney(
    document.items.reduce((sum, item) => sum + item.taxAmount, 0),
  );

  const total = roundMoney(subtotal - discount + tax);

  if (discount > subtotal) {
    throw new Error("El descuento no puede superar el subtotal.");
  }

  if (
    Math.abs(document.subtotal - subtotal) > 0.01 ||
    Math.abs(document.discount - discount) > 0.01 ||
    Math.abs(document.tax - tax) > 0.01 ||
    Math.abs(document.total - total) > 0.01
  ) {
    throw new Error("Los totales no coinciden con los conceptos del documento.");
  }
}

export function createBillingDraft(
  input: Omit<
    BillingDocument,
    | "id"
    | "status"
    | "number"
    | "issueDate"
    | "series"
    | "electronicStatus"
    | "createdAt"
    | "updatedAt"
  > & { series?: string },
): BillingDocument {
  const now = new Date().toISOString();

  const document: BillingDocument = {
    ...input,
    id: makeId("billing"),
    series: input.series?.trim() || "BORRADOR",
    status: "draft",
    number: undefined,
    issueDate: undefined,
    electronicStatus: "not_configured",
    createdAt: now,
    updatedAt: now,
  };

  validateDocument(document);
  return saveBillingDocument(document);
}

export function issueBillingDocument(
  businessId: string,
  documentId: string,
  issueDate = new Date().toISOString().slice(0, 10),
): BillingDocument {
  if (!businessId.trim() || !documentId.trim()) {
    throw new Error("Debes indicar el negocio y el documento.");
  }

  const document = loadBillingDocuments(businessId).find(
    (item) => item.id === documentId,
  );

  if (!document) {
    throw new Error("No se encontró el documento en este negocio.");
  }

  if (document.status !== "draft") {
    throw new Error("Solo se pueden emitir documentos en estado borrador.");
  }

  validateDocument(document);

  const series = loadBillingSeries(businessId).find(
    (item) =>
      item.documentType === document.type &&
      item.active &&
      item.series.trim() !== "",
  );

  if (!series) {
    throw new Error(
      "Configura una serie activa para este tipo de documento antes de emitir.",
    );
  }

  const number = `${series.prefix ?? ""}${String(series.nextNumber).padStart(6, "0")}`;

  const duplicateNumber = loadBillingDocuments(businessId).some(
    (item) =>
      item.id !== document.id &&
      item.status === "issued" &&
      item.type === document.type &&
      item.series === series.series &&
      item.number === number,
  );

  if (duplicateNumber) {
    throw new Error(
      "El consecutivo ya existe. Revisa la serie antes de continuar.",
    );
  }

  const settings: BillingSettings | undefined =
    loadBillingSettings(businessId);

  const issued: BillingDocument = {
    ...document,
    status: "issued",
    series: series.series,
    number,
    issueDate,
    electronicStatus: settings?.electronicBillingEnabled
      ? "pending"
      : "not_configured",
    updatedAt: new Date().toISOString(),
  };

  // Guardar el documento y avanzar el consecutivo.
  // En producción, ambas operaciones deberán ser una transacción del servidor.
  saveBillingDocument(issued);

  const updatedSeries: BillingSeries = {
    ...series,
    nextNumber: series.nextNumber + 1,
  };

  saveBillingSeries(updatedSeries);

  return issued;
}

export function createCorrectionNote(
  businessId: string,
  originalDocumentId: string,
  type: Extract<BillingDocumentType, "credit_note" | "debit_note">,
  createdBy: string,
  reason: string,
): BillingDocument {
  if (!reason.trim()) {
    throw new Error("Indica el motivo de la nota de corrección.");
  }

  const original = loadBillingDocuments(businessId).find(
    (item) =>
      item.id === originalDocumentId &&
      item.status === "issued" &&
      item.type !== "credit_note" &&
      item.type !== "debit_note",
  );

  if (!original) {
    throw new Error(
      "No se encontró un documento emitido válido para corregir en este negocio.",
    );
  }

  const now = new Date().toISOString();

  const note: BillingDocument = {
    ...original,
    id: makeId(type),
    type,
    status: "draft",
    series: "BORRADOR",
    number: undefined,
    issueDate: undefined,
    originalDocumentId: original.id,
    subtotal: original.subtotal,
    discount: original.discount,
    tax: original.tax,
    total: original.total,
    electronicStatus: "not_configured",
    validationMessage: undefined,
    notes: reason.trim(),
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  return saveBillingDocument(note);
}

export function getBillingDocument(
  businessId: string,
  documentId: string,
): BillingDocument | undefined {
  if (!businessId.trim()) {
    throw new Error("Debes indicar el negocio.");
  }

  return loadBillingDocuments(businessId).find(
    (item) => item.id === documentId,
  );
}

export function getBillingDocuments(
  businessId: string,
  type?: BillingDocumentType,
): BillingDocument[] {
  if (!businessId.trim()) {
    throw new Error("Debes indicar el negocio.");
  }

  const documents = loadBillingDocuments(businessId);

  return type
    ? documents.filter((item) => item.type === type)
    : documents;
}
