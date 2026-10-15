import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Check, DollarSign, FileText, Layers, Package, Pause, Plus, TrendingUp } from "lucide-react";

export interface Stat {
    label: string;
    value: string | number;
    note?: string;
    /** Optional. If omitted, an icon is picked from the label. */
    icon?: LucideIcon;
}

export const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0);

const TONES = {
    brand: "bg-brandsoft text-brand",
    good: "bg-goodbg text-good",
    bad: "bg-badbg text-bad",
    warn: "bg-warnbg text-warn",
    sky: "bg-sky-50 text-sky-600",
};

function look(label: string): { Icon: LucideIcon; tone: string } {
    const l = label.toLowerCase();
    if (l.includes("inactive")) return { Icon: Pause, tone: TONES.bad };
    if (l.includes("active")) return { Icon: Check, tone: TONES.good };
    if (l.includes("draft")) return { Icon: FileText, tone: TONES.warn };
    if (l.includes("highest") || l.includes("max")) return { Icon: ArrowUpRight, tone: TONES.good };
    if (l.includes("avg") || l.includes("average")) return { Icon: TrendingUp, tone: TONES.sky };
    if (l === "total margin") return { Icon: DollarSign, tone: TONES.warn };
    if (l.includes("add on") || l.includes("add-on")) return { Icon: Plus, tone: TONES.sky };
    if (l.includes("bundle") || l.includes("product")) return { Icon: Package, tone: TONES.brand };
    return { Icon: Layers, tone: TONES.brand };
}

export default function StatCards({ items }: { items: Stat[] }) {
    const xlCols = items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4";
    return (
        <div className={`grid gap-3 sm:grid-cols-2 ${xlCols}`}>
            {items.map((s) => {
                const { Icon, tone } = look(s.label);
                const Shown = s.icon ?? Icon;
                return (
                    <div key={s.label}
                        className="flex min-w-0 items-center gap-4 rounded-xl border border-line bg-white px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:[&:last-child:nth-child(odd)]:col-span-2 xl:[&:last-child:nth-child(odd)]:col-span-1">
                        <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}>
                            <Shown className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-muted">{s.label}</p>
                            <p className="mt-0.5 truncate text-2xl font-bold leading-tight tabular-nums text-ink">{s.value}</p>
                            {s.note && <p className="mt-0.5 truncate text-[11px] text-muted">{s.note}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}