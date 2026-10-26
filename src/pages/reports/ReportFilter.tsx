// Shared search + "View by" filter and grouped table for the report drawers.
import { SearchField } from "@/components/catalog/FormBits";
import { money, td, th } from "@/pages/history/format";
import { marginOf, summarize, type ReportRow } from "./reportData";

export type GroupBy = "client" | "env" | "product";

const OPTIONS: { value: GroupBy; label: string }[] = [
    { value: "client", label: "Client wise" },
    { value: "env", label: "Environment wise" },
    { value: "product", label: "Product wise" },
];

export default function DrawerFilter({ q, onQ, by, onBy, placeholder }: {
    q: string; onQ: (v: string) => void; by: GroupBy; onBy: (v: GroupBy) => void; placeholder: string;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[180px] flex-1"><SearchField value={q} onChange={onQ} placeholder={placeholder} /></div>
            <select aria-label="View by" value={by} onChange={(e) => onBy(e.target.value as GroupBy)}
                className="h-10 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
                {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

const keyOf = (r: ReportRow, by: GroupBy) => (by === "client" ? r.client : by === "env" ? `${r.client} · ${r.env}` : r.product);
const NAME_HEAD: Record<GroupBy, string> = { client: "Client", env: "Environment", product: "Product" };
const COUNT_HEAD: Record<GroupBy, string> = { client: "Environments", env: "Products", product: "Used in" };

export function GroupTable({ rows, by, q, active }: { rows: ReportRow[]; by: GroupBy; q: string; active?: string }) {
    const map = new Map<string, ReportRow[]>();
    for (const r of rows) {
        const k = keyOf(r, by);
        map.set(k, [...(map.get(k) ?? []), r]);
    }
    const t = q.trim().toLowerCase();
    const groups = [...map.entries()]
        .filter(([k]) => !t || k.toLowerCase().includes(t))
        .map(([k, rs]) => ({
            k,
            count: new Set(rs.map((r) => (by === "client" ? r.env : by === "env" ? r.product : `${r.client}|${r.env}`))).size,
            sales: summarize(rs.flatMap((r) => r.txns)).sales,
            margin: rs.reduce((n, r) => n + marginOf(r), 0),
        }));

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full border-collapse text-left text-xs">
                <thead>
                    <tr><th className={`${th} pl-5`}>{NAME_HEAD[by]}</th><th className={th}>{COUNT_HEAD[by]}</th><th className={th}>Sales</th><th className={th}>Margin</th></tr>
                </thead>
                <tbody>
                    {groups.map((g) => (
                        <tr key={g.k} className={g.k === active ? "bg-brandsoft" : ""}>
                            <td className={`${td} pl-5 font-semibold text-ink`}>{g.k}</td>
                            <td className={td}>{g.count}</td>
                            <td className={td}>{money(g.sales)}</td>
                            <td className={td}>{money(g.margin)}</td>
                        </tr>
                    ))}
                    {groups.length === 0 && <tr><td colSpan={4} className={`${td} pl-5 text-muted`}>No matches</td></tr>}
                </tbody>
            </table>
        </div>
    );
}