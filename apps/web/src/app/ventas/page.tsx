"use client";

import {
  loadProducts,
  recordInventoryMovement,
  saveProducts,
} from "../../lib/inventory/storage";
import type { Product } from "../../lib/inventory";

import { useEffect, useMemo, useState } from "react";

import {
  calculatePendingAmount,
  calculateSaleTotals,
} from "../../lib/sales";

import { loadSales, saveSales } from "../../lib/sales/storage";
import { syncSaleWithFinance } from "../../lib/sales/sync-finance";

import type {
  Sale,
  SaleItem,
  SalePayment,
} from "../../lib/sales";

type Service = {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number | string;
  status: string;
};

type DraftItem = {
  type: "service" | "product";
  referenceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const paymentLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  bank_transfer: "Transferencia",
  digital_wallet: "Billetera digital",
  credit: "Crédito",
  other: "Otro",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [salesLoaded, setSalesLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [customer, setCustomer] = useState("");
  const [worker, setWorker] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<SalePayment["method"]>("cash");

  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const [itemType, setItemType] =
    useState<DraftItem["type"]>("service");

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");

  const [itemError, setItemError] = useState("");

  const [paymentReceived, setPaymentReceived] =
    useState<number>(0);

  /*
   * Cargamos los datos existentes una sola vez.
   */
  useEffect(() => {
    setProducts(loadProducts());
    setSales(loadSales());
    setSalesLoaded(true);
  }, []);

  /*
   * Persistimos las ventas cuando ya terminaron de cargarse.
   */
  useEffect(() => {
    if (salesLoaded) {
      saveSales(sales);
    }
  }, [sales, salesLoaded]);

  /*
   * Calculamos los totales de la venta que se está construyendo.
   */
  const totals = useMemo(() => {
    const items: SaleItem[] = draftItems.map(
      (item, index) => ({
        id: `draft-${index}`,
        saleId: "draft",
        type: item.type,
        referenceId:
          item.referenceId ??
          `draft-reference-${index}`,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        tax: 0,
        total:
          item.quantity * item.unitPrice,
      }),
    );

    return calculateSaleTotals(items);
  }, [draftItems]);

  /*
   * Resumen general de ventas.
   */
  const summary = useMemo(() => {
    const confirmed = sales.filter(
      (sale) => sale.status === "confirmed",
    );

    const income = confirmed.reduce(
      (total, sale) =>
        total + sale.paid,
      0,
    );

    const pending = confirmed.reduce(
      (total, sale) =>
        total + sale.pending,
      0,
    );

    return {
      totalSales: confirmed.length,
      income,
      pending,
    };
  }, [sales]);

  /*
   * Valor que realmente se registrará como recibido.
   *
   * El crédito nunca representa dinero recibido.
   */
  const currentPaymentAmount =
    paymentMethod === "credit"
      ? 0
      : Math.min(
          Math.max(paymentReceived, 0),
          totals.total,
        );

  const currentPendingAmount = Math.max(
    totals.total -
      currentPaymentAmount,
    0,
  );

  /*
   * Agrega un producto o servicio al borrador.
   */
  function addItem() {
    const price = Number(itemPrice);
    const quantity = Number(itemQuantity);

    if (!itemName.trim()) {
      setItemError(
        "Escribe el nombre del servicio o producto.",
      );
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setItemError(
        "La cantidad debe ser mayor que 0.",
      );
      return;
    }

    let finalPrice = price;
    let referenceId:
      | string
      | undefined;

    /*
     * Los productos siempre deben existir
     * en Inventario.
     */
    if (itemType === "product") {
      const product = products.find(
        (current) =>
          current.active &&
          current.name
            .trim()
            .toLowerCase() ===
            itemName
              .trim()
              .toLowerCase(),
      );

      if (!product) {
        setItemError(
          "El producto no existe en Inventario. Selecciona o escribe exactamente un producto registrado.",
        );
        return;
      }

      if (quantity > product.stock) {
        setItemError(
          `Stock insuficiente. ${product.name} tiene ${product.stock} unidad(es) disponibles.`,
        );
        return;
      }

      referenceId = product.id;
      finalPrice = product.salePrice;
    } else {
      /*
       * Los servicios pueden utilizar
       * un precio ingresado manualmente.
       */
      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        setItemError(
          "Ingresa un precio válido mayor que $0.",
        );
        return;
      }
    }

    setItemError("");

    setDraftItems((current) => [
      ...current,
      {
        type: itemType,
        referenceId,
        name: itemName.trim(),
        quantity,
        unitPrice: finalPrice,
      },
    ]);

    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setItemError("");
  }

  /*
   * Elimina un concepto del borrador.
   */
  function removeItem(index: number) {
    setDraftItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  /*
   * Crea la venta completa.
   */
  function createSale() {
    if (
      draftItems.length === 0 ||
      totals.total <= 0
    ) {
      setItemError(
        "Agrega al menos un concepto antes de confirmar la venta.",
      );
      return;
    }

    /*
     * Una venta normal debe tener algún
     * valor recibido.
     *
     * Si no se recibe dinero, se debe
     * seleccionar Crédito.
     */
    if (
      paymentMethod !== "credit" &&
      currentPaymentAmount <= 0
    ) {
      setItemError(
        "Ingresa el valor recibido o selecciona Crédito si el cliente pagará posteriormente.",
      );
      return;
    }

    const now =
      new Date().toISOString();

    /*
     * Consolidamos las cantidades de productos
     * para evitar descontar inventario de forma
     * incorrecta si el mismo producto aparece
     * varias veces.
     */
    const productQuantities =
      new Map<string, number>();

    for (const item of draftItems) {
      if (
        item.type !== "product" ||
        !item.referenceId
      ) {
        continue;
      }

      const currentQuantity =
        productQuantities.get(
          item.referenceId,
        ) ?? 0;

      productQuantities.set(
        item.referenceId,
        currentQuantity +
          item.quantity,
      );
    }

    /*
     * Validamos TODO el inventario antes
     * de modificar cualquier producto.
     */
    for (const [
      productId,
      quantity,
    ] of productQuantities) {
      const product =
        products.find(
          (current) =>
            current.id === productId,
        );

      if (!product) {
        setItemError(
          "Uno de los productos de la venta ya no existe en Inventario.",
        );
        return;
      }

      if (
        quantity > product.stock
      ) {
        setItemError(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}. Solicitado: ${quantity}.`,
        );
        return;
      }
    }

    /*
     * El crédito no genera ingreso.
     * Solo el dinero efectivamente recibido
     * alimenta Finanzas.
     */
    const paymentAmount =
      paymentMethod === "credit"
        ? 0
        : currentPaymentAmount;

    const saleId =
      crypto.randomUUID();

    /*
     * Construimos los conceptos definitivos
     * de la venta.
     */
    const items: SaleItem[] =
      draftItems.map((item) => ({
        id: crypto.randomUUID(),
        saleId,
        type: item.type,
        referenceId:
          item.referenceId ??
          crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        tax: 0,
        total:
          item.quantity *
          item.unitPrice,
        workerId:
          worker || undefined,
      }));

    /*
     * Solo creamos un Payment si realmente
     * entró dinero.
     */
    const salePayments:
      SalePayment[] =
      paymentAmount > 0
        ? [
            {
              id: crypto.randomUUID(),
              saleId,
              amount: paymentAmount,
              method: paymentMethod,
              date: now,
            },
          ]
        : [];

    const paid =
      salePayments.reduce(
        (total, payment) =>
          total + payment.amount,
        0,
      );

    const pending =
      calculatePendingAmount(
        totals.total,
        paid,
      );

    /*
     * Creamos la venta.
     */
    const sale: Sale = {
      id: saleId,
      businessId:
        "current-business",
      customerId:
        customer || undefined,
      workerId:
        worker || undefined,
      items,
      payments: salePayments,
      subtotal:
        totals.subtotal,
      discount:
        totals.discount,
      tax:
        totals.tax,
      total:
        totals.total,
      paid,
      pending,
      status: "confirmed",
      date: now,
      createdBy:
        "current-user",
    };

    /*
     * Actualizamos Inventario únicamente
     * después de validar que toda la venta
     * puede realizarse.
     */
    let updatedProducts =
      [...products];

    for (const [
      productId,
      quantity,
    ] of productQuantities) {
      const product =
        updatedProducts.find(
          (current) =>
            current.id === productId,
        );

      if (!product) {
        continue;
      }

      const updatedProduct = {
        ...product,
        stock:
          product.stock -
          quantity,
      };

      updatedProducts =
        updatedProducts.map(
          (current) =>
            current.id === productId
              ? updatedProduct
              : current,
        );

      /*
       * Registramos el movimiento
       * de inventario asociado directamente
       * con la venta.
       */
      recordInventoryMovement({
        id: crypto.randomUUID(),
        businessId:
          "current-business",
        productId,
        type: "sale",
        quantity,
        unitCost:
          product.cost,
        referenceId:
          saleId,
        date: now,
        userId:
          "current-user",
        notes:
          `Salida por venta ${saleId}`,
      });
    }

    const nextSales = [
      sale,
      ...sales,
    ];

    /*
     * Persistimos Inventario.
     */
    setProducts(
      updatedProducts,
    );

    saveProducts(
      updatedProducts,
    );

    /*
     * Persistimos Ventas.
     */
    setSales(nextSales);
    saveSales(nextSales);

    /*
     * Sincronizamos la venta con:
     *
     * Venta
     *   ↓
     * Operación
     *   ↓
     * Pago
     *   ↓
     * Finanzas
     *
     * El importe registrado será únicamente
     * el dinero efectivamente recibido.
     */
    syncSaleWithFinance(sale);

    /*
     * Limpiamos completamente el formulario.
     */
    setItemError("");
    setCustomer("");
    setWorker("");
    setPaymentMethod("cash");
    setPaymentReceived(0);
    setDraftItems([]);
    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ENCABEZADO */}

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
              VEXIA · Finanzas
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ventas
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Registra y controla las operaciones comerciales de tu empresa.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowForm(
                (value) => !value,
              )
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
          >
            {showForm
              ? "Cerrar venta"
              : "+ Nueva venta"}
          </button>
        </section>

        {/* MÉTRICAS */}

        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            title="Ventas confirmadas"
            value={String(
              summary.totalSales,
            )}
            description="Operaciones registradas"
          />

          <MetricCard
            title="Ingresos recibidos"
            value={formatMoney(
              summary.income,
            )}
            description="Pagos efectivamente registrados"
          />

          <MetricCard
            title="Por cobrar"
            value={formatMoney(
              summary.pending,
            )}
            description="Saldo pendiente de ventas"
          />
        </section>

        {/* FORMULARIO */}

        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Registrar nueva venta
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Agrega servicios o productos y define cómo fue pagada la operación.
              </p>
            </div>

            {/* CLIENTE / TRABAJADOR */}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Cliente"
                value={customer}
                onChange={
                  setCustomer
                }
                placeholder="Nombre del cliente"
              />

              <Input
                label="Trabajador / vendedor"
                value={worker}
                onChange={
                  setWorker
                }
                placeholder="Responsable de la venta"
              />
            </div>

            {/* AGREGAR CONCEPTO */}

            <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Agregar concepto
              </h3>

              <div className="mt-4 grid gap-3 md:grid-cols-4">

                <select
                  value={itemType}
                  onChange={(
                    event,
                  ) =>
                    setItemType(
                      event.target
                        .value as DraftItem["type"],
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="service">
                    Servicio
                  </option>

                  <option value="product">
                    Producto
                  </option>
                </select>

                <input
                  value={itemName}
                  onChange={(
                    event,
                  ) =>
                    setItemName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Nombre"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <input
                  type="number"
                  min="1"
                  value={
                    itemQuantity
                  }
                  onChange={(
                    event,
                  ) =>
                    setItemQuantity(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Cantidad"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <input
                  type="number"
                  min="0"
                  value={itemPrice}
                  onChange={(
                    event,
                  ) =>
                    setItemPrice(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Precio"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {itemError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  {itemError}
                </p>
              )}

              <button
                type="button"
                onClick={
                  addItem
                }
                className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                + Agregar concepto
              </button>
            </div>

            {/* CONCEPTOS */}

            {draftItems.length >
              0 && (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {draftItems.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.type ===
                            "service"
                              ? "Servicio"
                              : "Producto"}{" "}
                            ·{" "}
                            {
                              item.quantity
                            }{" "}
                            ×{" "}
                            {formatMoney(
                              item.unitPrice,
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <strong className="text-slate-900 dark:text-white">
                            {formatMoney(
                              item.quantity *
                                item.unitPrice,
                            )}
                          </strong>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index,
                              )
                            }
                            className="text-sm text-red-600 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* PAGO / RESUMEN */}

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">

              <div>

                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Método de pago
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentMethod(
                      event.target
                        .value as SalePayment["method"],
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {Object.entries(
                    paymentLabels,
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          label
                        }
                      </option>
                    ),
                  )}
                </select>

                {/* VALOR RECIBIDO */}

                {paymentMethod !==
                  "credit" && (
                  <div className="mt-3">

                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Valor recibido
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={
                        totals.total
                      }
                      value={
                        paymentReceived
                      }
                      onChange={(
                        event,
                      ) =>
                        setPaymentReceived(
                          Math.min(
                            Math.max(
                              Number(
                                event
                                  .target
                                  .value,
                              ) || 0,
                              0,
                            ),
                            totals.total,
                          ),
                        )
                      }
                      placeholder="0"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Puedes registrar un pago completo o parcial.
                    </p>
                  </div>
                )}

                {/* ESTADO DEL PAGO */}

                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Pagado
                    </span>

                    <span className="font-semibold text-green-600">
                      {formatMoney(
                        currentPaymentAmount,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Pendiente
                    </span>

                    <span className="font-semibold text-amber-600">
                      {formatMoney(
                        currentPendingAmount,
                      )}
                    </span>
                  </div>
                </div>

                {/* CRÉDITO */}

                {paymentMethod ===
                  "credit" && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    La venta quedará pendiente de cobro. No se registrará ingreso hasta que el cliente efectivamente pague.
                  </p>
                )}

              </div>

              {/* TOTAL */}

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">

                <div className="flex justify-between text-sm text-slate-500">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatMoney(
                      totals.subtotal,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-slate-500">
                  <span>
                    Descuentos
                  </span>

                  <span>
                    {formatMoney(
                      totals.discount,
                    )}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold dark:border-slate-800">

                  <span className="text-slate-900 dark:text-white">
                    Total
                  </span>

                  <span className="text-slate-900 dark:text-white">
                    {formatMoney(
                      totals.total,
                    )}
                  </span>

                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Estado
                  </span>

                  <span
                    className={
                      currentPendingAmount ===
                      0
                        ? "font-semibold text-green-600"
                        : "font-semibold text-amber-600"
                    }
                  >
                    {currentPendingAmount ===
                    0
                      ? "Pagada"
                      : "Pendiente"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    createSale
                  }
                  disabled={
                    draftItems.length ===
                    0
                  }
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900"
                >
                  Confirmar venta
                </button>
              </div>
            </div>
          </section>
        )}

        {/* HISTORIAL */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 p-5 dark:border-slate-800">

            <h2 className="font-bold text-slate-900 dark:text-white">
              Historial de ventas
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Las cifras de esta sección se calculan a partir de las ventas registradas.
            </p>
          </div>

          {sales.length ===
          0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">
                $
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                Todavía no hay ventas
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Cuando registres la primera operación aparecerá aquí y sus valores alimentarán las métricas de Ventas.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">

              {sales.map(
                (sale) => (
                  <div
                    key={
                      sale.id
                    }
                    className="p-5 transition hover:bg-slate-50 dark:hover:bg-slate-950"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          Venta #
                          {sale.id
                            .slice(
                              0,
                              8,
                            )
                            .toUpperCase()}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(
                            sale.date,
                          ).toLocaleString(
                            "es-CO",
                          )}

                          {sale.customerId
                            ? ` · Cliente: ${sale.customerId}`
                            : ""}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">

                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatMoney(
                            sale.total,
                          )}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Pagado:{" "}
                          {formatMoney(
                            sale.paid,
                          )}{" "}
                          · Pendiente:{" "}
                          {formatMoney(
                            sale.pending,
                          )}
                        </p>

                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">

                      {sale.items.map(
                        (item) => (
                          <span
                            key={
                              item.id
                            }
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {
                              item.quantity
                            }{" "}
                            ×{" "}
                            {
                              item.name
                            }
                          </span>
                        ),
                      )}

                    </div>

                  </div>
                ),
              )}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}

/*
 * Tarjeta de métrica.
 */
function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {description}
      </p>

    </article>
  );
}

/*
 * Campo de entrada reutilizable.
 *
 * IMPORTANTE:
 * Este componente NO conoce paymentMethod,
 * paymentReceived ni totals.
 *
 * Así evitamos el error que teníamos antes.
 */
function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder: string;
}) {
  return (
    <label className="block">

      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />

    </label>
  );
} 