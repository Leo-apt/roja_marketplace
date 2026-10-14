import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Columns3, Eye, Pencil, Plus, Settings, SlidersHorizontal, Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Pagination from "@/components/shared/Pagination";
import { btn, SearchField } from "./FormBits";
import { CatalogFilterDrawer, ColumnsDrawer, type FilterField } from "./ListDrawers";
import StatCards, { type Stat } from "./StatCards";

export interface Col<T> {
    key: string;
    label: string;
    render: (r: T) => ReactNode;
    align?: "right";
    link?: boolean;
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
}

const SIZE = 8;
const th = "whitespace-nowrap border-b border-linesoft bg-surfacealt px-3 py-3 text-left text-xs font-semibold leading-snug text-[#6a7790]";
const td = "whitespace-nowrap border-b border-linesoft px-3 py-3 align-middle text-xs text-[#3c4d66]";

export default function ListShell<T extends { id: string }>({
    rows, cols, basePath, createLabel, rowLabel, searchPlaceholder, filterFields, match, cards, onDelete,
}: Props<T>) {
    const nav = useNavigate();
    const { openDrawer } = useApp();
    const blank = Object.fromEntries(filterFields.map((f) => [f.key, "all"]));
    const [q, setQ] = useState("");
    const [f, setF] = useState<Record<string, string>>(blank);
    const [hidden, setHidden] = useState<string[]>([]);
    const [page, setPage] = useState(1);

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

    const filtered = rows.filter((r) => match(r, q.trim().toLowerCase(), f));
    const pages = Math.max(1, Math.ceil(filtered.length / SIZE));
    const cur = Math.min(page, pages);
    const start = (cur - 1) * SIZE;
    const pageRows = filtered.slice(start, start + SIZE);
    const shown = cols.filter((c) => !hidden.includes(c.key));
    const filtersActive = Object.values(f).some((v) => v !== "all") || q !== "";

    return (
        <div className="flex flex-col gap-4">
            {cards && <StatCards items={cards(filtered)} />}
            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[240px] max-w-[360px] flex-1">
                    <SearchField value={q} placeholder={searchPlaceholder} onChange={(v) => { setQ(v); setPage(1); }} />
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button className={btn.secondary}
                        onClick={() => openDrawer(
                            <CatalogFilterDrawer fields={filterFields} values={f} q={q}
                                onApply={(v, nq) => { setF(v); setQ(nq); setPage(1); }} />,
                        )}>
                        <SlidersHorizontal className="size-4" /> Filters{filtersActive ? " •" : ""}
                    </button>
                    <button className={btn.secondary}
                        onClick={() => openDrawer(
                            <ColumnsDrawer cols={cols.map((c) => ({ key: c.key, label: c.label }))} hidden={hidden} onApply={setHidden} />,
                        )}>
                        <Columns3 className="size-4" /> Columns
                    </button>
                    <button className={btn.brand} onClick={() => nav(`${basePath}/new`)}>
                        <Plus className="size-4" /> {createLabel}
                    </button>
                </div>
            </div>

            <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                <div className="w-full overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>S.No</th>
                                {shown.map((c) => <th key={c.key} className={`${th} ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>)}
                                <th className={th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((r, i) => (
                                <tr key={r.id} className="hover:bg-[#fafcff]">
                                    <td className={`${td} pl-5`}>{start + i + 1}</td>
                                    {shown.map((c) => (
                                        <td key={c.key} className={`${td} ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                                            {c.link ? (
                                                <button type="button" onClick={() => nav(`${basePath}/${r.id}`)}
                                                    className="text-left font-semibold text-brand hover:underline">
                                                    {c.render(r)}
                                                </button>
                                            ) : c.render(r)}
                                        </td>
                                    ))}
                                    <td className={td}>
                                        <button data-action-menu aria-label="Actions" title="Actions"
                                            onClick={(e) => openMenu(e, r.id)}
                                            className="rounded-md border border-line p-1.5 text-[#3c4d66] hover:bg-gray-50">
                                            <Settings className="size-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="px-5 py-12 text-center text-muted">
                            <strong className="block">No matching records</strong>
                            <p>Try a different search or clear the filters.</p>
                        </div>
                    )}
                </div>
                <Pagination
                    currentPage={cur}
                    totalPages={pages}
                    start={start}
                    end={Math.min(start + SIZE, filtered.length)}
                    total={filtered.length}
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
                    <button onClick={() => { nav(`${basePath}/${menu.id}/edit`); setMenu(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#3c4d66] hover:bg-gray-50">
                        <Pencil className="size-4" /> Edit
                    </button>
                    {onDelete && (
                        <button onClick={() => { onDelete(menu.id); setMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-bad hover:bg-badbg">
                            <Trash2 className="size-4" /> Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}