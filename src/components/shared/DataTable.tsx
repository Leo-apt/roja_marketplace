import { useState, type ReactNode } from "react";
import { useApp } from "@/hooks/useApp";
import type { Column } from "@/types/table";
import ColumnsDialog from "@/components/dialogs/ColumnsDialog";
import Tabs from "./Tabs";
import Pagination from "./Pagination";
import Dropdownbox from "./Dropdownbox";

interface Props<T> {
    rows: T[];
    cols: Column<T>[];
    viewKey: string;
    label: string;
    rowLabel?: string;
    tabs?: [string, string][];
    extra?: ReactNode;
    note?: string;
    selectable?: { id: (r: T) => string; disabled: (r: T) => boolean };
}

export default function DataTable<T>({ rows, cols, viewKey, label, rowLabel = "records", tabs = [], extra, note, selectable }: Props<T>) {
    const { filters, setFilters, hidden, openDialog, selected, setSelected } = useApp();
    const [sort, setSort] = useState("");
    const [dir, setDir] = useState(1);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(8);

    const hid = hidden[viewKey] ?? [];
    const shown = cols.filter((c) => !hid.includes(c.key));

    const sorted = [...rows];
    const sc = cols.find((c) => c.key === sort);
    if (sc) {
        const get = (r: T): string | number =>
            sc.sort ? sc.sort(r) : (((r as unknown as Record<string, unknown>)[sc.key] as string | number | undefined) ?? "");
        sorted.sort((a, b) => {
            const av = get(a);
            const bv = get(b);
            return dir * (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv)));
        });
    }

    const pages = Math.max(1, Math.ceil(sorted.length / size));
    const cur = Math.min(page, pages);
    const start = (cur - 1) * size;
    const pageRows = sorted.slice(start, start + size);

    const eligible = selectable ? pageRows.filter((r) => !selectable.disabled(r)) : [];
    const allChecked = !!selectable && eligible.length > 0 && eligible.every((r) => selected.has(selectable.id(r)));

    const toggle = (id: string, on: boolean) => {
        const n = new Set(selected);
        if (on) n.add(id);
        else n.delete(id);
        setSelected(n);
    };

    return (
        <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
            {tabs.length > 0 && (
                <Tabs
                    tabs={tabs}
                    value={filters.tab}
                    label="List views"
                    onChange={(k) => {
                        setFilters({ tab: k });
                        setPage(1);
                        setSort("");
                        setSelected(new Set());
                    }}
                />
            )}

            <div className="flex min-h-[54px] items-center justify-between gap-2 border-b border-line px-[17px] py-3 max-[850px]:flex-wrap">
                <span className="text-xs text-muted">
                    {selected.size > 0 && selectable ? <strong>{selected.size} eligible entries selected</strong> : `${rows.length} ${rowLabel} matching filters`}
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                    {extra}
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                        Rows
                        <Dropdownbox
                            name="rows"
                            value={String(size)}
                            options={[5, 8, 15, 30].map((n) => ({ value: String(n), label: String(n) }))}
                            onChange={(e) => { setSize(+e.target.value); setPage(1); }}
                            rounded="rounded-lg"
                            compact
                            className="w-[76px]"
                        />
                    </div>
                    <button
                        className="inline-flex min-h-[29px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => openDialog(<ColumnsDialog viewKey={viewKey} cols={cols.map((c) => ({ key: c.key, label: c.label }))} />)}
                    >
                        Columns
                    </button>
                </div>
            </div>

            <div className="w-full overflow-auto">
                <table className="w-full border-collapse text-left text-xs" aria-label={label}>
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="w-[34px] border-b border-linesoft bg-surfacealt px-3 py-3 pr-0 text-left text-xs font-semibold leading-snug text-th-text">
                                    <input
                                        type="checkbox"
                                        className="size-3.5 accent-brand"
                                        aria-label="Select eligible visible entries"
                                        checked={allChecked}
                                        onChange={(e) => {
                                            const n = new Set(selected);
                                            eligible.forEach((r) => (e.target.checked ? n.add(selectable.id(r)) : n.delete(selectable.id(r))));
                                            setSelected(n);
                                        }}
                                    />
                                </th>
                            )}
                            {shown.map((c) => (
                                <th key={c.key} className={`border-b border-linesoft bg-surfacealt px-3 py-3 text-left text-xs font-semibold leading-snug text-th-text ${c.align === "right" ? "text-right" : ""}`}>
                                    <button
                                        className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold leading-snug text-inherit"
                                        onClick={() => {
                                            if (sort === c.key) setDir(-dir);
                                            else {
                                                setSort(c.key);
                                                setDir(1);
                                            }
                                        }}
                                    >
                                        {c.label}
                                        {sort === c.key ? (dir === 1 ? " ↑" : " ↓") : ""}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((r, i) => (
                            <tr key={selectable ? selectable.id(r) : i} className="hover:bg-row-hover">
                                {selectable && (
                                    <td className="w-[34px] border-b border-linesoft px-3 py-3 pr-0">
                                        <input
                                            type="checkbox"
                                            className="size-3.5 accent-brand"
                                            aria-label={`Select ${selectable.id(r)}`}
                                            checked={selected.has(selectable.id(r))}
                                            disabled={selectable.disabled(r)}
                                            onChange={(e) => toggle(selectable.id(r), e.target.checked)}
                                        />
                                    </td>
                                )}
                                {shown.map((c, j) => (
                                    <td
                                        key={c.key}
                                        className={`border-b border-linesoft px-3 py-3 align-middle text-cell-text ${c.align === "right" ? "text-right tabular-nums" : ""} ${j === 0 ? "min-w-[118px] whitespace-nowrap" : ""}`}
                                    >
                                        {c.render(r)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {rows.length === 0 && (
                    <div className="px-5 py-12 text-center text-muted">
                        <strong className="block">No matching records</strong>
                        <p>Try a different date range or clear the filters.</p>
                    </div>
                )}
            </div>

            <Pagination
                currentPage={cur}
                totalPages={pages}
                start={start}
                end={Math.min(start + size, rows.length)}
                total={rows.length}
                itemLabel={rowLabel}
                onPageChange={setPage}
            />

            {note && <div className="border-t border-line px-[18px] py-[13px] text-[11px] text-muted">{note}</div>}
        </section>
    );
}