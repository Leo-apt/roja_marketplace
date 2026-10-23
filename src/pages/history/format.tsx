// Shared helpers for the History pages: money, dates and the stats cell.
import type { Paid, Stats } from "@/services/history.service";

// amount is in the smallest unit (cents). Zero-decimal currencies (e.g. JPY) would show 100x too small.
export const money = (cents: number, currency = "usd") => {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
    } catch {
        return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
    }
};

export const when = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export const paidText = (paid: Paid[]) => (paid.length ? paid.map((p) => money(p.amount, p.currency)).join(" + ") : "-");

export const th = "whitespace-nowrap border-b border-linesoft bg-surfacealt px-3 py-3 text-left text-xs font-bold leading-snug text-th-text";
export const td = "whitespace-nowrap border-b border-linesoft px-3 py-3 align-middle text-xs text-td-text";

export function StatsCell({ s }: { s: Stats }) {
    return (
        <span className="flex flex-col">
            <span className="font-semibold text-ink">{s.calls} calls</span>
            {s.failed > 0 && <span className="text-bad">{s.failed} failed</span>}
        </span>
    );
}

export function CallStatus({ status }: { status: "success" | "failed" }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === "success" ? "bg-goodbg text-good" : "bg-badbg text-bad"}`}>
            {status === "success" ? "Success" : "Failed"}
        </span>
    );
}