export type PurchaseRequestStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "converted";

export type PurchaseRequestPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export interface PurchaseRequestItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  estimatedUnitCost: number;
  notes?: string;
}

export interface PurchaseRequest {
  id: string;
  businessId: string;
  code: string;
  title: string;
  justification: string;
  priority: PurchaseRequestPriority;
  status: PurchaseRequestStatus;
  purchaseId?: string;
  requiredDate?: string;
  items: PurchaseRequestItem[];
  estimatedTotal: number;
  requestedBy: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}
