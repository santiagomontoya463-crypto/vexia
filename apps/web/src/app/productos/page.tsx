"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "Disponible" | "Stock bajo" | "Agotado";
};

const products: Product[] = [
  {
    id: 1,
    name: "Producto principal",
    category: "General",
    price: "$45.000",
    stock: 24,
    status: "Disponible",
  },
  {
    id: 2,
    name: "Producto premium",
    category: "Premium",
    price: "$85.000",
    stock: 8,
    status: "Disponible",
  },
  {
    id: 3,
    name: "Producto especial",
    category: "Especializado",
    price: "$120.000",
    stock: 3,
    status: "Stock bajo",
  },
  {
    id: 4,
    name: "Producto agotado",
    category: "General",
    price: "$30.000",
    stock: 0,
    status: "Agotado",
  },
];

const statusClasses: Record<Product["status"], string> = {
  Disponible:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  "Stock bajo":
    "border border-amber-200 bg-amber-50 text-amber-700",
  Agotado:
    "border border-red-200 bg-red-50 text-red-700",
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("Todos");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      stockFilter === "Todos" || product.status === stockFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Gestión de productos
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Productos
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Administra tu catálogo, inventario y disponibilidad.
            </p>
          </div>

          <button
            type="button"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo producto
          </button>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total productos
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              42
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Productos registrados
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Disponibles
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              35
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Con inventario disponible
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Stock bajo
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              5
            </p>

            <p className="mt-1 text-xs text-amber-600">
              Requieren reposición
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Valor del inventario
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              $8.450.000
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Valor estimado
            </p>
          </div>

        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Catálogo de productos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consulta precios, inventario y disponibilidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto..."
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
              />

              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="Todos">Todos</option>
                <option value="Disponible">Disponibles</option>
                <option value="Stock bajo">Stock bajo</option>
                <option value="Agotado">Agotados</option>
              </select>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-left">

              <thead className="bg-slate-50">

                <tr className="border-b border-slate-200">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Producto
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Categoría
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Precio
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acción
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredProducts.map((product) => (

                  <tr
                    key={product.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {product.name}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {product.category}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {product.price}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {product.stock} unidades
                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[product.status]}`}
                      >
                        {product.status}
                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <button
                        type="button"
                        className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Ver detalles
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {filteredProducts.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No encontramos productos con esos criterios.
            </div>
          )}

        </section>

      </div>
    </main>
  );
}