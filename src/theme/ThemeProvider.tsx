import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Kept so existing callers compile. The crossfade doesn't need an origin. */
export type ThemeOrigin = { x: number; y: number };

/** Keep in sync with the pre-paint script in index.html. */
const STORAGE_KEY = "app:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable (private mode, etc.) */
  }
  return "light";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Flips the class on <html>. No-op if it's already right.
 * With `freeze`, element transitions are switched off for two frames so
 * nothing fades on its own while the theme changes.
 */
function applyTheme(resolved: ResolvedTheme, freeze = false) {
  const root = document.documentElement;
  const wantsDark = resolved === "dark";
  if (root.classList.contains("dark") === wantsDark) return;

  if (freeze) root.classList.add("theme-switching");
  root.classList.toggle("dark", wantsDark);
  root.style.colorScheme = resolved;

  if (freeze) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-switching")),
    );
  }
}

/**
 * - .theme-switching turns off every element's own transition, so the only
 *   motion during a switch is the page crossfade.
 * - The crossfade is the browser's View Transition on the root.
 */
const THEME_STYLES = `
  html.theme-switching *,
  html.theme-switching *::before,
  html.theme-switching *::after {
    transition: none !important;
  }

  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 350ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

type ThemeContextValue = {
  /** What the user picked: light, dark or system. */
  mode: ThemeMode;
  /** What is actually showing right now: light or dark. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode, origin?: ThemeOrigin) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const resolved: ResolvedTheme =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Follow the OS setting live (matters when mode is "system")
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep other open tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setModeState(readMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Initial load, OS changes, cross-tab changes. Already-correct class = no-op.
  useEffect(() => {
    applyTheme(resolved, true);
  }, [resolved]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      const nextResolved: ResolvedTheme =
        next === "system" ? (systemDark ? "dark" : "light") : next;

      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore: the choice still applies for this session */
      }

      const root = document.documentElement;
      const changing =
        root.classList.contains("dark") !== (nextResolved === "dark");
      const doc = document as ViewTransitionDoc;

      // Same look, no browser support, or reduced motion: swap instantly.
      if (!changing || !doc.startViewTransition || prefersReducedMotion()) {
        setModeState(next);
        applyTheme(nextResolved, true);
        return;
      }

      root.classList.add("theme-switching");
      const transition = doc.startViewTransition(() => {
        applyTheme(nextResolved);
        setModeState(next);
      });
      transition.finished.finally(() =>
        root.classList.remove("theme-switching"),
      );
    },
    [systemDark],
  );

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <style>{THEME_STYLES}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
