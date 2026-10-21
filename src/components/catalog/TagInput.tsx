import { useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export default function TagInput({ id, values, onChange, placeholder, sanitize = (s) => s, validate, maxItems = 20, maxLen = 50, onTouch }: {
    id?: string;
    values: string[];
    onChange: (v: string[]) => void;
    placeholder?: string;
    sanitize?: (s: string) => string;
    validate?: (token: string) => string;
    maxItems?: number;
    maxLen?: number;
    onTouch?: () => void;
}) {
    const [draft, setDraft] = useState("");
    const [hint, setHint] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const problem = (t: string, list: string[]) =>
        t.length > maxLen ? `Each value must be at most ${maxLen} characters`
            : list.length >= maxItems ? `You can add at most ${maxItems} values`
                : list.some((v) => v.toLowerCase() === t.toLowerCase()) ? `"${t}" is already added`
                    : validate?.(t) ?? "";

    /** Adds every valid token; returns true when none were rejected. */
    const addAll = (parts: string[]) => {
        let next = values;
        let err = "";
        for (const p of parts) {
            const t = sanitize(p).trim();
            if (!t) continue;
            const e = problem(t, next);
            if (e) err = e;
            else next = [...next, t];
        }
        if (next !== values) onChange(next);
        setHint(err);
        return !err;
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (addAll([draft])) setDraft("");
        } else if (e.key === "Tab" && draft.trim()) {
            e.preventDefault();
            if (addAll([draft])) setDraft("");
        } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
            setHint("");
        }
    };

    return (
        <div>
            <div
                onClick={() => inputRef.current?.focus()}
                className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
            >
                {values.map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brandsoft px-2.5 py-1 text-xs font-semibold text-brand">
                        {v}
                        <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    id={id}
                    ref={inputRef}
                    value={draft}
                    placeholder={values.length ? "" : placeholder}
                    className="min-w-[80px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-ink outline-none placeholder:text-gray-400"
                    onChange={(e) => {
                        const v = e.target.value;
                        setHint("");
                        if (v.includes(",")) { // comma (or a pasted list) adds everything before it
                            const parts = v.split(",");
                            const rest = parts.pop() ?? "";
                            addAll(parts);
                            setDraft(sanitize(rest).replace(/^\s+/, ""));
                        } else setDraft(sanitize(v).replace(/^\s+/, ""));
                    }}
                    onKeyDown={onKeyDown}
                    onBlur={() => { if (draft.trim() && addAll([draft])) setDraft(""); onTouch?.(); }}
                />
            </div>
            {hint && <p className="mt-1 text-xs text-bad" role="alert">{hint}</p>}
        </div>
    );
}