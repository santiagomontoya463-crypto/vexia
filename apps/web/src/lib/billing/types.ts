export type BillingDocumentType =
  | "invoice"
  | "credit_note"
  | "debit_note"
  | "received_invoice"
  | "receipt"
  | "other";

export type BillingDocumentStatus =
  | "draft"
  | "issued"
  | "cancelled"
  | "void";

export type ElectronicBillingStatus =
  | "not_configured"
  | "not_required"
  | "pending"
  | "processing"
  | "accepted"
  | "rejected"
  | "error";

export interface BillingPartySnapshot {
  name: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  countryCode?: string;
}

export interface BillingDocumentItem {
  id: string;
  referenceId?: string;
  type: "product" | "service" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface BillingDocument {
  id: string;
  businessId: string;
  type: BillingDocumentType;
  status: BillingDocumentStatus;

  series: string;
  number?: string;
  issueDate?: string;
  dueDate?: string;

  customerId?: string;
  supplierId?: string;
  customerSnapshot?: BillingPartySnapshot;
  supplierSnapshot?: BillingPartySnapshot;

  sourceSaleId?: string;
  originalDocumentId?: string;

  items: BillingDocumentItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;

  electronicStatus: ElectronicBillingStatus;
  providerId?: string;
  externalDocumentId?: string;
  externalReference?: string;
  validationMessage?: string;

  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSeries {
  id: string;
  businessId: string;
  documentType: BillingDocumentType;
  series: string;
  nextNumber: number;
  prefix?: string;
  active: boolean;
}

export interface BillingSettings {
  businessId: string;
  countryCode: string;
  currency: string;
  electronicBillingEnabled: boolean;
  providerId?: string;
  updatedAt: string;
}
