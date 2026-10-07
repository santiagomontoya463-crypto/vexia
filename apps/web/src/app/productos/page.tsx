"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateInventorySummary,
  calculateProductMarginPercent,
} from "../../lib/inventory";
import type { Product } from "../../lib/inventory";
import { loadProducts, saveProducts } from "../../lib/inventory/storage";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    const storedProducts = loadProducts();
    setProducts(storedProducts);
    setProductsLoaded(true);
  }, []);

  useEffect(() => {
    if (productsLoaded) {
      saveProducts(products);
    }
  }, [products, productsLoaded]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("5");
  const [error, setError] = useState("");

  const summary = useMemo(
    () => calculateInventorySummary(products),
    [products],
  );

  function createProduct() {
    const productCost = Number(cost);
    const productPrice = Number(salePrice);
    const productStock = Number(stock);
    const productMinimum = Number(minimumStock);

    if (!name.trim()) {
      setError("Ingresa el nombre del producto.");
      return;
    }

    if (productCost < 0 || !Number.isFinite(productCost)) {
      setError("Ingresa un costo válido.");
      return;
    }

    if (productPrice <= 0 || !Number.isFinite(productPrice)) {
      setError("Ingresa un precio de venta válido.");
      return;
    }

    if (productStock < 0 || !Number.isFinite(productStock)) {
      setError("Ingresa una existencia válida.");
      return;
    }

    if (productMinimum < 0 || !Number.isFinite(productMinimum)) {
      setError("Ingresa un stock mínimo válido.");
      return;
    }

    const product: Product = {
      id: crypto.randomUUID(),
      businessId: "current-business",
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category.trim() || undefined,
      cost: productCost,
      salePrice: productPrice,
      stock: productStock,
      minimumStock: productMinimum,
      status: "active",
      active: true,
    };

    setProducts((current) => [product, ...current]);

    setName("");
    setSku("");
    setCategory("");
    setCost("");
    setSalePrice("");
    setStock("");
    setMinimumStock("5");
    setError("");
    setShowForm(false);
  }

  function toggleProduct(id: string) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              active: !product.active,
              status: product.active ? "inactive" : "active",
            }
          : product,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
              VEXIA · Inventario
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              Productos
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Controla productos, existencias, costos, precios y margen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
          >
            {showForm ? "Cerrar" : "+ Nuevo producto"}
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            title="Productos"
            value={String(summary.totalProducts)}
            description="Productos activos"
          />

          <Metric
            title="Unidades"
            value={summary.totalUnits.toLocaleString("es-CO")}
            description="Existencia actual"
          />

          <Metric
            title="Valor inventario"
            value={money(summary.inventoryCost)}
            description="Valor al costo"
          />

          <Metric
            title="Stock bajo"
            value={String(summary.lowStockProducts)}
            description="Requieren revisión"
            warning={summary.lowStockProducts > 0}
          />
        </section>

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Registrar producto
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              El costo y el precio serán utilizados posteriormente para calcular rentabilidad.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Nombre"
                value={name}
                onChange={setName}
                placeholder="Ej. Shampoo profesional"
              />

              <Field
                label="SKU / código"
                value={sku}
                onChange={setSku}
                placeholder="Opcional"
              />

              <Field
                label="Categoría"
                value={category}
                onChange={setCategory}
                placeholder="Ej. Cuidado capilar"
              />

              <NumberField
                label="Costo"
                value={cost}
                onChange={setCost}
                placeholder="0"
              />

              <NumberField
                label="Precio de venta"
                value={salePrice}
                onChange={setSalePrice}
                placeholder="0"
              />

              <NumberField
                label="Existencia inicial"
                value={stock}
                onChange={setStock}
                placeholder="0"
              />

              <NumberField
                label="Stock mínimo"
                value={minimumStock}
                onChange={setMinimumStock}
                placeholder="5"
              />
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={createProduct}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"
            >
              Guardar producto
            </button>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Inventario
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Los productos registrados aquí serán la base para las ventas de productos.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">
                📦
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                Inventario vacío
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Registra el primer producto para comenzar a controlar existencias.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {products.map((product) => {
                const lowStock =
                  product.stock <= product.minimumStock;

                const margin = calculateProductMarginPercent(product);

                return (
                  <article
                    key={product.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {product.name}
                          </h3>

                          {product.category && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {product.category}
                            </span>
                          )}

                          {lowStock && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              Stock bajo
                            </span>
                          )}
                        </div>

                        {product.sku && (
                          <p className="mt-1 text-xs text-slate-400">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Data
                          label="Existencia"
                          value={String(product.stock)}
                        />

                        <Data
                          label="Costo"
                          value={money(product.cost)}
                        />

                        <Data
                          label="Venta"
                          value={money(product.salePrice)}
                        />

                        <Data
                          label="Margen"
                          value={`${margin.toFixed(1)}%`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {product.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  description,
  warning,
}: {
  title: string;
  value: string;
  description: string;
  warning?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          warning
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </article>
  );
}

function Data({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}
