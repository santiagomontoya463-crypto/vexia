import type { Supplier, SupplierStatus, SupplierType } from "./types";
import { loadSuppliers, recordSupplier, updateSupplier } from "./storage";

export interface RegisterSupplierParams {
  businessId: string;
  name: string;
  legalName?: string;
  taxId?: string;
  type?: SupplierType;
  status?: SupplierStatus;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdBy?: string;
  supplierId?: string;
}

function createSupplierId(): string {
  return `supplier-${crypto.randomUUID()}`;
}

export function registerSupplier(params: RegisterSupplierParams): Supplier {
  const name = params.name.trim();

  if (!name) throw new Error("El nombre del proveedor es obligatorio.");
  if (!params.businessId.trim()) throw new Error("El proveedor debe pertenecer a un negocio.");

  const suppliers = loadSuppliers();
  const now = new Date().toISOString();

  if (params.supplierId) {
    const existing = suppliers.find((s) => s.id === params.supplierId);

    if (!existing) throw new Error("El proveedor seleccionado no existe.");
    if (existing.businessId !== params.businessId) {
      throw new Error("El proveedor no pertenece al negocio actual.");
    }

    const updated: Supplier = {
      ...existing,
      name,
      legalName: params.legalName?.trim() || undefined,
      taxId: params.taxId?.trim() || undefined,
      type: params.type ?? existing.type,
      status: params.status ?? existing.status,
      contactName: params.contactName?.trim() || undefined,
      phone: params.phone?.trim() || undefined,
      email: params.email?.trim() || undefined,
      address: params.address?.trim() || undefined,
      city: params.city?.trim() || undefined,
      country: params.country?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      updatedAt: now,
    };

    updateSupplier(updated);
    return updated;
  }

  const supplier: Supplier = {
    id: createSupplierId(),
    businessId: params.businessId,
    name,
    legalName: params.legalName?.trim() || undefined,
    taxId: params.taxId?.trim() || undefined,
    type: params.type ?? "product",
    status: params.status ?? "active",
    contactName: params.contactName?.trim() || undefined,
    phone: params.phone?.trim() || undefined,
    email: params.email?.trim() || undefined,
    address: params.address?.trim() || undefined,
    city: params.city?.trim() || undefined,
    country: params.country?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    totalPurchases: 0,
    totalPaid: 0,
    pendingBalance: 0,
    overdueBalance: 0,
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  recordSupplier(supplier);
  return supplier;
}

function changeSupplierStatus(
  supplierId: string,
  businessId: string,
  status: SupplierStatus,
): Supplier {
  const supplier = loadSuppliers().find((s) => s.id === supplierId);

  if (!supplier) throw new Error("El proveedor no existe.");
  if (supplier.businessId !== businessId) {
    throw new Error("El proveedor no pertenece al negocio actual.");
  }

  const updated = {
    ...supplier,
    status,
    updatedAt: new Date().toISOString(),
  };

  updateSupplier(updated);
  return updated;
}

export function deactivateSupplier(supplierId: string, businessId: string): Supplier {
  return changeSupplierStatus(supplierId, businessId, "inactive");
}

export function activateSupplier(supplierId: string, businessId: string): Supplier {
  return changeSupplierStatus(supplierId, businessId, "active");
}
