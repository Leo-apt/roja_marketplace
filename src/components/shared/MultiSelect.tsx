import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { inputCls } from "@/components/catalog/FormBits";

export interface MultiOpt { value: string; label: string }

export default function MultiSelect({ options, value, onChange, placeholder = "Select", loading = false }: {
    options: MultiOpt[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string; loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = value.map((v) => options.find((o) => o.value === v)).filter((o): o is MultiOpt => !!o);
    const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    const allOn = options.length > 0 && options.every((o) => value.includes(o.value));

    return (
        <div className="flex flex-col gap-1.5">
            <div role="button" tabIndex={0} onClick={() => setOpen((o) => !o)}
                className={`${inputCls} flex min-h-10 cursor-pointer items-center gap-2 !h-auto py-1.5`}>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                    {selected.length === 0 && <span className="text-gray-400">{placeholder}</span>}
                    {selected.map((o) => (
                        <span key={o.value} className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-xs text-ink">
                            {o.label}
                            <button type="button" aria-label={`Remove ${o.label}`}
                                onClick={(e) => { e.stopPropagation(); toggle(o.value); }}><X className="size-3" /></button>
                        </span>
                    ))}
                </div>
                <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
            {open && (
                <ul className="thin-scrollbar max-h-48 overflow-y-auto rounded-xl border border-line bg-white py-1">
                    {loading ? <li className="px-3 py-3 text-sm text-muted">Loading…</li> : (
                        <>
                            {options.length > 1 && (
                                <li>
                                    <label className="flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2 text-sm font-semibold hover:bg-gray-50">
                                        <input type="checkbox" checked={allOn} className="size-4 accent-brand"
                                            onChange={() => onChange(allOn ? [] : options.map((o) => o.value))} />
                                        Select all
                                    </label>
                                </li>
                            )}
                            {options.map((o) => (
                                <li key={o.value}>
                                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50">
                                        <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="size-4 accent-brand" />
                                        {o.label}
                                    </label>
                                </li>
                            ))}
                            {!options.length && <li className="px-3 py-3 text-sm text-muted">No providers available</li>}
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}