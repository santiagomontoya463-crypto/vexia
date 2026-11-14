import type { BusinessRole } from "./auth/AuthProvider";

const PATH_MODULES: [string, string][] = [
  ["/reservas", "reservas"],
  ["/clientes", "clientes"],
  ["/servicios", "servicios"],
  ["/productos", "productos"],
  ["/ventas", "ventas"],
  ["/facturacion", "facturacion"],
  ["/finanzas", "finanzas"],
  ["/trabajadores", "trabajadores"],
  ["/proveedores", "proveedores"],
  ["/solicitudes-compra", "compras"],
];

// Los trabajadores solo operan el día a día; no ven finanzas ni configuración.
const WORKER_MODULES = ["reservas", "clientes", "servicios", "productos", "ventas"];
const MANAGEMENT_PATHS = ["/configuracion", "/negocio"];

export function moduleForPath(path: string): string | null {
  const match = PATH_MODULES.find(
    ([prefix]) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return match ? match[1] : null;
}

export function canAccessPath(
  role: BusinessRole | undefined,
  enabledModules: string[] | undefined,
  path: string,
): boolean {
  if (!role) return true;

  if (
    role === "worker" &&
    MANAGEMENT_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  ) {
    return false;
  }

  const moduleId = moduleForPath(path);

  if (!moduleId) return true;

  if (enabledModules && !enabledModules.includes(moduleId)) return false;

  if (role === "worker" && !WORKER_MODULES.includes(moduleId)) return false;

  return true;
}
