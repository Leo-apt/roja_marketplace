import { useEffect, useState } from "react";
import Drawer from "@/components/shared/Drawer";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import type { ProductRec } from "@/services/products.service";
import { marginsService, type MarginInput, type MarginRec } from "@/services/margins.service";
import { calcMargin, num, usd } from "@/utils/catalog";
import { btn, inputCls, MoneyInput } from "./FormBits";
import { useBackGuard } from "@/hooks/useBackGuard";

interface RowErr { wholesale?: string; retail?: string; markup?: string }
interface Row { wholesale: string; retail: string; markupType: "flat" | "percent"; markup: string }
const COLS = ["S.No", "Product", "Bundles", "Wholesale Price", "Retail Price", "Roja Markup Type", "Roja Markup", "Roja Buy Rate", "Margin Vs. Retail"];

const initRow = (p: ProductRec, m?: MarginRec): Row => m
    ? { wholesale: String(m.wholesale), retail: String(m.retail), markupType: m.markupType, markup: String(m.markupValue) }
    : { wholesale: "", retail: p.retail != null ? String(p.retail) : "", markupType: "flat", markup: "" };

export default function EnvMarginsDrawer({ envName, products, margins, onSaved }: {
    envName: string; products: ProductRec[]; margins: MarginRec[]; onSaved: (recs: MarginRec[]) => void;
}) {
    const { closeLayers, toast, toastError } = useApp();
    const [byProduct] = useState(() => new Map(margins.map((m) => [m.productId, m])));
    const [initial] = useState<Record<string, Row>>(() =>
        Object.fromEntries(products.map((p) => [p.id, initRow(p, byProduct.get(p.id))])));
    const [rows, setRows] = useState<Record<string, Row>>(initial);
    const [errors, setErrors] = useState<Record<string, RowErr>>({});
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const changed = (id: string) => {
        const a = rows[id], b = initial[id];
        return a.wholesale !== b.wholesale || a.retail !== b.retail || a.markupType !== b.markupType || a.markup !== b.markup;
    };
    const dirty = products.some((p) => changed(p.id));
    useBackGuard(dirty, () => { if (dirty) setConfirm(true); else closeLayers(); });

    useEffect(() => {
        if (!dirty) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);

    const patch = (id: string, p: Partial<Row>) => {
        setRows((r) => ({ ...r, [id]: { ...r[id], ...p } }));
        setErrors((e) => {
            const cur = { ...(e[id] ?? {}) };
            if ("wholesale" in p) delete cur.wholesale;
            if ("retail" in p) delete cur.retail;
            if ("markup" in p) delete cur.markup;
            return { ...e, [id]: cur };
        });
    };

    const save = async (close: () => void) => {
        const todo = products.filter((p) => changed(p.id));
        const errs: Record<string, RowErr> = {};
        todo.forEach((p) => {
            const r = rows[p.id];
            const e: RowErr = {};
            if (num(r.wholesale) <= 0) e.wholesale = "Enter a wholesale price";
            if (num(r.retail) <= 0) e.retail = "Enter a retail price";
            if (!r.markup.trim()) e.markup = "Enter a markup";
            if (Object.keys(e).length) errs[p.id] = e;
        });
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setSaving(true);
        const saved: MarginRec[] = [];
        try {
            for (const p of todo) {
                const r = rows[p.id];
                const input: MarginInput = { productId: p.id, wholesale: r.wholesale, retail: r.retail, markupType: r.markupType, markup: r.markup };
                const ex = byProduct.get(p.id);
                saved.push(ex ? await marginsService.update(ex.id, input) : await marginsService.create(input));
            }
            onSaved(saved);
            toast("Margins saved");
            close();
        } catch (e) {
            if (saved.length) {
                onSaved(saved);
                toastError(`${e instanceof Error ? e.message : "Save failed"} — some rows were saved. Reopen to retry the rest.`);
                close();
            } else {
                toastError(e instanceof Error ? e.message : "Save failed");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer
            title="Margins"
            kicker={`${envName} · environment`}
            width="min(1180px, calc(100vw - 20px))"
            onBeforeClose={() => { if (!dirty) return true; setConfirm(true); return false; }}
            footer={(close, tryClose) => (
                <>
                    <button className={btn.cancel} onClick={tryClose} disabled={saving}>Cancel</button>
                    <button className={btn.primary} disabled={!dirty || saving} onClick={() => void save(close)}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </>
            )}
        >
            <p className="text-xs text-muted">Margins belong to the product, so a change here applies to that product everywhere.</p>
            <div className="thin-scrollbar overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[1240px] border-collapse text-sm">
                    <thead>
                        <tr className="bg-surfacealt">
                            {COLS.map((c, i) => (
                                <th key={c} className={`px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-muted ${i === 0 ? "sticky left-0 z-10 w-16 min-w-[64px] bg-surfacealt" : i === 1 ? "sticky left-16 z-10 min-w-[200px] bg-surfacealt" : ""}`}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => {
                            const r = rows[p.id];
                            const ex = byProduct.get(p.id);
                            const c = calcMargin(num(r.wholesale), num(r.retail), num(r.markup), r.markupType);
                            const filled = r.wholesale.trim() !== "";
                            return (
                                <tr key={p.id} className="border-t border-line align-top">
                                    <td className="sticky left-0 z-10 w-16 min-w-[64px] bg-white px-3 py-3 pt-5 text-muted">{i + 1}</td>
                                    <td className="sticky left-16 z-10 min-w-[200px] bg-white px-3 py-3">
                                        <div className="font-semibold text-ink">{p.name}</div>
                                        <div className="text-xs text-muted">{ex ? "Margin set" : "No margin yet"}</div>
                                    </td>
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
                                    <td className="min-w-[150px] px-3 py-3">
                                        <MoneyInput value={r.wholesale} onChange={(v) => patch(p.id, { wholesale: v })} />
                                        {errors[p.id]?.wholesale && <p className="mt-1 text-xs text-bad" role="alert">{errors[p.id]?.wholesale}</p>}
                                    </td>
                                    <td className="min-w-[150px] px-3 py-3">
                                        <MoneyInput value={r.retail} readOnly={!!ex} onChange={(v) => patch(p.id, { retail: v })} />
                                        {errors[p.id]?.retail && <p className="mt-1 text-xs text-bad" role="alert">{errors[p.id]?.retail}</p>}
                                    </td>
                                    <td className="min-w-[130px] px-3 py-3">
                                        <select className={inputCls} value={r.markupType}
                                            onChange={(e) => patch(p.id, { markupType: e.target.value as Row["markupType"] })}>
                                            <option value="flat">$ Flat</option>
                                            <option value="percent">% Percent</option>
                                        </select>
                                    </td>
                                    <td className="min-w-[150px] px-3 py-3">
                                        <MoneyInput prefix={r.markupType === "percent" ? "%" : "$"} value={r.markup} onChange={(v) => patch(p.id, { markup: v })} />
                                        {errors[p.id]?.markup && <p className="mt-1 text-xs text-bad" role="alert">{errors[p.id]?.markup}</p>}
                                    </td>
                                    <td className="px-3 py-3 pt-5 font-semibold text-ink">{filled ? usd(c.buy) : "-"}</td>
                                    <td className={`px-3 py-3 pt-5 font-semibold ${filled && c.margin < 0 ? "text-bad" : "text-good"}`}>{filled ? usd(c.margin) : "-"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog isOpen={confirm} type="warning" title="Discard changes?"
                message="You have unsaved margin changes. If you leave now, they will be lost."
                confirmText="Discard" cancelText="Keep editing"
                onClose={() => setConfirm(false)}
                onConfirm={() => { setConfirm(false); closeLayers(); }} />
        </Drawer>
    );
}