import type { Supplier } from "./types";

const SUPPLIERS_KEY = "vexia:suppliers";

export function loadSuppliers(): Supplier[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SUPPLIERS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Supplier[] : [];
  } catch {
    return [];
  }
}

export function saveSuppliers(suppliers: Supplier[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

export function recordSupplier(supplier: Supplier): void {
  const suppliers = loadSuppliers();

  if (suppliers.some((item) => item.id === supplier.id)) {
    throw new Error("Ya existe un proveedor con ese identificador.");
  }

  saveSuppliers([...suppliers, supplier]);
}

export function updateSupplier(updatedSupplier: Supplier): void {
  const suppliers = loadSuppliers();
  const exists = suppliers.some((item) => item.id === updatedSupplier.id);

  if (!exists) {
    throw new Error("No se encontró el proveedor que deseas actualizar.");
  }

  saveSuppliers(
    suppliers.map((item) =>
      item.id === updatedSupplier.id ? updatedSupplier : item,
    ),
  );
}
