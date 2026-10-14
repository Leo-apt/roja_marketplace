import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast as sonner } from "sonner";
import { AppContext, actorOf, type SavedView } from "./context";
import type { Batch, BatchStatus, Role } from "@/types";
import { initialBatches } from "@/data/batches";
import { defaultFilters, type Filters } from "@/domain/filters";
import { ASOF } from "@/utils/constants";

const STORAGE = "roja-marketplace-react-v1";

function load(): { batches?: Batch[]; savedViews?: SavedView[] } {
    try {
        const v = JSON.parse(localStorage.getItem(STORAGE) || "{}");
        return {
            batches: Array.isArray(v.batches) ? v.batches : undefined,
            savedViews: Array.isArray(v.savedViews) ? v.savedViews : undefined,
        };
    } catch {
        return {};
    }
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [filters, setF] = useState<Filters>(defaultFilters);
    const [role, setRoleState] = useState<Role>("preparer");
    const [batches, setBatches] = useState<Batch[]>(() => load().batches ?? structuredClone(initialBatches));
    const [savedViews, setSavedViews] = useState<SavedView[]>(() => load().savedViews ?? []);
    const [hidden, setHiddenState] = useState<Record<string, string[]>>({});
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawer, setDrawer] = useState<ReactNode>(null);
    const [dialog, setDialog] = useState<ReactNode>(null);
    const actor = actorOf(role);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE, JSON.stringify({ batches, savedViews }));
        } catch {
            /* storage unavailable */
        }
    }, [batches, savedViews]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (dialog) setDialog(null);
            else setDrawer(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dialog]);

    useEffect(() => {
        document.body.classList.toggle("locked", !!(drawer || dialog));
    }, [drawer, dialog]);

    const toast = useCallback((m: string) => { sonner.success(m); }, []);
    const toastError = useCallback((m: string) => { sonner.error(m); }, []);

    const setFilters = useCallback((patch: Partial<Filters>) => setF((f) => ({ ...f, ...patch })), []);
    const closeDialog = useCallback(() => setDialog(null), []);
    const closeLayers = useCallback(() => {
        setDrawer(null);
        setDialog(null);
    }, []);

    const value = {
        filters,
        setFilters,
        resetFilters: () => {
            setF(defaultFilters);
            setSelected(new Set());
        },
        role,
        setRole: (r: Role) => {
            setRoleState(r);
            closeLayers();
            toast("Sample actor changed: " + actorOf(r));
        },
        actor,
        batches,
        createBatch: (a: { payee: string; amount: number; entries: string[]; note: string; period: string }) => {
            const id = "SET-2026-D" + String(batches.length + 1).padStart(3, "0");
            const b: Batch = {
                id, payee: a.payee, status: "Draft", created: ASOF, period: a.period,
                entries: a.entries, amount: a.amount, preparedBy: actor, approvedBy: "",
                reference: "", note: a.note, timeline: [[ASOF, "Draft prepared", actor]],
            };
            setBatches((bs) => [...bs, b]);
            return id;
        },
        advanceBatch: (id: string, status: BatchStatus, label: string, patch: Partial<Batch> = {}) =>
            setBatches((bs) =>
                bs.map((b) =>
                    b.id === id
                        ? { ...b, ...patch, status, timeline: [...b.timeline, [ASOF, label, actor] as [string, string, string]] }
                        : b,
                ),
            ),
        resetDemo: () => {
            setBatches(structuredClone(initialBatches));
            setSavedViews([]);
            setSelected(new Set());
            setF((f) => ({ ...f, tab: "all" }));
            closeLayers();
            toast("Sample batches and saved views reset.");
        },
        savedViews,
        saveView: (name: string, view: string) => setSavedViews((v) => [...v, { name, view, filters }]),
        hidden,
        setHidden: (view: string, keys: string[]) => setHiddenState((h) => ({ ...h, [view]: keys })),
        selected,
        setSelected,
        drawer,
        openDrawer: (n: ReactNode) => setDrawer(n),
        dialog,
        openDialog: (n: ReactNode) => setDialog(n),
        closeDialog,
        closeLayers,
        toast,
        toastError,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}