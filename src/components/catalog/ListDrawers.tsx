import { useState } from "react";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { btn, Check, SearchField } from "./FormBits";

export interface FilterField {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    type?: "select" | "date"; // date: value is "YYYY-MM-DD" or "all" (= empty)
}

export function CatalogFilterDrawer({ fields, values, q, onApply }: {
    fields: FilterField[]; values: Record<string, string>; q: string;
    onApply: (v: Record<string, string>, q: string) => void;
}) {
    const [draft, setDraft] = useState(values);
    const [dq, setDq] = useState(q);
    const blank = Object.fromEntries(fields.map((f) => [f.key, "all"]));
    return (
        <Drawer
            title="Filters"
            kicker="Narrow down the list"
            width="min(420px, calc(100vw - 20px))"
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={() => { setDraft(blank); setDq(""); }}>Reset</button>
                    <button className={btn.primary} onClick={() => { onApply(draft, dq); close(); }}>Apply</button>
                </>
            )}
        >
            {fields.map((f) => f.type === "date" ? (
                <DatePicker
                    key={f.key}
                    name={f.key}
                    label={f.label}
                    value={draft[f.key] && draft[f.key] !== "all" ? draft[f.key] : ""}
                    minDate={f.key === "to" && draft.from && draft.from !== "all" ? draft.from : undefined}
                    maxDate={f.key === "from" && draft.to && draft.to !== "all" ? draft.to : undefined}
                    onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v || "all" }))}
                />
            ) : (
                <Dropdownbox
                    key={f.key}
                    name={f.key}
                    label={f.label}
                    value={draft[f.key] ?? "all"}
                    options={f.options}
                    rounded="rounded-lg"
                    compact
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
            ))}
            <SearchField label="Search" value={dq} onChange={setDq} />
        </Drawer>
    );
}

export function ColumnsDrawer({ cols, hidden, onApply }: {
    cols: { key: string; label: string }[]; hidden: string[]; onApply: (hidden: string[]) => void;
}) {
    const [draft, setDraft] = useState(hidden);
    return (
        <Drawer
            title="Show / hide columns"
            kicker="Choose the columns to display"
            width="min(380px, calc(100vw - 20px))"
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={() => setDraft([])}>Show all</button>
                    <button className={btn.primary} onClick={() => { onApply(draft); close(); }}>Apply</button>
                </>
            )}
        >
            <div className="flex flex-col gap-3">
                {cols.map((c) => (
                    <Check
                        key={c.key}
                        label={c.label}
                        checked={!draft.includes(c.key)}
                        onChange={(on) => setDraft((d) => (on ? d.filter((k) => k !== c.key) : [...d, c.key]))}
                    />
                ))}
            </div>
        </Drawer>
    );
}