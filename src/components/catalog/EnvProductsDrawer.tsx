import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "@/components/shared/Drawer";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useApp } from "@/hooks/useApp";
import type { ProductRec } from "@/services/products.service";
import { StatusBadge } from "./DetailBits";
import { btn, SearchField } from "./FormBits";
import { useBackGuard } from "@/hooks/useBackGuard";

const COLS = ["S.No", "Product Name", "Product Category", "Bundles", "Status"];

export default function EnvProductsDrawer({ envName, products, initial, onSave, onNext }: {
    envName: string; products: ProductRec[]; initial: string[]; onSave: (ids: string[]) => Promise<void>;
    onNext?: (ids: string[]) => void;
}) {
    const { closeLayers, toastError } = useApp();
    const [saving, setSaving] = useState(false);
    const [sel, setSel] = useState<Set<string>>(() => new Set(initial));
    const [q, setQ] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [goTo, setGoTo] = useState<string | null>(null);
    const nav = useNavigate();

    const dirty = sel.size !== initial.length || initial.some((id) => !sel.has(id));
    const releaseGuard = useBackGuard(dirty, () => { if (dirty) setConfirm(true); else closeLayers(); });

    useEffect(() => {
        if (!dirty) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);

    const shown = useMemo(() => {
        const t = q.trim().toLowerCase();
        return t ? products.filter((p) => p.name.toLowerCase().includes(t) || p.categoryName.toLowerCase().includes(t)) : products;
    }, [q, products]);
    const allShown = shown.length > 0 && shown.every((p) => sel.has(p.id));

    const openProduct = (id: string) => {
        const path = `/catalog/products/${id}`;
        if (dirty) { setGoTo(path); setConfirm(true); }
        else { releaseGuard(); closeLayers(); nav(path, { replace: true }); }
    };

    // runs the API save; returns true when it worked
    const submit = async () => {
        setSaving(true);
        try {
            if (dirty) await onSave([...sel]);
            return true;
        } catch (e) {
            toastError(e instanceof Error ? e.message : "Save failed");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const toggle = (id: string) => setSel((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
    });
    const toggleShown = () => setSel((s) => {
        const n = new Set(s);
        shown.forEach((p) => { if (allShown) n.delete(p.id); else n.add(p.id); });
        return n;
    });

    return (
        <Drawer
            title="Select Products"
            kicker={`${envName} · environment`}
            width="min(1000px, calc(100vw - 20px))"
            onBeforeClose={() => { if (!dirty) return true; setConfirm(true); return false; }}
            footer={(close, tryClose) => (
                <>
                    <button className={btn.cancel} onClick={tryClose} disabled={saving}>Cancel</button>
                    <button className={btn.primary} disabled={!dirty || saving} onClick={async () => { if (await submit()) close(); }}>
                        {saving ? "Saving…" : `Save (${sel.size})`}
                    </button>
                    {onNext && (
                        <button className={btn.navy} disabled={!sel.size || saving}
                            onClick={async () => { if (await submit()) { releaseGuard(); onNext([...sel]); } }}>
                            Save &amp; Move to Margins
                        </button>
                    )}
                </>
            )}
        >
            {!products.length ? (
                <EmptyState title="No products found" message="No products are available for this environment's provider." />
            ) : (
                <>
                    <SearchField value={q} onChange={setQ} placeholder="Search by product or category" />
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-surfacealt px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <input type="checkbox" checked={allShown} onChange={toggleShown} className="size-4 accent-brand" />
                            Select all{q ? " (filtered)" : ""}
                        </span>
                        <span className="text-xs text-muted">{sel.size} of {products.length} selected</span>
                    </label>
                    <div className="thin-scrollbar overflow-x-auto rounded-xl border border-line">
                        <table className="w-full min-w-[760px] border-collapse text-sm">
                            <thead>
                                <tr className="bg-surfacealt">
                                    {COLS.map((c) => (
                                        <th key={c} className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted">{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((p, i) => (
                                    <tr key={p.id} onClick={() => toggle(p.id)}
                                        className={`cursor-pointer border-t border-line align-top ${sel.has(p.id) ? "bg-brandsoft" : "bg-white hover:bg-gray-50"}`}>
                                        <td className="px-3 py-3">
                                            <span className="flex items-center gap-2">
                                                <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)}
                                                    onClick={(e) => e.stopPropagation()} className="size-4 accent-brand" />
                                                <span className="text-muted">{i + 1}</span>
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <button type="button" title="Open product details"
                                                onClick={(e) => { e.stopPropagation(); openProduct(p.id); }}
                                                className="text-left font-semibold text-link hover:underline">
                                                {p.name}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3 text-ink">{p.categoryName}</td>
                                        <td className="min-w-[200px] px-3 py-3">
                                            {p.bundles.length ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {p.bundles.map((b) => (
                                                        <span key={b.id} className="inline-flex items-center rounded-md border border-line bg-white px-2 py-1 text-xs text-ink">
                                                            {b.name || b.shortCode}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                                    </tr>
                                ))}
                                {!shown.length && (
                                    <tr><td colSpan={COLS.length} className="py-6 text-center text-sm text-muted">No products match your search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <ConfirmDialog isOpen={confirm} type="warning" title="Discard changes?"
                message="You have unsaved changes. If you leave now, they will be lost."
                confirmText="Discard" cancelText="Keep editing"
                onClose={() => { setConfirm(false); setGoTo(null); }}
                onConfirm={() => {
                    setConfirm(false);
                    if (goTo) { releaseGuard(); closeLayers(); nav(goTo, { replace: true }); }
                    else closeLayers();
                }} />
        </Drawer>
    );
}