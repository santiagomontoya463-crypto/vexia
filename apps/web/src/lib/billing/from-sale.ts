import { getActiveBusiness, getActiveBusinessId } from "../business";
import type { Sale } from "../sales/types";
import { createBillingDraft, issueBillingDocument } from "./register";
import type {
  BillingDocument,
  BillingDocumentItem,
  BillingPartySnapshot,
} from "./types";

/**
 * Genera y emite un documento (recibo o factura de venta) a partir de una
 * venta, con el nombre y el NIT de la empresa como emisor.
 */
export function createDocumentFromSale(
  sale: Sale,
  type: "receipt" | "invoice",
  customer?: { name?: string; phone?: string; email?: string },
): BillingDocument {
  const businessId = getActiveBusinessId();
  const business = getActiveBusiness();

  if (!businessId) {
    throw new Error("Primero registra tu negocio en «Mi negocio».");
  }

  if (type === "invoice" && !business?.documentNumber?.trim()) {
    throw new Error(
      "Para emitir una factura tu negocio debe tener NIT. Regístralo en «Mi negocio».",
    );
  }

  const issuer: BillingPartySnapshot = {
    name: business?.name || "Mi negocio",
    documentType: business?.documentNumber ? "NIT" : undefined,
    documentNumber: business?.documentNumber || undefined,
    email: business?.email || undefined,
    phone: business?.phone || undefined,
    address: business?.address || undefined,
    countryCode: business?.countryCode || "CO",
  };

  const buyer: BillingPartySnapshot = {
    name: customer?.name || sale.customerId || "Cliente",
    phone: customer?.phone || undefined,
    email: customer?.email || undefined,
    countryCode: "CO",
  };

  const stamp = Date.now();

  const items: BillingDocumentItem[] = sale.items.map((item, index) => ({
    id: `item-${stamp}-${index}`,
    type: item.type === "product" ? "product" : "service",
    description: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: 0,
    taxAmount: item.tax,
    total: item.total,
  }));

  const draft = createBillingDraft({
    businessId,
    type,
    issuerSnapshot: issuer,
    customerSnapshot: buyer,
    items,
    subtotal: sale.subtotal,
    discount: sale.discount,
    tax: sale.tax,
    total: sale.total,
    currency: business?.currency || "COP",
    createdBy: "usuario-actual",
    notes: sale.notes,
  });

  return issueBillingDocument(businessId, draft.id);
}
