"use client";

import { useEffect, useMemo, useState } from "react";
import { TYPE_GROUPS } from "../lib/industry";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Selector de tipo de negocio, agrupado por sector y con buscador. */
export default function BusinessTypePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Elige tu tipo de negocio",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const term = normalize(query.trim());

  const groups = useMemo(() => {
    if (!term) return TYPE_GROUPS;

    return TYPE_GROUPS.map((group) => ({
      ...group,
      types: group.types.filter(
        (item) =>
          normalize(item.label).includes(term) ||
          normalize(group.group).includes(term),
      ),
    })).filter((group) => group.types.length > 0);
  }, [term]);

  const exactMatch = TYPE_GROUPS.some((group) =>
    group.types.some((item) => normalize(item.label) === term),
  );

  const currentGroup = TYPE_GROUPS.find((group) =>
    group.types.some((item) => normalize(item.label) === normalize(value)),
  );

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        <span className="min-w-0">
          {value ? (
            <>
              <span className="block truncate font-medium">{value}</span>
              {currentGroup && currentGroup.group !== value && (
                <span className="block truncate text-xs text-slate-500">
                  {currentGroup.group}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar lista"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />

          <div
            role="listbox"
            className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-200 p-2 dark:border-slate-700">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar: barbería, clínica, ferretería..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="max-h-[min(60vh,22rem)] overflow-y-auto p-1">
              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={() => choose(query.trim())}
                  className="mb-1 w-full rounded-lg bg-violet-50 px-3 py-2 text-left text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:bg-white/5 dark:text-violet-200"
                >
                  Usar «{query.trim()}» como mi tipo de negocio
                </button>
              )}

              {groups.map((group) => (
                <div key={group.group} className="py-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {group.group}
                  </p>

                  {group.types.map((item) => {
                    const selected = normalize(item.label) === normalize(value);

                    return (
                      <button
                        key={`${group.group}-${item.label}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => choose(item.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          selected
                            ? "bg-violet-100 font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-100"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                        }`}
                      >
                        {item.label}
                        {selected && <span aria-hidden="true">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ))}

              {groups.length === 0 && !query.trim() && (
                <p className="p-3 text-sm text-slate-500">Sin resultados.</p>
              )}

              {groups.length === 0 && query.trim() && (
                <p className="p-3 text-xs text-slate-500">
                  No hay un tipo igual en la lista. Puedes usar tu propio nombre
                  con el botón de arriba.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
