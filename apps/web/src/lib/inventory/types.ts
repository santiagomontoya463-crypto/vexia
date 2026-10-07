export type ProductStatus = "active" | "inactive";

export type InventoryMovementType =
  | "purchase"
  | "sale"
  | "adjustment"
  | "return"
  | "initial";

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  cost: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  status: ProductStatus;
  active: boolean;
}

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  referenceId?: string;
  date: string;
  userId?: string;
  notes?: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  inventoryCost: number;
  inventoryValue: number;
  estimatedMargin: number;
  lowStockProducts: number;
}
