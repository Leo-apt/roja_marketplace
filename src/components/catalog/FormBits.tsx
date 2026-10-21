import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Check as CheckIcon, ChevronDown, Plus, Search, X } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { isHex } from "@/utils/catalog";

export const btn = {
    primary: "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-btn-primary px-5 py-2 text-sm font-semibold text-white hover:bg-btn-primary-hover disabled:opacity-50",
    cancel: "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-btn-danger px-5 py-2 text-sm font-semibold text-white hover:bg-btn-danger-hover",
    secondary: "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg",
    brand: "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-btn-primary bg-btn-primary px-4 py-2 text-sm font-semibold text-white hover:bg-btn-primary-hover",
    navy: "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-btn-dark px-4 py-2 text-sm font-semibold text-white hover:bg-btn-dark-hover",
    info: "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-note-info-border bg-note-info-bg px-4 py-2 text-sm font-semibold text-link transition-colors hover:border-link hover:bg-link hover:text-white",
    danger: "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-bad/30 bg-badbg px-4 py-2 text-sm font-semibold text-bad transition-colors hover:border-btn-danger hover:bg-btn-danger hover:text-white",
};

export const inputBase =
    "w-full min-h-10 border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 read-only:bg-gray-50";
export const inputCls = `${inputBase} rounded-md`;

export function Field({ label, required, note, error, children, className = "" }: {
    label: ReactNode; required?: boolean; note?: ReactNode; error?: string; children: ReactNode; className?: string;
}) {
    return (
        <div className={className} data-error={error ? "true" : undefined}>
            <label className="mb-1.5 block text-sm font-semibold text-ink">
                {label}{required && <span className="text-btn-danger">*</span>}
            </label>
            {children}
            {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
            {error && <p className="mt-1 text-xs text-bad" role="alert">{error}</p>}
        </div>
    );
}

export const HexNote = <span className="font-semibold text-brand">Must be HEX code, e.g. #000000</span>;

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea({ rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea rows={rows} {...props} className={`${inputCls} resize-y ${props.className ?? ""}`} />;
}

/** Keeps digits and one dot with at most 2 decimals; returns null when the number is over `max`. */
export const money2 = (v: string, max = 99999.99) => {
    const m = v.replace(/[^0-9.]/g, "").match(/^\d*\.?\d{0,2}/);
    const s = m ? m[0] : "";
    return Number(s) > max ? null : s;
};
/** "12" -> "12.00", ".5" -> "0.50", "" -> "". */
export const fixed2 = (v: string) => (v.trim() === "" || v === "." ? "" : Number(v).toFixed(2));

export function MoneyInput({ prefix = "$", value, onChange, placeholder = "0.00", readOnly, max = 99999.99 }: {
    prefix?: string; value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean; max?: number;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex">
            <span className="grid min-w-10 place-items-center rounded-l-md border border-r-0 border-line bg-surfacealt px-3 text-sm text-ink">{prefix}</span>
            <input
                className={`${inputBase} rounded-r-md`}
                inputMode="decimal"
                value={readOnly || focused ? value : fixed2(value)}
                readOnly={readOnly}
                placeholder={placeholder}
                onFocus={() => setFocused(true)}
                onChange={(e) => { const s = money2(e.target.value, max); if (s !== null) onChange?.(s); }}
                onBlur={() => {
                    setFocused(false);
                    const f = fixed2(value);
                    if (!readOnly && f !== value) onChange?.(f);
                }}
            />
        </div>
    );
}

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const valid = isHex(value);
    return (
        <div ref={ref} className="relative">
            <div className="flex">
                <input className={`${inputBase} rounded-l-md`} value={value} maxLength={7} placeholder="#000000" onChange={(e) => onChange(e.target.value)} />
                <button type="button" aria-label="Pick a color" onClick={() => setOpen((o) => !o)}
                    className="grid w-14 shrink-0 place-items-center rounded-r-md border border-l-0 border-line bg-surfacealt">
                    <span className="size-7 rounded-sm border border-line" style={{ background: valid ? value : "#000000" }} />
                </button>
            </div>
            {open && (
                <div className="absolute right-0 z-30 mt-2 rounded-xl border border-line bg-white p-3 shadow-xl">
                    <HexColorPicker color={valid ? value : "#000000"} onChange={onChange} />
                </div>
            )}
        </div>
    );
}

export function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <PhoneInput
            defaultCountry="us"
            value={value}
            onChange={(p) => onChange(p)}
            style={{ width: "100%" }}
            inputStyle={{ width: "100%", height: 40, fontSize: 14, borderRadius: "0 6px 6px 0" }}
            countrySelectorStyleProps={{ buttonStyle: { height: 40, borderRadius: "6px 0 0 6px", paddingInline: 8 } }}
        />
    );
}

export function Radio({ checked, onChange, label, name }: { checked: boolean; onChange: () => void; label: ReactNode; name: string }) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4 accent-brand" />
            {label}
        </label>
    );
}

export function RadioCard({ checked, onChange, title, note, name }: { checked: boolean; onChange: () => void; title: string; note: string; name: string }) {
    return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${checked ? "border-brand bg-brandsoft" : "border-line bg-white"}`}>
            <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 size-4 accent-brand" />
            <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-muted">{note}</span>
            </span>
        </label>
    );
}

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand" />
            {label}
        </label>
    );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-gray-300"}`}>
            <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
        </button>
    );
}

export function StatusToggle({ on, onChange, label, onText = "Active", offText = "Inactive" }: {
    on: boolean; onChange: (v: boolean) => void; label: string; onText?: string; offText?: string;
}) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
            className={`relative h-7 w-24 shrink-0 rounded-full text-xs font-semibold text-white transition-colors ${on ? "bg-brand" : "bg-gray-500"}`}>
            <span className={`absolute inset-y-0 flex items-center ${on ? "left-3" : "right-3"}`}>{on ? onText : offText}</span>
            <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[68px]" : ""}`} />
        </button>
    );
}

export function FileInput({ accept, file, onChange }: { accept?: string; file: File | null; onChange: (f: File | null) => void }) {
    return (
        <label className="flex min-h-10 cursor-pointer items-stretch overflow-hidden rounded-md border border-line bg-white text-sm">
            <span className="grid place-items-center border-r border-line bg-surfacealt px-3 font-medium text-ink">Choose File</span>
            <span className="flex min-w-0 flex-1 items-center truncate px-3 text-ink">{file ? file.name : "No file chosen"}</span>
            <input type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        </label>
    );
}

export function Section({ n, title, subtitle, action, children }: { n: number; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-3 border-b border-gray-300 pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-ink">{title}</h2>
                    {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
                </div>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            <div className="pt-5">{children}</div>
        </section>
    );
}

export function Stepper({ steps, current, onGo }: { steps: string[]; current: number; onGo: (i: number) => void }) {
    return (
        <ol className="flex w-full items-start overflow-x-auto px-6 py-5">
            {steps.map((s, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <li key={s} className="relative flex min-w-[96px] flex-1 flex-col items-center">
                        {i > 0 && (
                            <span className={`absolute left-[-50%] right-[50%] top-[15px] h-0.5 ${i <= current ? "bg-brand" : "bg-gray-300"}`} />
                        )}
                        <button type="button" onClick={() => onGo(i)}
                            className="relative z-10 flex flex-col items-center gap-2">
                            <span className={`grid size-8 place-items-center rounded-full border-2 text-xs font-bold ${active ? "border-brand bg-brand text-white"
                                : done ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted"}`}>
                                {done ? <CheckIcon className="size-4" /> : i + 1}
                            </span>
                            <span className={`text-center text-xs font-semibold ${active ? "text-brand" : done ? "text-ink" : "text-muted"}`}>{s}</span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}

export function SearchField({ value, onChange, placeholder = "Search…", label }: {
    value: string; onChange: (v: string) => void; placeholder?: string; label?: string;
}) {
    return (
        <div className="w-full">
            {label && <label className="mb-1.5 block text-xs font-semibold text-label">{label}</label>}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input className={`${inputCls} pl-9 pr-9`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
                {value && (
                    <button type="button" aria-label="Clear search" onClick={() => onChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X className="size-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

export function MultiSelect({ options, values, onChange, onAddOption, placeholder = "Select bundles" }: {
    options: string[]; values: string[]; onChange: (v: string[]) => void; onAddOption: (o: string) => void; placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const toggle = (o: string) => onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
    const add = () => {
        const v = draft.trim();
        if (!v) return;
        if (!options.includes(v)) onAddOption(v);
        if (!values.includes(v)) onChange([...values, v]);
        setDraft("");
        setAdding(false);
    };
    return (
        <div ref={ref}>
            <div className="flex items-start gap-2">
                <div className="relative flex-1">
                    <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputCls} flex items-center justify-between gap-2 text-left`}>
                        <span className={`truncate ${values.length ? "text-ink" : "text-gray-400"}`}>
                            {values.length ? `${values.length} selected` : placeholder}
                        </span>
                        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                        <ul className="thin-scrollbar absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg">
                            {options.map((o) => (
                                <li key={o}>
                                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50">
                                        <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} className="size-4 accent-brand" />
                                        {o}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button type="button" onClick={() => setAdding((a) => !a)} className={btn.brand}>
                    <Plus className="size-4" /> Add
                </button>
            </div>
            {adding && (
                <div className="mt-2 flex gap-2">
                    <input autoFocus className={inputCls} placeholder="New bundle name" value={draft}
                        onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
                    <button type="button" onClick={add} className={btn.secondary}>Add bundle</button>
                </div>
            )}
            {values.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {values.map((v) => (
                        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brandsoft px-2.5 py-1 text-xs font-semibold text-brand">
                            {v}
                            <button type="button" aria-label={`Remove ${v}`} onClick={() => toggle(v)}><X className="size-3" /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}