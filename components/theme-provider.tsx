"use client";

import * as React from "react";

type Theme = "dark" | "light" | "slate";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read the theme already applied by the blocking inline script (avoids a state-driven re-apply)
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof document === "undefined") return "dark";
    const root = document.documentElement;
    if (root.classList.contains("light")) return "light";
    if (root.classList.contains("slate")) return "slate";
    return "dark";
  });

  // Sync on mount in case the script ran before React hydrated
  React.useEffect(() => {
    const stored = localStorage.getItem("kit_theme") as Theme | null;
    if (stored && ["dark", "light", "slate"].includes(stored) && stored !== theme) {
      applyTheme(stored);
      setThemeState(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "slate");
    root.classList.add(t);
  }

  function setTheme(t: Theme) {
    if (t === theme) return;
    const root = document.documentElement;
    try { localStorage.setItem("kit_theme", t); } catch { /* private mode */ }

    const apply = () => { applyTheme(t); setThemeState(t); };

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { apply(); return; }

    // Best path: a composited, jank-free crossfade of the whole page.
    const startViewTransition = (
      document as Document & { startViewTransition?: (cb: () => void) => void }
    ).startViewTransition?.bind(document);
    if (startViewTransition) {
      startViewTransition(apply);
      return;
    }

    // Fallback: brief, uniform transition on all elements during the switch only.
    root.classList.add("theme-transition");
    // Force the transition declaration to be live before the colours change.
    void root.offsetHeight;
    apply();
    window.setTimeout(() => root.classList.remove("theme-transition"), 360);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
