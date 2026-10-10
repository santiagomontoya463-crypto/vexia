"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type NotificationType = "success" | "error" | "warning" | "info";

type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
};

type NotificationContextType = {
  notify: (
    type: NotificationType,
    title: string,
    message?: string
  ) => void;
  success: (message?: string) => void;
  error: (message?: string) => void;
  warning: (message?: string) => void;
  info: (message?: string) => void;
};

const NotificationContext =
  createContext<NotificationContextType | undefined>(undefined);

const defaults: Record<NotificationType, string> = {
  success: "¡Guardado con éxito!",
  error: "No se pudo completar la operación",
  warning: "Atención",
  info: "Información",
};

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  }, []);

  const notify = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = ++nextId.current;

      setNotifications((current) => [
        ...current,
        { id, type, title, message },
      ]);

      timers.current[id] = setTimeout(() => {
        dismiss(id);
      }, type === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const value: NotificationContextType = {
    notify,
    success: (message) =>
      notify("success", defaults.success, message),
    error: (message) =>
      notify("error", defaults.error, message),
    warning: (message) =>
      notify("warning", defaults.warning, message),
    info: (message) =>
      notify("info", defaults.info, message),
  };

  const styles: Record<NotificationType, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
    error: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
    warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  };

  const icons: Record<NotificationType, string> = {
    success: "✓",
    error: "!",
    warning: "⚠",
    info: "i",
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            role={notification.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${styles[notification.type]}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current font-bold"
              aria-hidden="true"
            >
              {icons[notification.type]}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notification.title}</p>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">
                  {notification.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              className="rounded px-2 py-1 text-lg leading-none opacity-70 hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications debe utilizarse dentro de NotificationProvider"
    );
  }

  return context;
}
