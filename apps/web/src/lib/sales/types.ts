import type { PaymentMethod } from "../finance";

export type SaleStatus =
  | "draft"
  | "confirmed"
  | "cancelled"
  | "refunded";

export interface SaleItem {
  id: string;
  saleId: string;
  type: "service" | "product";
  referenceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  workerId?: string;
}

export interface SalePayment {
  id: string;
  saleId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
}

export interface Sale {
  id: string;
  businessId: string;
  customerId?: string;
  workerId?: string;
  branchId?: string;
  items: SaleItem[];
  payments: SalePayment[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  pending: number;
  status: SaleStatus;
  date: string;
  createdBy: string;
  notes?: string;
}
