import type {
  Purchase,
  PurchaseItem,
  PurchasePayment,
} from "./types";

import {
  loadPurchases,
  savePurchases,
  loadPurchasePayments,
  savePurchasePayments,
} from "./storage";

import { registerExpense } from "../finance/register";

import {
  loadProducts,
  saveProducts,
  loadInventoryMovements,
  saveInventoryMovements,
} from "../inventory/storage";

import type {
  InventoryMovement,
  Product,
} from "../inventory/types";

import {
  calculatePurchaseAmounts,
} from "./calculations";

interface RegisterPurchaseParams {
  businessId: string;
  supplierId?: string;
  supplierName: string;

  items: PurchaseItem[];

  date?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;

  purchaseId?: string;
}

export interface RegisterPurchaseResult {
  purchase: Purchase;
  inventoryMovements: InventoryMovement[];
}

function createPurchaseId(
  purchaseId?: string,
): string {
  if (purchaseId) {
    return purchaseId;
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `purchase-${crypto.randomUUID()}`;
  }

  return `purchase-${Date.now()}`;
}

function validatePurchaseItems(
  items: PurchaseItem[],
): void {
  if (!items.length) {
    throw new Error(
      "La compra debe contener al menos un producto.",
    );
  }

  for (const item of items) {
    if (!item.productId) {
      throw new Error(
        "Todos los productos de la compra deben tener un producto asociado.",
      );
    }

    if (!item.productName.trim()) {
      throw new Error(
        "Todos los productos de la compra deben tener un nombre.",
      );
    }

    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(
        `La cantidad de ${item.productName} debe ser mayor que cero.`,
      );
    }

    if (
      !Number.isFinite(item.unitCost) ||
      item.unitCost < 0
    ) {
      throw new Error(
        `El costo de ${item.productName} no es válido.`,
      );
    }

    if (
      !Number.isFinite(item.discount) ||
      item.discount < 0
    ) {
      throw new Error(
        `El descuento de ${item.productName} no es válido.`,
      );
    }

    if (
      !Number.isFinite(item.tax) ||
      item.tax < 0
    ) {
      throw new Error(
        `El impuesto de ${item.productName} no es válido.`,
      );
    }
  }
}

function calculateWeightedAverageCost(
  product: Product,
  quantityPurchased: number,
  purchaseUnitCost: number,
): number {
  const currentStock = Math.max(
    product.stock,
    0,
  );

  const currentCost = Math.max(
    product.cost,
    0,
  );

  const totalUnits =
    currentStock + quantityPurchased;

  if (totalUnits <= 0) {
    return purchaseUnitCost;
  }

  const currentInventoryCost =
    currentStock * currentCost;

  const purchasedInventoryCost =
    quantityPurchased * purchaseUnitCost;

  return (
    currentInventoryCost +
    purchasedInventoryCost
  ) / totalUnits;
}

function createInventoryMovementId(
  purchaseId: string,
  itemId: string,
): string {
  return `purchase-${purchaseId}-item-${itemId}`;
}

export function registerPurchase(
  params: RegisterPurchaseParams,
): RegisterPurchaseResult {
  validatePurchaseItems(params.items);

  const purchaseId = createPurchaseId(
    params.purchaseId,
  );

  const existingPurchases =
    loadPurchases();

  const existingPurchase =
    existingPurchases.find(
      (item) => item.id === purchaseId,
    );

  if (existingPurchase) {
    return {
      purchase: existingPurchase,
      inventoryMovements: [],
    };
  }

  const products = loadProducts();

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ]),
  );

  for (const item of params.items) {
    const product =
      productMap.get(item.productId);

    if (!product) {
      throw new Error(
        `El producto "${item.productName}" no existe en el inventario.`,
      );
    }

    if (
      product.businessId !== params.businessId
    ) {
      throw new Error(
        `El producto "${item.productName}" no pertenece al negocio actual.`,
      );
    }

    if (
      product.status !== "active" ||
      !product.active
    ) {
      throw new Error(
        `El producto "${item.productName}" está inactivo.`,
      );
    }
  }

  const amounts =
    calculatePurchaseAmounts(
      params.items,
    );

  const now = new Date().toISOString();
  const purchaseDate =
    params.date ?? now;

  const purchase: Purchase = {
    id: purchaseId,
    businessId: params.businessId,

    supplierId: params.supplierId,
    supplierName:
      params.supplierName.trim(),

    status: "completed",
    paymentStatus: "pending",

    items: params.items.map(
      (item) => ({
        ...item,
        discount: Math.max(
          item.discount ?? 0,
          0,
        ),
        tax: Math.max(
          item.tax ?? 0,
          0,
        ),
        total:
          item.total >= 0
            ? item.total
            : 0,
      }),
    ),

    subtotal: amounts.subtotal,
    discount: amounts.discount,
    tax: amounts.tax,
    total: amounts.total,

    paidAmount: 0,
    pendingAmount: amounts.total,

    date: purchaseDate,
    reference: params.reference,
    notes: params.notes,

    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const inventoryMovements: InventoryMovement[] =
    [];

  const inventoryMovementsExisting =
    loadInventoryMovements();

  const updatedProducts =
    products.map((product) => {
      const purchaseItems =
        params.items.filter(
          (item) =>
            item.productId ===
            product.id,
        );

      if (!purchaseItems.length) {
        return product;
      }

      let updatedProduct = {
        ...product,
      };

      for (const item of purchaseItems) {
        const movementId =
          createInventoryMovementId(
            purchase.id,
            item.id,
          );

        const movementAlreadyExists =
          inventoryMovementsExisting.some(
            (movement) =>
              movement.id ===
              movementId,
          );

        if (
          movementAlreadyExists
        ) {
          continue;
        }

        const previousStock =
          updatedProduct.stock;

        const newStock =
          previousStock +
          item.quantity;

        const newAverageCost =
          calculateWeightedAverageCost(
            updatedProduct,
            item.quantity,
            item.unitCost,
          );

        updatedProduct = {
          ...updatedProduct,
          stock: newStock,
          cost: newAverageCost,
        };

        const movement: InventoryMovement =
          {
            id: movementId,
            businessId:
              params.businessId,
            productId:
              product.id,
            type: "purchase",
            quantity:
              item.quantity,
            unitCost:
              item.unitCost,
            referenceId:
              purchase.id,
            date: purchaseDate,
            userId:
              params.createdBy,
            notes:
              `Compra ${purchase.id}`,
          };

        inventoryMovements.push(
          movement,
        );
      }

      return updatedProduct;
    });

  saveProducts(updatedProducts);

  if (inventoryMovements.length) {
    saveInventoryMovements([
      ...inventoryMovementsExisting,
      ...inventoryMovements,
    ]);
  }

  savePurchases([
    ...existingPurchases,
    purchase,
  ]);

  return {
    purchase,
    inventoryMovements,
  };
}

export function registerPurchasePayment(
  params: {
    businessId: string;
    purchaseId: string;
    amount: number;
    method: "cash" | "card" | "transfer" | "other";
    date?: string;
    supplierId?: string;
    receivedBy?: string;
    reference?: string;
    notes?: string;
    paymentId?: string;
  },
) {
  if (!params.businessId.trim()) {
    throw new Error("El negocio es obligatorio.");
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    throw new Error("El valor del pago debe ser mayor que cero.");
  }

  const purchases = loadPurchases();
  const purchase = purchases.find(
    (item) => item.id === params.purchaseId,
  );

  if (!purchase) {
    throw new Error("La compra seleccionada no existe.");
  }

  if (purchase.businessId !== params.businessId) {
    throw new Error("La compra no pertenece al negocio actual.");
  }

  if (purchase.status === "cancelled") {
    throw new Error(
      "No se puede registrar un pago para una compra cancelada.",
    );
  }

  const payments = loadPurchasePayments();

  const existingPayment = params.paymentId
    ? payments.find((item) => item.id === params.paymentId)
    : undefined;

  if (existingPayment) {
    if (existingPayment.businessId !== params.businessId) {
      throw new Error("El pago no pertenece al negocio actual.");
    }

    if (existingPayment.purchaseId !== purchase.id) {
      throw new Error(
        "El identificador del pago ya está asociado a otra compra.",
      );
    }

    // Recuperar o completar el egreso con un ID estable.
    // recordFinancialMovement evita duplicarlo si ya existe.
    registerExpense({
      businessId: existingPayment.businessId,
      sourceType: "purchase",
      sourceId: existingPayment.id,
      amount: existingPayment.amount,
      description: `Pago a proveedor: ${purchase.supplierName}`,
      date: existingPayment.date,
      paymentMethod: existingPayment.method,
      category: "Compras y proveedores",
      createdBy: existingPayment.receivedBy,
      notes: existingPayment.notes || existingPayment.reference,
      status: "completed",
    });

    const currentPurchase =
      purchases.find((item) => item.id === existingPayment.purchaseId) ??
      purchase;

    return {
      payment: existingPayment,
      purchase: currentPurchase,
    };
  }

  const paidAmount = payments
    .filter(
      (payment) =>
        payment.businessId === params.businessId &&
        payment.purchaseId === purchase.id &&
        payment.status === "completed",
    )
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingAmount = Math.max(purchase.total - paidAmount, 0);

  if (params.amount > pendingAmount) {
    throw new Error(
      `El pago no puede superar el saldo pendiente de ${pendingAmount}.`,
    );
  }

  const paymentId =
    params.paymentId ??
    (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? `purchase-payment-${crypto.randomUUID()}`
        : `purchase-payment-${Date.now()}`
    );

  // No permitir reutilizar un ID ya guardado.
  if (payments.some((payment) => payment.id === paymentId)) {
    throw new Error("El identificador del pago ya está registrado.");
  }

  const payment: PurchasePayment = {
    id: paymentId,
    businessId: params.businessId,
    purchaseId: purchase.id,
    amount: params.amount,
    method: params.method,
    status: "completed",
    date: params.date ?? new Date().toISOString(),
    supplierId: params.supplierId ?? purchase.supplierId,
    receivedBy: params.receivedBy,
    reference: params.reference,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };

  const newPaidAmount = paidAmount + payment.amount;
  const newPendingAmount = Math.max(
    purchase.total - newPaidAmount,
    0,
  );

  const newPaymentStatus =
    newPendingAmount <= 0
      ? "paid"
      : newPaidAmount > 0
        ? "partial"
        : "pending";

  const updatedPurchase: Purchase = {
    ...purchase,
    paymentStatus: newPaymentStatus,
    paidAmount: newPaidAmount,
    pendingAmount: newPendingAmount,
    updatedAt: new Date().toISOString(),
  };

  savePurchasePayments([...payments, payment]);

  savePurchases(
    purchases.map((item) =>
      item.id === updatedPurchase.id ? updatedPurchase : item,
    ),
  );

  // Un egreso por pago, identificado de forma determinista.
  registerExpense({
    businessId: payment.businessId,
    sourceType: "purchase",
    sourceId: payment.id,
    amount: payment.amount,
    description: `Pago a proveedor: ${purchase.supplierName}`,
    date: payment.date,
    paymentMethod: payment.method,
    category: "Compras y proveedores",
    createdBy: payment.receivedBy,
    notes: payment.notes || payment.reference,
    status: "completed",
  });

  return {
    payment,
    purchase: updatedPurchase,
  };
}

