import type {
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestPriority,
  PurchaseRequestStatus,
} from "./types";
import { loadPurchaseRequests, savePurchaseRequests } from "./storage";

interface CreatePurchaseRequestParams {
  businessId: string;
  title: string;
  justification: string;
  priority: PurchaseRequestPriority;
  requiredDate?: string;
  requestedBy: string;
  items: PurchaseRequestItem[];
}

export function createPurchaseRequest(
  params: CreatePurchaseRequestParams,
): PurchaseRequest {
  if (!params.businessId.trim()) {
    throw new Error("El negocio es obligatorio.");
  }

  if (!params.title.trim()) {
    throw new Error("Escribe el título de la solicitud.");
  }

  if (!params.items.length) {
    throw new Error("Agrega al menos un producto o material.");
  }

  for (const item of params.items) {
    if (!item.productName.trim()) {
      throw new Error("Todos los artículos deben tener nombre.");
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`La cantidad de "${item.productName}" debe ser mayor que cero.`);
    }

    if (!Number.isFinite(item.estimatedUnitCost) || item.estimatedUnitCost < 0) {
      throw new Error(`El costo estimado de "${item.productName}" no es válido.`);
    }
  }

  const requests = loadPurchaseRequests();
  const now = new Date().toISOString();
  const id = `request-${crypto.randomUUID()}`;
  const year = new Date().getFullYear();
  const sequence = requests.filter(
    (request) =>
      request.businessId === params.businessId &&
      request.code.startsWith(`SOL-${year}-`),
  ).length + 1;

  const request: PurchaseRequest = {
    id,
    businessId: params.businessId,
    code: `SOL-${year}-${String(sequence).padStart(4, "0")}`,
    title: params.title.trim(),
    justification: params.justification.trim(),
    priority: params.priority,
    status: "submitted",
    requiredDate: params.requiredDate || undefined,
    items: params.items.map((item) => ({
      ...item,
      productName: item.productName.trim(),
      notes: item.notes?.trim() || undefined,
    })),
    estimatedTotal: params.items.reduce(
      (total, item) => total + item.quantity * item.estimatedUnitCost,
      0,
    ),
    requestedBy: params.requestedBy.trim() || "Usuario VEXIA",
    createdAt: now,
    updatedAt: now,
  };

  savePurchaseRequests([...requests, request]);
  return request;
}

export function reviewPurchaseRequest(
  businessId: string,
  requestId: string,
  status: Extract<PurchaseRequestStatus, "approved" | "rejected" | "changes_requested">,
  reviewedBy: string,
  reviewNotes = "",
): PurchaseRequest {
  const requests = loadPurchaseRequests();
  const request = requests.find(
    (item) => item.id === requestId && item.businessId === businessId,
  );

  if (!request) {
    throw new Error("No se encontró la solicitud de este negocio.");
  }

  if (request.status !== "submitted" && request.status !== "changes_requested") {
    throw new Error("Esta solicitud no está disponible para revisión.");
  }

  const updated: PurchaseRequest = {
    ...request,
    status,
    reviewedBy: reviewedBy.trim() || "Usuario VEXIA",
    reviewNotes: reviewNotes.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  savePurchaseRequests(
    requests.map((item) => item.id === requestId ? updated : item),
  );

  return updated;
}
