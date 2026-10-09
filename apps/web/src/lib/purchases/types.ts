export type PurchaseStatus =
  | "draft"
  | "pending"
  | "completed"
  | "cancelled";

export type PurchasePaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "cancelled";

export type PurchasePaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "other";

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierId?: string;
  supplierName: string;

  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;

  items: PurchaseItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  paidAmount: number;
  pendingAmount: number;

  date: string;
  reference?: string;
  notes?: string;

  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePayment {
  id: string;
  businessId: string;
  purchaseId: string;

  amount: number;
  method: PurchasePaymentMethod;

  status: "completed" | "cancelled" | "refunded";

  date: string;

  supplierId?: string;
  receivedBy?: string;
  reference?: string;
  notes?: string;

  createdAt: string;
}
