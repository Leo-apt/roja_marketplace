import { createContext, type ReactNode } from "react";
import type { Batch, BatchStatus, Role } from "@/types";
import type { Filters } from "@/domain/filters";

export interface SavedView {
    name: string;
    view: string;
    filters: Filters;
}

export const actorOf = (r: Role): string =>
    r === "preparer" ? "Alex · Finance preparer" : r === "approver" ? "Taylor · Finance approver" : "Morgan · Operations";

export interface AppCtx {
    filters: Filters;
    setFilters: (patch: Partial<Filters>) => void;
    resetFilters: () => void;
    role: Role;
    setRole: (r: Role) => void;
    actor: string;
    batches: Batch[];
    createBatch: (a: { payee: string; amount: number; entries: string[]; note: string; period: string }) => string;
    advanceBatch: (id: string, status: BatchStatus, label: string, patch?: Partial<Batch>) => void;
    resetDemo: () => void;
    savedViews: SavedView[];
    saveView: (name: string, view: string) => void;
    hidden: Record<string, string[]>;
    setHidden: (view: string, keys: string[]) => void;
    selected: Set<string>;
    setSelected: (s: Set<string>) => void;
    drawer: ReactNode;
    openDrawer: (n: ReactNode) => void;
    dialog: ReactNode;
    openDialog: (n: ReactNode) => void;
    closeDialog: () => void;
    closeLayers: () => void;
    toast: (m: string) => void;
    toastError: (m: string) => void;
}

export const AppContext = createContext<AppCtx | null>(null);