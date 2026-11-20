"use client";

import { useMemo, useState } from "react";

export type CatalogItem = {
  name: string;
  category: string;
  detail?: string;
};

export type CatalogSelection = {
  item: CatalogItem;
  price: number;
  cost: number;
  stock: number;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

/**
 * Ventana para agregar de una vez varios elementos de un catálogo sugerido.
 * Cada elemento marcado necesita su precio; lo demás se puede ajustar después.
 */
export default function CatalogPicker({
  title,
  description,
  items,
  existingNames,
  priceLabel,
  withStock = false,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  items: CatalogItem[];
  existingNames: string[];
  priceLabel: string;
  withStock?: boolean;
  confirmLabel: string;
  onConfirm: (selection: CatalogSelection[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [costs, setCosts] = useState<Record<string, string>>({});
  const [stocks, setStocks] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const existing = useMemo(
    () => new Set(existingNames.map((name) => name.trim().toLowerCase())),
    [existingNames],
  );

  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();

    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }

    return [...map.entries()];
  }, [items]);

  const isExisting = (item: CatalogItem) =>
    existing.has(item.name.trim().toLowerCase());

  function toggle(name: string) {
    setChecked((current) => {
      const next = new Set(current);

      if (next.has(name)) next.delete(name);
      else next.add(name);

      return next;
    });
  }

  function toggleGroup(list: CatalogItem[]) {
    const available = list.filter((item) => !isExisting(item));
    const allChecked = available.every((item) => checked.has(item.name));

    setChecked((current) => {
      const next = new Set(current);

      for (const item of available) {
        if (allChecked) next.delete(item.name);
        else next.add(item.name);
      }

      return next;
    });
  }

  function confirm() {
    const selected = items.filter((item) => checked.has(item.name) && !isExisting(item));

    if (selected.length === 0) {
      setError("Marca al menos uno.");
      return;
    }

    const missing = selected.filter((item) => !(Number(prices[item.name]) > 0));

    if (missing.length > 0) {
      setError(
        `Ponle ${priceLabel.toLowerCase()} a: ${missing.map((item) => item.name).join(", ")}.`,
      );
      return;
    }

    onConfirm(
      selected.map((item) => ({
        item,
        price: Number(prices[item.name]),
        cost: Math.max(Number(costs[item.name]) || 0, 0),
        stock: Math.max(Number(stocks[item.name]) || 0, 0),
      })),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {groups.length === 0 && (
            <p className="text-sm text-slate-500">
              Todavía no hay sugerencias para tu tipo de negocio. Puedes crearlos
              manualmente.
            </p>
          )}

          {groups.map(([category, list]) => (
            <section key={category} className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {category}
                </h3>
                <button
                  type="button"
                  onClick={() => toggleGroup(list)}
                  className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-300"
                >
                  Marcar todos
                </button>
              </div>

              <ul className="space-y-2">
                {list.map((item) => {
                  const added = isExisting(item);
                  const on = checked.has(item.name);

                  return (
                    <li
                      key={item.name}
                      className={`grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[1fr_auto] ${
                        added
                          ? "border-slate-100 opacity-50 dark:border-slate-800"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          disabled={added}
                          checked={on}
                          onChange={() => toggle(item.name)}
                        />
                        <span>
                          <span className="font-semibold">{item.name}</span>
                          {item.detail && (
                            <span className="ml-2 text-xs text-slate-500">{item.detail}</span>
                          )}
                          {added && (
                            <span className="ml-2 text-xs text-emerald-600">Ya agregado</span>
                          )}
                        </span>
                      </label>

                      {on && !added && (
                        <div className={`grid gap-2 ${withStock ? "grid-cols-3" : "grid-cols-1"}`}>
                          <input
                            type="number"
                            min="0"
                            value={prices[item.name] ?? ""}
                            onChange={(event) =>
                              setPrices((current) => ({ ...current, [item.name]: event.target.value }))
                            }
                            placeholder={priceLabel}
                            aria-label={`${priceLabel} de ${item.name}`}
                            className={inputClass}
                          />
                          {withStock && (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={costs[item.name] ?? ""}
                                onChange={(event) =>
                                  setCosts((current) => ({ ...current, [item.name]: event.target.value }))
                                }
                                placeholder="Costo"
                                aria-label={`Costo de ${item.name}`}
                                className={inputClass}
                              />
                              <input
                                type="number"
                                min="0"
                                value={stocks[item.name] ?? ""}
                                onChange={(event) =>
                                  setStocks((current) => ({ ...current, [item.name]: event.target.value }))
                                }
                                placeholder="Existencia"
                                aria-label={`Existencia de ${item.name}`}
                                className={inputClass}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <p className="self-center text-xs text-slate-500">
              {checked.size} marcado{checked.size === 1 ? "" : "s"}. Lo que falte
              lo agregas a mano después.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
