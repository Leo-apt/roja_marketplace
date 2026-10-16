import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Eye, Pencil, Plus, Settings, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { useDebounce } from "@/hooks/useDebounce";
import Pagination from "@/components/shared/Pagination";
import { btn, SearchField } from "./FormBits";
import { CatalogFilterDrawer, ColumnsDrawer, type FilterField } from "./ListDrawers";
import StatCards, { type Stat } from "./StatCards";
import EmptyState from "@/components/shared/EmptyState";

export interface Col<T> {
    key: string;
    label: string;
    render: (r: T) => ReactNode;
    align?: "right" | "center";
    link?: boolean;
    sortValue?: (r: T) => string | number | null;
}

interface Props<T extends { id: string }> {
    rows: T[];
    cols: Col<T>[];
    basePath: string;
    createLabel: string;
    rowLabel: string;
    searchPlaceholder: string;
    filterFields: FilterField[];
    match: (r: T, q: string, f: Record<string, string>) => boolean;
    cards?: (rows: T[]) => Stat[];
    onDelete?: (id: string) => void;
    onCreate?: () => void;
    onEdit?: (id: string) => void;
    /** Server mode: rows is the current page only; paging and search go through onChange. */
    server?: { total: number; pageSize: number; loading?: boolean; onChange: (page: number, q: string, f: Record<string, string>) => void };
}

const SIZE = 8;
const th = "whitespace-nowrap border-b border-linesoft bg-surfacealt px-3 py-3 text-left text-xs font-bold leading-snug text-th-text";
const td = "whitespace-nowrap border-b border-linesoft px-3 py-3 align-middle text-xs text-td-text";

export default function ListShell<T extends { id: string }>({
    rows, cols, basePath, createLabel, rowLabel, searchPlaceholder, filterFields, match, cards, onDelete, onCreate, onEdit, server,
}: Props<T>) {
    const nav = useNavigate();
    const { openDrawer } = useApp();
    const blank = Object.fromEntries(filterFields.map((f) => [f.key, "all"]));
    const [q, setQ] = useState("");
    const [f, setF] = useState<Record<string, string>>(blank);
    const [hidden, setHidden] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
    const valueOf = (c: Col<T>, r: T) => (c.sortValue ? c.sortValue(r) : (r as unknown as Record<string, unknown>)[c.key]);
    const canSort = (c: Col<T>) => rows.some((r) => ["string", "number"].includes(typeof valueOf(c, r)));
    const toggleSort = (key: string) => {
        setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
        setPage(1);
    };

    // server mode: ask the parent for a page whenever the page or the search text changes
    const dq = useDebounce(q.trim(), 600);
    const prevQ = useRef(dq);
    useEffect(() => {
        if (!server) return;
        if (prevQ.current !== dq) { // search text changed: go back to page 1 in the same request
            prevQ.current = dq;
            if (page !== 1) { setPage(1); return; }
        }
        server.onChange(page, dq, f);
    }, [page, dq, f]); // eslint-disable-line react-hooks/exhaustive-deps

    const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);

    useEffect(() => {
        if (!menu) return;
        const close = () => setMenu(null);
        const onDown = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest("[data-action-menu]")) close();
        };
        window.addEventListener("scroll", close, true); // true = also catches table scroll
        window.addEventListener("resize", close);
        document.addEventListener("mousedown", onDown);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
            document.removeEventListener("mousedown", onDown);
        };
    }, [menu]);

    const openMenu = (e: ReactMouseEvent<HTMLButtonElement>, id: string) => {
        if (menu?.id === id) { setMenu(null); return; }
        const r = e.currentTarget.getBoundingClientRect();
        const h = onDelete ? 124 : 88; // dropdown height
        const top = r.bottom + h > window.innerHeight ? r.top - h - 4 : r.bottom + 4; // opens upward near screen bottom
        setMenu({ id, top, left: Math.max(8, r.right - 144) });
    };

    const base = server ? rows : rows.filter((r) => match(r, q.trim().toLowerCase(), f));
    const sortCol = sort ? cols.find((c) => c.key === sort.key) : undefined;
    const filtered = sortCol && sort
        ? [...base].sort((a, b) => {
            const x = valueOf(sortCol, a), y = valueOf(sortCol, b);
            const r = typeof x === "number" && typeof y === "number"
                ? x - y : String(x ?? "").localeCompare(String(y ?? ""), undefined, { numeric: true });
            return sort.dir === "asc" ? r : -r;
        })
        : base;
    const size = server?.pageSize ?? SIZE;
    const count = server ? server.total : filtered.length;
    const pages = Math.max(1, Math.ceil(count / size));
    const cur = Math.min(page, pages);
    const start = (cur - 1) * size;
    const pageRows = server ? filtered : filtered.slice(start, start + size);
    const shown = cols.filter((c) => !hidden.includes(c.key));
    const filtersActive = Object.values(f).some((v) => v !== "all") || q !== "";

    return (
        <div className="flex flex-col gap-4">
            {cards && <StatCards items={cards(filtered)} />}
            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[240px] max-w-[360px] flex-1">
                    <SearchField value={q} placeholder={searchPlaceholder} onChange={(v) => { setQ(v); if (!server) setPage(1); }} />
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button className={btn.secondary}
                        onClick={() => openDrawer(
                            <CatalogFilterDrawer fields={filterFields} values={f} q={q}
                                onApply={(v, nq) => { setF(v); setQ(nq); setPage(1); }} />,
                        )}>
                        <SlidersHorizontal className="size-4" /> Filters{filtersActive ? " •" : ""}
                    </button>
                    <button className={btn.navy}
                        onClick={() => openDrawer(
                            <ColumnsDrawer cols={cols.map((c) => ({ key: c.key, label: c.label }))} hidden={hidden} onApply={setHidden} />,
                        )}>
                        <Columns3 className="size-4" /> Columns
                    </button>
                    <button className={btn.brand} onClick={() => (onCreate ? onCreate() : nav(`${basePath}/new`))}>
                        <Plus className="size-4" /> {createLabel}
                    </button>
                </div>
            </div>

            <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                <div className={`w-full overflow-auto transition-opacity ${server?.loading ? "opacity-50" : ""}`}>
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>S.No</th>
                                {shown.map((c) => (
                                    <th key={c.key} className={`${th} ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}>
                                        {canSort(c) ? (
                                            <button type="button" onClick={() => toggleSort(c.key)}
                                                className={`inline-flex items-center gap-1 ${c.align === "right" ? "flex-row-reverse" : ""}`}>
                                                {c.label}
                                                {sort?.key === c.key
                                                    ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)
                                                    : <ChevronsUpDown className="size-3 text-sort-icon" />}
                                            </button>
                                        ) : c.label}
                                    </th>
                                ))}
                                <th className={th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((r, i) => (
                                <tr key={r.id} className="hover:bg-row-hover">
                                    <td className={`${td} pl-5`}>{start + i + 1}</td>
                                    {shown.map((c) => (
                                        <td key={c.key} className={`${td} ${c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center tabular-nums" : ""}`}>
                                            {c.link ? (
                                                <button type="button" onClick={() => nav(`${basePath}/${r.id}`)}
                                                    className="text-left font-semibold text-link hover:underline">
                                                    {c.render(r)}
                                                </button>
                                            ) : c.render(r)}
                                        </td>
                                    ))}
                                    <td className={td}>
                                        <button data-action-menu aria-label="Actions" title="Actions"
                                            onClick={(e) => openMenu(e, r.id)}
                                            className="group rounded-md bg-action p-1.5 text-white hover:bg-action-hover">
                                            <Settings className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pageRows.length === 0 && !server?.loading && (
                        <EmptyState
                            title={filtersActive ? "No matching records" : "No records found"}
                            message={filtersActive ? "Try a different search or clear the filters." : "Records you create will show up here."}
                        />
                    )}
                </div>
                <Pagination
                    currentPage={cur}
                    totalPages={pages}
                    start={start}
                    end={Math.min(start + size, count)}
                    total={count}
                    itemLabel={rowLabel}
                    onPageChange={setPage}
                />
            </section>
            {menu && (
                <div data-action-menu style={{ top: menu.top, left: menu.left }}
                    className="fixed z-50 w-36 rounded-lg border border-line bg-white py-1 shadow-lg">
                    <button onClick={() => { nav(`${basePath}/${menu.id}`); setMenu(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-brand hover:bg-brandsoft">
                        <Eye className="size-4" /> View
                    </button>
                    <button onClick={() => { if (onEdit) onEdit(menu.id); else nav(`${basePath}/${menu.id}/edit`); setMenu(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-cell-text hover:bg-gray-50">
                        <Pencil className="size-4" /> Edit
                    </button>
                    {/* {onDelete && (
                        <button onClick={() => { onDelete(menu.id); setMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-bad hover:bg-badbg">
                            <Trash2 className="size-4" /> Delete
                        </button>
                    )} */}
                </div>
            )}
        </div>
    );
}