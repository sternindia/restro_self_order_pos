import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("emenu_theme");
      if (saved === "dark" || saved === "light") return saved;
      return "light";
    } catch {
      return "light";
    }
  });

  const isDark = theme === "dark";

  useEffect(() => {
    try {
      localStorage.setItem("emenu_theme", theme);
    } catch {}

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const applyTheme = (nextTheme: Theme) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        setThemeState(nextTheme);
      });
    } else {
      setThemeState(nextTheme);
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  const setTheme = (t: Theme) => {
    if (t !== theme) {
      applyTheme(t);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const getDefaultImage = (): string => {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "/images/dark_default_image.png";
  }
  return "/images/default_image.png";
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  const defaultImage = context.isDark ? "/images/dark_default_image.png" : "/images/default_image.png";
  return { ...context, defaultImage };
};

