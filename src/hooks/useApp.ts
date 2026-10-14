import { useContext } from "react";
import { AppContext } from "@/app/context";

export function useApp() {
    const c = useContext(AppContext);
    if (!c) throw new Error("useApp must be used inside AppProvider");
    return c;
}

