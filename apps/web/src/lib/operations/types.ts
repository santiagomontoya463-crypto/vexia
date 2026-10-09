export type OperationType =
  | "sale"
  | "service"
  | "work_order"
  | "delivery"
  | "other";

export type OperationStatus =
  | "draft"
  | "pending"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "refunded"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "credit"
  | "other";

export interface OperationItem {
  id: string;
  type: "product" | "service" | "other";
  referenceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Operation {
  id: string;
  businessId: string;

  type: OperationType;
  status: OperationStatus;

  customerId?: string;
  workerId?: string;
  branchId?: string;

  items: OperationItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  paidAmount: number;
  pendingAmount: number;

  paymentStatus: PaymentStatus;

  date: string;
  createdAt: string;
  updatedAt: string;

  notes?: string;
  createdBy?: string;
}

export interface Payment {
  id: string;
  businessId: string;

  operationId: string;

  amount: number;

  method: PaymentMethod;

  status: "completed" | "cancelled" | "refunded";

  date: string;

  customerId?: string;
  branchId?: string;
  receivedBy?: string;

  reference?: string;
  notes?: string;

  createdAt: string;
}
