"use client";

import { useEffect, useState } from "react";

type Tab =
  | "general"
  | "usuarios"
  | "notificaciones"
  | "reservas"
  | "clientes"
  | "seguridad";

type Theme = "light" | "dark" | "system";

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "Activo" | "Pendiente" | "Inactivo";
};

const permissions = [
  "Dashboard",
  "Clientes",
  "Reservas",
  "Servicios",
  "Productos",
  "Mi negocio",
  "Configuración",
  "Usuarios y roles",
];

const initialRoles: Role[] = [
  {
    id: "owner",
    name: "Propietario",
    description:
      "Control completo del negocio y de sus usuarios.",
    permissions: [...permissions],
  },
  {
    id: "manager",
    name: "Gerente / Supervisor",
    description:
      "Supervisa la operación y el equipo de trabajo.",
    permissions: [
      "Dashboard",
      "Clientes",
      "Reservas",
      "Servicios",
      "Productos",
    ],
  },
  {
    id: "admin",
    name: "Administrador",
    description:
      "Gestiona las funciones administrativas asignadas.",
    permissions: [
      "Dashboard",
      "Clientes",
      "Reservas",
      "Servicios",
    ],
  },
  {
    id: "worker",
    name: "Trabajador",
    description:
      "Acceso limitado a las funciones necesarias para su trabajo.",
    permissions: [
      "Dashboard",
      "Reservas",
      "Servicios",
    ],
  },
];

const initialUsers: User[] = [
  {
    id: 1,
    name: "Propietario principal",
    email: "propietario@negocio.com",
    role: "Propietario",
    status: "Activo",
  },
  {
    id: 2,
    name: "Usuario administrativo",
    email: "admin@negocio.com",
    role: "Administrador",
    status: "Activo",
  },
];

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  root.setAttribute("data-theme", theme);

  const systemDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" && systemDark);

  root.classList.toggle("dark", shouldUseDark);

  localStorage.setItem(
    "vexia-theme",
    theme
  );
}

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] =
    useState<Tab>("general");

  const [saved, setSaved] =
    useState(false);

  const [theme, setTheme] =
    useState<Theme>("system");

  const [roles, setRoles] =
    useState<Role[]>(initialRoles);

  const [selectedRole, setSelectedRole] =
    useState("owner");

  const [users, setUsers] =
    useState<User[]>(initialUsers);

  const [showUserForm, setShowUserForm] =
    useState(false);

  const [newUserName, setNewUserName] =
    useState("");

  const [newUserEmail, setNewUserEmail] =
    useState("");

  const [newUserRole, setNewUserRole] =
    useState("Trabajador");

  const [businessName, setBusinessName] =
    useState("Mi negocio");

  const [timezone, setTimezone] =
    useState("America/Bogota");

  const [currency, setCurrency] =
    useState("COP");

  const [timeFormat, setTimeFormat] =
    useState("24");

  const [language, setLanguage] =
    useState("es");

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(
        "vexia-theme"
      ) as Theme | null;

    const savedBusinessName =
      localStorage.getItem(
        "vexia-business-name"
      );

    const savedTimezone =
      localStorage.getItem(
        "vexia-timezone"
      );

    const savedCurrency =
      localStorage.getItem(
        "vexia-currency"
      );

    const savedTimeFormat =
      localStorage.getItem(
        "vexia-time-format"
      );

    const savedLanguage =
      localStorage.getItem(
        "vexia-language"
      );

    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      applyTheme("system");
    }

    if (savedBusinessName) {
      setBusinessName(savedBusinessName);
    }

    if (savedTimezone) {
      setTimezone(savedTimezone);
    }

    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    if (savedTimeFormat) {
      setTimeFormat(savedTimeFormat);
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleSystemThemeChange = () => {
      const currentTheme =
        localStorage.getItem(
          "vexia-theme"
        ) as Theme | null;

      if (currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  const tabs = [
    {
      id: "general" as Tab,
      label: "General",
      description: "Preferencias del sistema",
    },
    {
      id: "usuarios" as Tab,
      label: "Usuarios y roles",
      description: "Equipo y permisos",
    },
    {
      id: "notificaciones" as Tab,
      label: "Notificaciones",
      description: "Avisos y recordatorios",
    },
    {
      id: "reservas" as Tab,
      label: "Reservas",
      description: "Reglas de agenda",
    },
    {
      id: "clientes" as Tab,
      label: "Clientes",
      description: "Experiencia del cliente",
    },
    {
      id: "seguridad" as Tab,
      label: "Seguridad",
      description: "Verificación de acceso",
    },
  ];

  const selectedRoleData =
    roles.find(
      (role) => role.id === selectedRole
    ) || roles[0];

  const handleThemeChange = (
    newTheme: Theme
  ) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const saveChanges = () => {
    localStorage.setItem(
      "vexia-theme",
      theme
    );

    localStorage.setItem(
      "vexia-business-name",
      businessName
    );

    localStorage.setItem(
      "vexia-timezone",
      timezone
    );

    localStorage.setItem(
      "vexia-currency",
      currency
    );

    localStorage.setItem(
      "vexia-time-format",
      timeFormat
    );

    localStorage.setItem(
      "vexia-language",
      language
    );

    applyTheme(theme);

    setSaved(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setTimeout(() => {
      setSaved(false);
    }, 3500);
  };

  const togglePermission = (
    permission: string
  ) => {
    setRoles((currentRoles) =>
      currentRoles.map((role) => {
        if (role.id !== selectedRole) {
          return role;
        }

        const exists =
          role.permissions.includes(
            permission
          );

        return {
          ...role,
          permissions: exists
            ? role.permissions.filter(
                (item) =>
                  item !== permission
              )
            : [
                ...role.permissions,
                permission,
              ],
        };
      })
    );
  };

  const addUser = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !newUserName.trim() ||
      !newUserEmail.trim()
    ) {
      return;
    }

    const user: User = {
      id: Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: "Pendiente",
    };

    setUsers((current) => [
      ...current,
      user,
    ]);

    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("Trabajador");
    setShowUserForm(false);
  };

  const toggleUserStatus = (
    userId: number
  ) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        return {
          ...user,
          status:
            user.status === "Activo"
              ? "Inactivo"
              : "Activo",
        };
      })
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">

          <p className="mb-1 text-sm font-medium text-slate-500">
            Administración
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Configuración
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Personaliza el funcionamiento de VEXIA,
            administra tu equipo y define cómo
            interactúan tus clientes con el negocio.
          </p>

        </div>

        {/* SUCCESS */}

        {saved && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

            <span>
              ✓ Los cambios fueron guardados correctamente.
            </span>

            <button
              type="button"
              onClick={() => setSaved(false)}
              className="cursor-pointer text-emerald-700 hover:text-emerald-900"
            >
              ×
            </button>

          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">

          {/* SIDEBAR */}

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">

            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`mb-1 w-full cursor-pointer rounded-xl px-4 py-3 text-left transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >

                <span className="block text-sm font-semibold">
                  {tab.label}
                </span>

                <span
                  className={`mt-1 block text-xs ${
                    activeTab === tab.id
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {tab.description}
                </span>

              </button>
            ))}

          </aside>

          {/* CONTENT */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

            {/* GENERAL */}

            {activeTab === "general" && (
              <div>

                <div className="mb-8">

                  <h2 className="text-xl font-semibold">
                    Configuración general
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Personaliza la información y el
                    comportamiento general de tu negocio.
                  </p>

                </div>

                <div className="space-y-8">

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Información básica
                    </h3>

                    <div>

                      <label className="mb-2 block text-sm font-medium">
                        Nombre del espacio
                      </label>

                      <input
                        type="text"
                        value={businessName}
                        onChange={(event) =>
                          setBusinessName(
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        Nombre utilizado para identificar
                        tu negocio dentro de VEXIA.
                      </p>

                    </div>

                  </div>

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Región y formato
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                      <SelectValue
                        label="Zona horaria"
                        value={timezone}
                        onChange={setTimezone}
                        options={[
                          [
                            "America/Bogota",
                            "Colombia — Bogotá",
                          ],
                          [
                            "America/New_York",
                            "Estados Unidos — Nueva York",
                          ],
                          [
                            "America/Mexico_City",
                            "México — Ciudad de México",
                          ],
                          [
                            "America/Lima",
                            "Perú — Lima",
                          ],
                        ]}
                      />

                      <SelectValue
                        label="Moneda"
                        value={currency}
                        onChange={setCurrency}
                        options={[
                          [
                            "COP",
                            "Peso colombiano (COP)",
                          ],
                          [
                            "USD",
                            "Dólar estadounidense (USD)",
                          ],
                          [
                            "MXN",
                            "Peso mexicano (MXN)",
                          ],
                          [
                            "EUR",
                            "Euro (EUR)",
                          ],
                        ]}
                      />

                      <SelectValue
                        label="Formato de hora"
                        value={timeFormat}
                        onChange={setTimeFormat}
                        options={[
                          [
                            "24",
                            "24 horas — 14:30",
                          ],
                          [
                            "12",
                            "12 horas — 2:30 PM",
                          ],
                        ]}
                      />

                      <SelectValue
                        label="Idioma"
                        value={language}
                        onChange={setLanguage}
                        options={[
                          [
                            "es",
                            "Español",
                          ],
                          [
                            "en",
                            "English",
                          ],
                        ]}
                      />

                    </div>

                  </div>

                  {/* THEME */}

                  <div>

                    <div className="mb-4">

                      <h3 className="font-semibold">
                        Apariencia de VEXIA
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Elige cómo quieres visualizar la
                        plataforma. Automático seguirá la
                        configuración de tu dispositivo.
                      </p>

                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                      <ThemeCard
                        selected={
                          theme === "light"
                        }
                        icon="☀"
                        title="Claro"
                        description="Interfaz clara y luminosa."
                        onClick={() =>
                          handleThemeChange(
                            "light"
                          )
                        }
                      />

                      <ThemeCard
                        selected={
                          theme === "dark"
                        }
                        icon="☾"
                        title="Oscuro"
                        description="Interfaz oscura para ambientes con poca luz."
                        onClick={() =>
                          handleThemeChange(
                            "dark"
                          )
                        }
                      />

                      <ThemeCard
                        selected={
                          theme === "system"
                        }
                        icon="◐"
                        title="Automático"
                        description="Utiliza la apariencia del dispositivo."
                        onClick={() =>
                          handleThemeChange(
                            "system"
                          )
                        }
                      />

                    </div>

                  </div>

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Reservas públicas
                    </h3>

                    <div className="space-y-3">

                      <SettingSwitch
                        title="Reservas online"
                        description="Permite que los clientes soliciten reservas desde la página pública."
                        defaultChecked
                      />

                      <SettingSwitch
                        title="Mostrar precios"
                        description="Muestra los precios de los servicios a los clientes."
                        defaultChecked
                      />

                      <SettingSwitch
                        title="Mostrar disponibilidad"
                        description="Permite consultar los horarios disponibles."
                        defaultChecked
                      />

                      <SettingSwitch
                        title="Confirmación automática"
                        description="Confirma automáticamente las reservas que cumplan las reglas."
                        defaultChecked
                      />

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* USERS */}

            {activeTab === "usuarios" && (
              <div>

                <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>

                    <h2 className="text-xl font-semibold">
                      Usuarios y roles
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Primero defines los permisos del rol
                      y después asignas ese rol a cada usuario.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowUserForm(
                        !showUserForm
                      )
                    }
                    className="cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    + Agregar usuario
                  </button>

                </div>

                {showUserForm && (
                  <form
                    onSubmit={addUser}
                    className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >

                    <h3 className="font-semibold">
                      Crear usuario
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      El usuario quedará pendiente hasta
                      completar su activación.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                      <input
                        type="text"
                        value={newUserName}
                        onChange={(event) =>
                          setNewUserName(
                            event.target.value
                          )
                        }
                        placeholder="Nombre completo"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />

                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(event) =>
                          setNewUserEmail(
                            event.target.value
                          )
                        }
                        placeholder="Correo empresarial"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />

                      <select
                        value={newUserRole}
                        onChange={(event) =>
                          setNewUserRole(
                            event.target.value
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >

                        <option>
                          Propietario
                        </option>

                        <option>
                          Gerente / Supervisor
                        </option>

                        <option>
                          Administrador
                        </option>

                        <option>
                          Trabajador
                        </option>

                      </select>

                    </div>

                    <div className="mt-4 flex justify-end gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          setShowUserForm(false)
                        }
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                      >
                        Crear usuario
                      </button>

                    </div>

                  </form>
                )}

                <div className="mb-8">

                  <h3 className="mb-4 font-semibold">
                    Usuarios del negocio
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">

                    <table className="w-full min-w-[700px] text-left">

                      <thead className="bg-slate-50">

                        <tr className="border-b border-slate-200">

                          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Usuario
                          </th>

                          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Rol
                          </th>

                          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Estado
                          </th>

                          <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Acción
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-slate-100 last:border-0"
                          >

                            <td className="px-5 py-4">

                              <p className="font-semibold">
                                {user.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {user.email}
                              </p>

                            </td>

                            <td className="px-5 py-4 text-sm text-slate-700">
                              {user.role}
                            </td>

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  user.status ===
                                  "Activo"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : user.status ===
                                      "Pendiente"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {user.status}
                              </span>

                            </td>

                            <td className="px-5 py-4">

                              <button
                                type="button"
                                onClick={() =>
                                  toggleUserStatus(
                                    user.id
                                  )
                                }
                                className="cursor-pointer text-sm font-semibold hover:underline"
                              >
                                {user.status ===
                                "Activo"
                                  ? "Desactivar"
                                  : "Activar"}
                              </button>

                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>

                </div>

                <div>

                  <h3 className="mb-2 font-semibold">
                    Roles y permisos
                  </h3>

                  <p className="mb-4 text-sm text-slate-500">
                    Selecciona un rol y configura sus
                    permisos independientemente de los usuarios.
                  </p>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() =>
                          setSelectedRole(
                            role.id
                          )
                        }
                        className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                          selectedRole ===
                          role.id
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >

                        <p className="font-semibold">
                          {role.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {role.description}
                        </p>

                      </button>
                    ))}

                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 p-5">

                    <h4 className="font-semibold">
                      Permisos de{" "}
                      {selectedRoleData.name}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Activa o desactiva los módulos
                      disponibles para este rol.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

                      {permissions.map(
                        (permission) => {
                          const enabled =
                            selectedRoleData.permissions.includes(
                              permission
                            );

                          return (
                            <label
                              key={permission}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50"
                            >

                              <span className="text-sm font-medium">
                                {permission}
                              </span>

                              <input
                                type="checkbox"
                                checked={
                                  enabled
                                }
                                onChange={() =>
                                  togglePermission(
                                    permission
                                  )
                                }
                                className="h-5 w-5 rounded border-slate-300"
                              />

                            </label>
                          );
                        }
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* NOTIFICATIONS */}

            {activeTab === "notificaciones" && (
              <div>

                <div className="mb-7">

                  <h2 className="text-xl font-semibold">
                    Notificaciones
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Controla los avisos que recibe tu equipo.
                  </p>

                </div>

                <div className="space-y-4">

                  <SettingSwitch
                    title="Nueva reserva"
                    description="Avisar cuando un cliente cree una nueva reserva."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Cancelación"
                    description="Avisar cuando una reserva sea cancelada."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Reprogramación"
                    description="Avisar cuando un cliente cambie su reserva."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Recordatorios"
                    description="Enviar recordatorios antes de una reserva."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Actividad del equipo"
                    description="Recibir avisos sobre cambios realizados por usuarios internos."
                  />

                </div>

              </div>
            )}

            {/* RESERVATIONS */}

            {activeTab === "reservas" && (
              <div>

                <div className="mb-7">

                  <h2 className="text-xl font-semibold">
                    Configuración de reservas
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Define las reglas que controlan cómo
                    tus clientes reservan, cancelan y
                    reprograman sus citas.
                  </p>

                </div>

                <div className="space-y-8">

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Reglas de reserva
                    </h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                      <SelectSetting
                        label="Anticipación mínima"
                        description="Tiempo mínimo antes de una cita para poder reservar."
                        options={[
                          "Sin límite",
                          "1 hora",
                          "2 horas",
                          "3 horas",
                          "6 horas",
                          "24 horas",
                        ]}
                      />

                      <SelectSetting
                        label="Anticipación máxima"
                        description="Con cuánto tiempo de anticipación se puede reservar."
                        options={[
                          "7 días",
                          "15 días",
                          "30 días",
                          "60 días",
                          "90 días",
                        ]}
                      />

                      <SelectSetting
                        label="Duración del espacio"
                        description="Intervalo utilizado para organizar la agenda."
                        options={[
                          "15 minutos",
                          "30 minutos",
                          "45 minutos",
                          "60 minutos",
                        ]}
                      />

                      <SelectSetting
                        label="Tiempo entre citas"
                        description="Espacio adicional entre una cita y la siguiente."
                        options={[
                          "Sin espacio",
                          "5 minutos",
                          "10 minutos",
                          "15 minutos",
                          "30 minutos",
                        ]}
                      />

                    </div>

                  </div>

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Cancelaciones y reprogramaciones
                    </h3>

                    <div className="space-y-3">

                      <SettingSwitch
                        title="Permitir cancelaciones"
                        description="El cliente puede cancelar desde su enlace."
                        defaultChecked
                      />

                      <SettingSwitch
                        title="Permitir reprogramaciones"
                        description="El cliente puede cambiar fecha y hora."
                        defaultChecked
                      />

                      <SettingSwitch
                        title="Permitir reservas el mismo día"
                        description="Permite reservar espacios disponibles durante el día."
                        defaultChecked
                      />

                    </div>

                  </div>

                  <div>

                    <h3 className="mb-4 font-semibold">
                      Recordatorios
                    </h3>

                    <div className="space-y-3">

                      <SettingSwitch
                        title="Activar recordatorios"
                        description="Envía un aviso antes de la cita."
                        defaultChecked
                      />

                      <SelectSetting
                        label="Enviar recordatorio"
                        description="Selecciona cuánto tiempo antes se enviará."
                        options={[
                          "30 minutos antes",
                          "1 hora antes",
                          "2 horas antes",
                          "12 horas antes",
                          "24 horas antes",
                        ]}
                      />

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* CLIENTS */}

            {activeTab === "clientes" && (
              <div>

                <div className="mb-7">

                  <h2 className="text-xl font-semibold">
                    Preferencias de clientes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Controla la información y las acciones
                    disponibles para tus clientes.
                  </p>

                </div>

                <div className="space-y-4">

                  <SettingSwitch
                    title="Permitir creación de perfil"
                    description="Permite que el cliente cree su perfil para gestionar sus reservas."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Solicitar teléfono"
                    description="Solicita un número de teléfono durante la reserva."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Solicitar correo electrónico"
                    description="Solicita el correo electrónico del cliente."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Mostrar historial de reservas"
                    description="Permite al cliente consultar sus reservas anteriores."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Permitir cancelar"
                    description="Permite cancelar una reserva desde el enlace público."
                    defaultChecked
                  />

                  <SettingSwitch
                    title="Permitir reprogramar"
                    description="Permite cambiar la fecha o la hora de una reserva."
                    defaultChecked
                  />

                </div>

              </div>
            )}

            {/* SECURITY */}

            {activeTab === "seguridad" && (
              <div>

                <div className="mb-7">

                  <h2 className="text-xl font-semibold">
                    Seguridad
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Protege el acceso a tu cuenta VEXIA.
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 p-6">

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>

                      <h3 className="font-semibold">
                        Verificación en dos pasos
                      </h3>

                      <p className="mt-1 max-w-xl text-sm text-slate-500">
                        Añade una segunda comprobación al
                        iniciar sesión para proteger la cuenta.
                      </p>

                    </div>

                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300"
                    />

                  </div>

                </div>

              </div>
            )}

            {/* SAVE */}

            <div className="mt-10 flex items-center justify-end border-t border-slate-100 pt-6">

              <button
                type="button"
                onClick={saveChanges}
                className="cursor-pointer rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                Guardar cambios
              </button>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

/* SWITCH */

function SettingSwitch({
  title,
  description,
  defaultChecked = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-xl border border-slate-200 p-5 transition hover:bg-slate-50">

      <div>

        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-5 cursor-pointer rounded border-slate-300"
      />

    </label>
  );
}

/* SELECT */

function SelectSetting({
  label,
  description,
  options,
}: {
  label: string;
  description: string;
  options: string[];
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        defaultValue={options[0]}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      >

        {options.map((option) => (
          <option key={option}>
            {option}
          </option>
        ))}

      </select>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* SELECT CONTROLADO */

function SelectValue({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      >

        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* THEME CARD */

function ThemeCard({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
        selected
          ? "border-slate-900 bg-slate-50 shadow-sm"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm"
      }`}
    >

      <div className="mb-4 flex items-center justify-between">

        <span className="text-2xl">
          {icon}
        </span>

        <span
          className={`h-4 w-4 rounded-full border-2 ${
            selected
              ? "border-slate-900 bg-slate-900"
              : "border-slate-300"
          }`}
        />

      </div>

      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

    </button>
  );
}