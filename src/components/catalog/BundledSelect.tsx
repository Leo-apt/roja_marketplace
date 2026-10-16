import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { inputCls, Radio } from "./FormBits";

export interface BundleOpt { id: string; label: string; type: "Bundle" | "Add On" }

export default function BundledSelect({ options, value, onChange, onAdd }: {
    options: BundleOpt[]; value: string[]; onChange: (ids: string[]) => void; onAdd: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<BundleOpt["type"]>("Bundle");
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const selected = value.map((id) => options.find((o) => o.id === id)).filter((o): o is BundleOpt => !!o);
    const list = options.filter((o) => o.type === kind);
    const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

    return (
        <div ref={ref} className="flex flex-col gap-3">
            <div className="flex gap-6">
                <Radio name="bundled-kind" label="Bundle" checked={kind === "Bundle"} onChange={() => setKind("Bundle")} />
                <Radio name="bundled-kind" label="Add On" checked={kind === "Add On"} onChange={() => setKind("Add On")} />
            </div>

            <div className="flex items-start gap-2">
                <div className="relative flex-1">
                    <div role="button" tabIndex={0} onClick={() => setOpen((o) => !o)}
                        className={`${inputCls} flex cursor-pointer items-center gap-2`}>
                        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                            {selected.length === 0 && <span className="text-gray-400">Select {kind === "Bundle" ? "bundles" : "add ons"}</span>}
                            {selected.map((o) => (
                                <span key={o.id} className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-xs text-ink">
                                    {o.label}
                                    <button type="button" aria-label={`Remove ${o.label}`}
                                        onClick={(e) => { e.stopPropagation(); toggle(o.id); }}><X className="size-3" /></button>
                                </span>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <button type="button" aria-label="Clear all" onClick={(e) => { e.stopPropagation(); onChange([]); }}>
                                <X className="size-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                    </div>
                    {open && (
                        <ul className="thin-scrollbar absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg">
                            {list.map((o) => (
                                <li key={o.id}>
                                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50">
                                        <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} className="size-4 accent-brand" />
                                        {o.label}
                                    </label>
                                </li>
                            ))}
                            {!list.length && <li className="px-3 py-3 text-sm text-muted">No {kind === "Bundle" ? "bundles" : "add ons"} available</li>}
                        </ul>
                    )}
                </div>
                <button type="button" aria-label="Create new bundle" onClick={onAdd}
                    className="grid size-10 shrink-0 place-items-center rounded-md border border-line bg-white hover:bg-gray-50">
                    <Plus className="size-4" />
                </button>
            </div>

            {selected.length > 0 && (
                <div className="rounded-lg bg-surfacealt p-4">
                    <p className="mb-2 text-sm text-muted">Selected Bundled</p>
                    {selected.map((o) => (
                        <div key={o.id} className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
                            <span className="text-sm font-semibold text-ink">{o.label}</span>
                            <span className="flex gap-6 text-sm">
                                {(["Bundle", "Add On"] as const).map((t) => (
                                    <label key={t} className={`flex items-center gap-2 ${o.type === t ? "font-medium text-ink" : "text-gray-400"}`}>
                                        <input type="radio" checked={o.type === t} disabled={o.type !== t}
                                            onChange={() => { }} className="size-4 accent-brand" />
                                        {t}
                                    </label>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}