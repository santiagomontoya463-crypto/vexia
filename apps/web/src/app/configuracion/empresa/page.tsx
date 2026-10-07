"use client";

import { useMemo, useState } from "react";

type Category = {
  id: string;
  icon: string;
  name: string;
  description: string;
  examples: string[];
};

type Module = {
  id: string;
  icon: string;
  name: string;
  description: string;
  recommended?: boolean;
};

const categories: Category[] = [
  {
    id: "servicios",
    icon: "🧑‍💼",
    name: "Servicios profesionales",
    description: "Empresas que venden conocimiento, atención o servicios especializados.",
    examples: ["Consultoría", "Asesoría", "Contabilidad", "Abogados", "Marketing"],
  },
  {
    id: "belleza",
    icon: "✨",
    name: "Belleza y bienestar",
    description: "Negocios dedicados al cuidado personal, estética y bienestar.",
    examples: ["Barbería", "Spa", "Salón", "Uñas", "Masajes"],
  },
  {
    id: "salud",
    icon: "🏥",
    name: "Salud",
    description: "Clínicas, centros médicos y profesionales de la salud.",
    examples: ["Clínica", "Hospital", "Odontología", "Fisioterapia", "Especialistas"],
  },
  {
    id: "comercio",
    icon: "🛍️",
    name: "Comercio y retail",
    description: "Empresas que venden productos físicos al consumidor.",
    examples: ["Ropa", "Calzado", "Perfumería", "Tecnología", "Supermercado"],
  },
  {
    id: "restaurantes",
    icon: "🍽️",
    name: "Restaurantes y alimentos",
    description: "Negocios de alimentación, bebidas y atención gastronómica.",
    examples: ["Restaurante", "Cafetería", "Panadería", "Bar", "Comida rápida"],
  },
  {
    id: "automotriz",
    icon: "🔧",
    name: "Automotriz",
    description: "Talleres, centros de servicio y negocios relacionados con vehículos.",
    examples: ["Taller", "Motos", "Carros", "Lavado", "Repuestos"],
  },
  {
    id: "tecnologia",
    icon: "💻",
    name: "Tecnología y servicio técnico",
    description: "Empresas que reparan, mantienen o desarrollan soluciones tecnológicas.",
    examples: ["Servicio técnico", "Computadores", "Redes", "Software", "Electrónica"],
  },
  {
    id: "educacion",
    icon: "🎓",
    name: "Educación",
    description: "Instituciones y profesionales dedicados a la formación.",
    examples: ["Colegio", "Academia", "Cursos", "Idiomas", "Tutorías"],
  },
  {
    id: "construccion",
    icon: "🏗️",
    name: "Construcción e infraestructura",
    description: "Empresas de construcción, mantenimiento e infraestructura.",
    examples: ["Construcción", "Obras", "Electricidad", "Plomería", "Mantenimiento"],
  },
  {
    id: "transporte",
    icon: "🚚",
    name: "Transporte y logística",
    description: "Empresas que movilizan personas, productos o mercancías.",
    examples: ["Transporte", "Mensajería", "Envíos", "Mudanzas", "Logística"],
  },
  {
    id: "inmobiliario",
    icon: "🏢",
    name: "Inmobiliario",
    description: "Empresas dedicadas a propiedades, administración y servicios inmobiliarios.",
    examples: ["Inmobiliaria", "Administración", "Arriendos", "Ventas", "Propiedades"],
  },
  {
    id: "entretenimiento",
    icon: "🎟️",
    name: "Entretenimiento y eventos",
    description: "Empresas que organizan experiencias, eventos o entretenimiento.",
    examples: ["Eventos", "Fotografía", "Producción", "Discotecas", "Experiencias"],
  },
  {
    id: "otro",
    icon: "🌐",
    name: "Otro tipo de empresa",
    description: "Para negocios que no encajan en una categoría específica.",
    examples: ["Personalizado", "Especializado", "Nuevo sector"],
  },
];

const modules: Module[] = [
  {
    id: "clientes",
    icon: "👥",
    name: "Clientes",
    description: "Base de clientes, perfiles, historial y comunicación.",
    recommended: true,
  },
  {
    id: "trabajadores",
    icon: "👤",
    name: "Trabajadores",
    description: "Equipo, cargos, horarios, permisos y asignaciones.",
    recommended: true,
  },
  {
    id: "servicios",
    icon: "🧩",
    name: "Servicios",
    description: "Catálogo de servicios, precios, duración y responsables.",
    recommended: true,
  },
  {
    id: "reservas",
    icon: "📅",
    name: "Agenda y reservas",
    description: "Citas, disponibilidad, reprogramaciones y cancelaciones.",
    recommended: true,
  },
  {
    id: "ventas",
    icon: "💳",
    name: "Ventas",
    description: "Ventas, pagos, descuentos, vendedores e historial.",
    recommended: true,
  },
  {
    id: "productos",
    icon: "📦",
    name: "Productos e inventario",
    description: "Productos, existencias, SKU, movimientos y alertas.",
  },
  {
    id: "ordenes",
    icon: "🛠️",
    name: "Órdenes de trabajo",
    description: "Trabajos, diagnósticos, responsables, estados y seguimiento.",
  },
  {
    id: "entregas",
    icon: "🚚",
    name: "Entregas y logística",
    description: "Domicilios, envíos, recogidas y entregas programadas.",
  },
  {
    id: "sedes",
    icon: "🏢",
    name: "Sedes y sucursales",
    description: "Múltiples ubicaciones, equipos y operaciones.",
  },
  {
    id: "proveedores",
    icon: "🤝",
    name: "Proveedores",
    description: "Proveedores, compras, contactos y condiciones.",
  },
  {
    id: "reportes",
    icon: "📊",
    name: "Reportes y analítica",
    description: "Indicadores, estadísticas y rendimiento del negocio.",
  },
  {
    id: "comunicaciones",
    icon: "💬",
    name: "Comunicaciones",
    description: "Notificaciones y comunicación con clientes y equipo.",
  },
];

const sizes = [
  { id: "independiente", label: "Independiente", description: "Trabajo individual" },
  { id: "micro", label: "Microempresa", description: "1 a 10 personas" },
  { id: "pequena", label: "Pequeña", description: "11 a 50 personas" },
  { id: "mediana", label: "Mediana", description: "51 a 250 personas" },
  { id: "grande", label: "Grande", description: "Más de 250 personas" },
];

const channels = [
  { id: "presencial", icon: "🏢", label: "Atención presencial" },
  { id: "cita", icon: "📅", label: "Citas / reservas" },
  { id: "domicilio", icon: "🛵", label: "Domicilios" },
  { id: "envios", icon: "📦", label: "Envíos" },
  { id: "recogida", icon: "🏪", label: "Recoger en establecimiento" },
  { id: "ubicacion", icon: "📍", label: "Servicio en ubicación del cliente" },
  { id: "online", icon: "🌐", label: "Venta o atención online" },
  { id: "virtual", icon: "💻", label: "Atención virtual" },
];

export default function EmpresaConfigPage() {
  const [category, setCategory] = useState("servicios");
  const [subcategory, setSubcategory] = useState("");
  const [size, setSize] = useState("micro");
  const [activeModules, setActiveModules] = useState<string[]>([
    "clientes",
    "trabajadores",
    "servicios",
    "reservas",
    "ventas",
  ]);
  const [activeChannels, setActiveChannels] = useState<string[]>([
    "presencial",
    "cita",
  ]);
  const [saved, setSaved] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === category),
    [category]
  );

  const toggleModule = (id: string) => {
    setSaved(false);
    setActiveModules((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleChannel = (id: string) => {
    setSaved(false);
    setActiveChannels((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#07101d] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Configuración</span>
            <span>/</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Empresa y capacidades
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                VEXIA · Configuración inteligente
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Configuremos cómo funciona tu empresa
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                VEXIA se adapta a tu negocio. Activa solamente las capacidades
                que necesitas y podrás ampliarlas cuando tu empresa crezca.
              </p>
            </div>

            <button
              onClick={save}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {saved ? "✓ Cambios guardados" : "Guardar configuración"}
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c1726] sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Paso 01
              </p>
              <h2 className="mt-1 text-xl font-bold">¿Qué tipo de empresa tienes?</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Esto ayuda a VEXIA a proponerte una configuración inicial.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((item) => {
                const active = category === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCategory(item.id);
                      setSubcategory("");
                      setSaved(false);
                    }}
                    className={`group rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/15 dark:border-blue-400 dark:bg-blue-950/25"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0a1422] dark:hover:border-slate-600 dark:hover:bg-[#0e1b2d]"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      {active && (
                        <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedCategory && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#091321]">
                <label className="text-sm font-semibold">
                  Especialidad o tipo específico
                </label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Opcional. Ayuda a personalizar todavía más la experiencia.
                </p>

                <select
                  value={subcategory}
                  onChange={(event) => {
                    setSubcategory(event.target.value);
                    setSaved(false);
                  }}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-[#0c1726]"
                >
                  <option value="">Seleccionar especialidad...</option>
                  {selectedCategory.examples.map((example) => (
                    <option key={example} value={example}>
                      {example}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c1726] sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Paso 02
              </p>
              <h2 className="mt-1 text-xl font-bold">Tamaño de la empresa</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                VEXIA puede crecer contigo. Esta información sirve para ajustar
                recomendaciones y experiencia.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sizes.map((item) => {
                const active = size === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSize(item.id);
                      setSaved(false);
                    }}
                    className={`rounded-xl border p-4 text-left ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/25"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {active && <span className="text-blue-600">✓</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c1726] sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Paso 03
              </p>
              <h2 className="mt-1 text-xl font-bold">¿Cómo atiendes a tus clientes?</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Puedes seleccionar varias opciones. Nada es obligatorio.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map((channel) => {
                const active = activeChannels.includes(channel.id);

                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/25"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-xl">{channel.icon}</span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">
                      {channel.label}
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0c1726] sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Paso 04
                </p>
                <h2 className="mt-1 text-xl font-bold">Módulos de VEXIA</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Activa lo que tu empresa necesita. Podrás añadir más módulos
                  conforme el negocio crezca.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {activeModules.length} módulos activos
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const active = activeModules.includes(module.id);

                return (
                  <button
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                        {module.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold">{module.name}</h3>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                              active
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {active ? "✓" : ""}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {module.description}
                        </p>

                        {module.recommended && (
                          <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-900/50 dark:from-blue-950/25 dark:to-[#0c1726] sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Vista previa
                </span>
                <h2 className="mt-1 text-xl font-bold">
                  Tu VEXIA se adaptará a esta configuración
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Esta configuración será la base para que los demás módulos
                  entiendan qué puede hacer tu empresa, qué usuarios necesita,
                  qué información mostrar y qué procesos habilitar.
                </p>
              </div>

              <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#0b1523]">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Configuración actual
                </div>
                <div className="mt-2 text-sm font-bold">
                  {selectedCategory?.name}
                </div>
                {subcategory && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {subcategory}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeModules.slice(0, 5).map((id) => {
                    const module = modules.find((item) => item.id === id);
                    return module ? (
                      <span
                        key={id}
                        className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold dark:bg-slate-800"
                      >
                        {module.name}
                      </span>
                    ) : null;
                  })}
                  {activeModules.length > 5 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      +{activeModules.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
