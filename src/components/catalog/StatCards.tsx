export interface Stat {
    label: string;
    value: string | number;
    note?: string;
}

export const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0);

export default function StatCards({ items }: { items: Stat[] }) {
    const xlCols = items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4";
    return (
        <div className={`grid gap-3 sm:grid-cols-2 ${xlCols}`}>
            {items.map((s) => (
                <div key={s.label} className="rounded-xl border border-line bg-white px-4 py-3.5">
                    <p className="text-xs font-semibold text-muted">{s.label}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-ink">{s.value}</p>
                    {s.note && <p className="mt-0.5 text-[11px] text-muted">{s.note}</p>}
                </div>
            ))}
        </div>
    );
}