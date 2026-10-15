import { orders } from "@/data/orders";
import { financeRows, totals } from "@/domain/finance";
import { within, type Filters } from "@/domain/filters";
import { money } from "@/utils/money";

export default function TrendChart({ f }: { f: Filters }) {
    const days = [
        ...new Set(
            orders
                .flatMap((o) => [o.captureDate, o.refundDate, o.creditDate, o.disputeDate])
                .filter((d): d is string => !!d && within(d, f)),
        ),
    ].sort();
    if (!days.length) return <p className="text-muted">No financial events in this range.</p>;

    const values = days.map((d) => {
        const t = totals(financeRows({ ...f, from: d, to: d }));
        return { d, s: t.capturedSales, g: t.gross };
    });
    const upper = Math.max(1, ...values.flatMap((v) => [v.s, v.g]));
    const lower = Math.min(0, ...values.map((v) => v.g));
    const height = 150;
    const range = upper - lower;
    const y = (n: number) => 28 + ((upper - n) / range) * height;
    const base = y(0);
    const dx = 560 / values.length;

    return (
        <svg
            className="block h-auto max-h-[220px] w-full"
            viewBox="0 0 640 225"
            role="img"
            aria-label="Captured product sales and adjusted gross margin by financial event date, US dollars"
        >
            <text x="8" y="20" className="fill-th-text" fontSize="10">USD</text>
            <text x="8" y="39" className="fill-th-text" fontSize="10">{money(upper)}</text>
            <line x1="52" y1={base} x2="620" y2={base} className="stroke-chart-grid" />
            <text x="8" y={base + 3} className="fill-th-text" fontSize="10">$0</text>
            {values.map((v, i) => {
                const x = 58 + i * dx;
                const w = Math.min(20, dx * 0.29);
                return (
                    <g key={v.d}>
                        <rect x={x} y={y(v.s)} width={w} height={Math.abs(base - y(v.s))} rx="2" className="fill-chart-sales">
                            <title>{`${v.d}: captured sales ${money(v.s)}`}</title>
                        </rect>
                        <rect x={x + w + 3} y={Math.min(base, y(v.g))} width={w} height={Math.abs(base - y(v.g))} rx="2" className={v.g < 0 ? "fill-chart-loss" : "fill-chart-gain"}>
                            <title>{`${v.d}: gross margin ${money(v.g)}`}</title>
                        </rect>
                        <text x={x + w} y="205" textAnchor="middle" fontSize="10" className="fill-th-text">{v.d.slice(5)}</text>
                    </g>
                );
            })}
        </svg>
    );
}