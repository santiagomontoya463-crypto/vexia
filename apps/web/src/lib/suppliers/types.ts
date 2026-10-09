export type SupplierStatus = "active" | "inactive";

export type SupplierType =
  | "product"
  | "service"
  | "mixed"
  | "contractor"
  | "other";

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  legalName?: string;
  taxId?: string;
  type: SupplierType;
  status: SupplierStatus;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  pendingBalance: number;
  overdueBalance: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suppliersWithPendingBalance: number;
  suppliersWithOverdueBalance: number;
  totalPurchases: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}
