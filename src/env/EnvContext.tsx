import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DataMode = "sandbox" | "live";
const KEY = "app:data-mode";

interface Ctx { mode: DataMode; setMode: (m: DataMode) => void }
const EnvContext = createContext<Ctx | null>(null);

const read = (): DataMode => {
    try { return localStorage.getItem(KEY) === "live" ? "live" : "sandbox"; } catch { return "sandbox"; }
};

export function EnvProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<DataMode>(read);

    const setMode = useCallback((m: DataMode) => {
        setModeState(m);
        try { localStorage.setItem(KEY, m); } catch { /* storage unavailable */ }
    }, []);

    useEffect(() => { document.documentElement.dataset.mode = mode; }, [mode]);

    // same switch in another tab
    useEffect(() => {
        const on = (e: StorageEvent) => { if (e.key === KEY) setModeState(read()); };
        window.addEventListener("storage", on);
        return () => window.removeEventListener("storage", on);
    }, []);

    const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

    return (
        <EnvContext.Provider value={value}>
            {children}
        </EnvContext.Provider>
    );
}

export function useEnv() {
    const c = useContext(EnvContext);
    if (!c) throw new Error("useEnv must be used inside EnvProvider");
    return c;
}