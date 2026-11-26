"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { MODULES } from "../../lib/modules";
import { cardClass, inputClass, primaryButton, type Plan } from "./shared";

export default function PlansTab({
  plans,
  onChanged,
  flash,
  setError,
}: {
  plans: Plan[];
  onChanged: () => Promise<void>;
  flash: (message: string) => void;
  setError: (message: string) => void;
}) {
  const { supabase } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, Plan>>({});

  const current = (plan: Plan): Plan => drafts[plan.id] ?? plan;

  function change(plan: Plan, changes: Partial<Plan>) {
    setDrafts((existing) => ({
      ...existing,
      [plan.id]: { ...(existing[plan.id] ?? plan), ...changes },
    }));
  }

  async function save(plan: Plan) {
    if (!supabase) return;

    const draft = current(plan);

    const { error } = await supabase
      .from("plans")
      .update({
        name: draft.name.trim(),
        description: draft.description,
        price_monthly: draft.price_monthly,
        max_users: draft.max_users,
        active: draft.active,
        modules: draft.modules,
      })
      .eq("id", plan.id);

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    setDrafts((existing) => {
      const next = { ...existing };
      delete next[plan.id];
      return next;
    });
    flash(`Plan ${draft.name} guardado.`);
    await onChanged();
  }

  async function create() {
    if (!supabase) return;

    const name = window.prompt("Nombre del nuevo plan:");

    if (!name || !name.trim()) return;

    const { error } = await supabase.from("plans").insert({
      name: name.trim(),
      price_monthly: 0,
      modules: MODULES.map((module) => module.id),
      sort_order: plans.length + 1,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setError("");
    await onChanged();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Define los precios y los módulos de cada plan. El precio mensual se usa para sugerir el
          valor al registrar un pago.
        </p>
        <button type="button" onClick={() => void create()} className={primaryButton}>
          + Nuevo plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {plans.map((original) => {
          const plan = current(original);

          return (
            <article key={original.id} className={cardClass}>
              <div className="grid gap-3">
                <label className="text-sm font-medium">
                  Nombre
                  <input
                    value={plan.name}
                    onChange={(event) => change(original, { name: event.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <label className="text-sm font-medium">
                  Descripción
                  <input
                    value={plan.description ?? ""}
                    onChange={(event) => change(original, { description: event.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium">
                    Precio mensual (COP)
                    <input
                      type="number"
                      min="0"
                      value={plan.price_monthly}
                      onChange={(event) =>
                        change(original, { price_monthly: Number(event.target.value) })
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Máx. usuarios
                    <input
                      type="number"
                      min="1"
                      placeholder="Sin límite"
                      value={plan.max_users ?? ""}
                      onChange={(event) =>
                        change(original, {
                          max_users: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium">Módulos</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {MODULES.map((module) => (
                      <label key={module.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.modules.includes(module.id)}
                          onChange={(event) =>
                            change(original, {
                              modules: event.target.checked
                                ? [...plan.modules, module.id]
                                : plan.modules.filter((item) => item !== module.id),
                            })
                          }
                        />
                        {module.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={plan.active}
                    onChange={(event) => change(original, { active: event.target.checked })}
                  />
                  Plan disponible
                </label>

                <button
                  type="button"
                  onClick={() => void save(original)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white/10"
                >
                  Guardar plan
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
