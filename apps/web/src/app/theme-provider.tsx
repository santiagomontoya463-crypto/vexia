"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "vexia-theme";

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (
      stored === "light" ||
      stored === "dark" ||
      stored === "system"
    ) {
      return stored;
    }
  } catch {
    // Si el almacenamiento no está disponible,
    // se utiliza la apariencia automática.
  }

  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const isDark =
    theme === "dark" ||
    (theme === "system" && prefersDark);

  root.classList.toggle("dark", isDark);
  root.dataset.theme = theme;
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>("system");

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredTheme();

    setThemeState(savedTheme);
    applyTheme(savedTheme);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    applyTheme(theme);

    if (theme !== "system") return;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, [theme, ready]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // La apariencia seguirá funcionando durante
      // la sesión aunque no se pueda guardar.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider"
    );
  }

  return context;
}