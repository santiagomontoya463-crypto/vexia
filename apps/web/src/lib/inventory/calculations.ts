import type {
  InventoryMovement,
  InventorySummary,
  Product,
} from "./types";

export function calculateProductMargin(product: Product): number {
  return Math.max(product.salePrice - product.cost, 0);
}

export function calculateProductMarginPercent(product: Product): number {
  if (product.salePrice <= 0) return 0;

  return (
    ((product.salePrice - product.cost) / product.salePrice) *
    100
  );
}

export function calculateInventorySummary(
  products: Product[],
): InventorySummary {
  const activeProducts = products.filter(
    (product) => product.active && product.status === "active",
  );

  const totalUnits = activeProducts.reduce(
    (total, product) => total + product.stock,
    0,
  );

  const inventoryCost = activeProducts.reduce(
    (total, product) => total + product.stock * product.cost,
    0,
  );

  const inventoryValue = activeProducts.reduce(
    (total, product) => total + product.stock * product.salePrice,
    0,
  );

  const estimatedMargin = inventoryValue - inventoryCost;

  const lowStockProducts = activeProducts.filter(
    (product) => product.stock <= product.minimumStock,
  ).length;

  return {
    totalProducts: activeProducts.length,
    totalUnits,
    inventoryCost,
    inventoryValue,
    estimatedMargin,
    lowStockProducts,
  };
}

export function applyInventoryMovement(
  currentStock: number,
  movement: InventoryMovement,
): number {
  switch (movement.type) {
    case "purchase":
    case "return":
    case "initial":
      return currentStock + movement.quantity;

    case "sale":
      return Math.max(currentStock - movement.quantity, 0);

    case "adjustment":
      return Math.max(currentStock + movement.quantity, 0);

    default:
      return currentStock;
  }
}

export function canSellProduct(
  product: Product,
  quantity: number,
): boolean {
  return (
    product.active &&
    product.status === "active" &&
    quantity > 0 &&
    product.stock >= quantity
  );
}
