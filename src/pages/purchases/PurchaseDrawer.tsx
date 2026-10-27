// Side drawer for one purchase, with Summary, Provider components, Payments, Fulfillment, Subscription, Margin, Settlement and Timeline tabs.
import { useState, type ReactNode } from "react";
import Drawer from "@/components/shared/Drawer";
import type { DataMode } from "@/env/EnvContext";
import { money } from "@/pages/history/format";
import { th, td } from "@/pages/history/format";
import type { Purchase } from "./purchasesData";

const GOOD = "bg-goodbg text-good", BAD = "bg-badbg text-bad", WARN = "bg-warnbg text-warn";
const TONE: Record<string, string> = {
    Captured: GOOD, Failed: BAD, "No charge": "bg-surfacealt text-ink",
    Active: GOOD, Delivered: GOOD, "Partially fulfilled": WARN, "Not started": BAD,
    Paid: GOOD, "Awaiting client payment": WARN, "N/A": "bg-surfacealt text-ink",
    Cleared: GOOD, Pending: WARN, Trialing: "bg-brandsoft text-brand", Cancelled: BAD, "Past due": BAD,
    Ready: GOOD, Held: WARN, "Awaiting merchant deposit": WARN, "Not payable": "bg-surfacealt text-ink",
    Approved: GOOD, Published: GOOD, Rejected: BAD, Voided: BAD, "Pending approval": WARN, Draft: WARN, Suspended: BAD,
    "Payment submitted": "bg-brandsoft text-brand",
};

export const Pill = ({ text }: { text: string }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE[text] ?? "bg-surfacealt text-ink"}`}>{text}</span>
);

const TABS = [
    ["summary", "Summary"], ["components", "Provider components"], ["payments", "Payments"], ["fulfillment", "Fulfillment"],
    ["subscription", "Subscription"], ["margin", "Margin"], ["settlement", "Settlement"], ["timeline", "Timeline"],
] as const;
export type Tab = (typeof TABS)[number][0];

const Box = ({ children }: { children: ReactNode }) => <div className="rounded-xl border border-line bg-card p-5">{children}</div>;
const Note = ({ children, warn }: { children: ReactNode; warn?: boolean }) => (
    <div className={`rounded-lg px-4 py-3 text-xs ${warn ? "border border-note-warn-border bg-note-warn-bg font-semibold text-note-warn-text" : "border border-note-info-border bg-note-info-bg text-note-info-text"}`}>{children}</div>
);
const KV = ({ rows }: { rows: [string, ReactNode][] }) => (
    <Box>
        <dl className="grid gap-4 text-xs sm:grid-cols-2">
            {rows.map(([k, v]) => <div key={k}><dt className="font-semibold text-muted">{k}</dt><dd className="mt-0.5 break-all text-ink">{v}</dd></div>)}
        </dl>
    </Box>
);
const Money = ({ rows }: { rows: [string, number, boolean?][] }) => (
    <Box>
        <div className="flex flex-col gap-2.5 text-xs">
            {rows.map(([k, v, strong]) => (
                <div key={k} className={`flex justify-between ${strong ? "border-t border-line pt-2.5 font-bold" : ""}`}>
                    <span className="text-muted">{k}</span><span className={v < 0 ? "text-bad" : "text-ink"}>{money(v)}</span>
                </div>
            ))}
        </div>
    </Box>
);
const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
    <div className="overflow-auto rounded-xl border border-line bg-card">
        <table className="w-full border-collapse text-left text-xs">
            <thead><tr>{head.map((h, i) => <th key={h} className={`${th} ${i === 0 ? "pl-5" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`${td} ${j === 0 ? "pl-5" : ""}`}>{c}</td>)}</tr>)}</tbody>
        </table>
    </div>
);

export default function PurchaseDrawer({ row, mode, initial = "summary" }: { row: Purchase; mode: DataMode; initial?: Tab }) {
    const [tab, setTab] = useState<Tab>(initial);
    const captured = row.payment === "Captured";
    const net = captured ? row.amount - row.refund - row.fee : 0;
    const subState = row.type === "Trial" ? "Trialing" : row.refund ? "Cancelled" : row.payment === "Failed" ? "Past due" : "Active";

    // margin (order lifetime): refunds reduce customer sales, but a client credit and a supplier credit are separate confirmed events
    const sales = captured ? row.amount - row.refund : 0;
    const platform = row.wholesale - row.cost;
    const client = sales - row.wholesale;
    const settle = !captured ? "Not payable"
        : row.hold || row.fulfillment !== "Active" && row.fulfillment !== "Delivered" ? "Held"
            : row.receipt !== "Paid" ? "Awaiting client payment"
                : row.gatewayFunds !== "Cleared" ? "Awaiting merchant deposit" : "Ready";

    const events: [string, string][] = [
        [row.date, "Purchase created"],
        [row.date, `Payment ${row.payment.toLowerCase()}`],
        ...(row.refund ? ([[row.date, `Customer refund ${money(row.refund)}`]] as [string, string][]) : []),
    ];

    const body: Record<Tab, ReactNode> = {
        summary: (
            <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[["Amount", money(row.amount)], ["Refund", money(row.refund)], ["Gateway fee", money(row.fee)], ["Net amount", money(net)]].map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-line bg-surfacealt p-3">
                            <p className="text-[11px] font-semibold text-muted">{k}</p><p className="mt-1 text-sm font-bold text-ink">{v}</p>
                        </div>
                    ))}
                </div>
                {row.hold && <Note warn>{row.hold}</Note>}
                <KV rows={[["Client", row.client], ["Environment", row.env], ["Customer", row.customer], ["Product", row.product],
                ["Provider", row.provider], ["Purchase type", row.type], ["Merchant profile", row.merchant], ["Purchase date", row.date]]} />
                <Note>Client, environment and commercial terms are frozen on the purchase. Later catalog or onboarding changes do not alter it.</Note>
            </>
        ),
        components: (
            <>
                <Table head={["Component", "Provider", "Qty", "Customer R", "Client W", "Provider C"]}
                    rows={[[row.product, row.provider, 1, money(row.amount), money(row.wholesale), money(row.cost)]]} />
                <Note>A multi-provider bundle is one parent sale with allocated component values. Parent and component amounts are never counted twice.</Note>
            </>
        ),
        payments: (
            <>
                <KV rows={[["Transaction reference", captured ? row.reference : "No captured charge"], ["Merchant profile", row.merchant],
                ["Payment result", <Pill text={row.payment} />], ["Gateway funds clearing", <Pill text={row.gatewayFunds} />],
                ["Payment method", "Visa ••4242 (sample)"], ["Client receipt", <Pill text={row.receipt} />]]} />
                <Money rows={[["Captured customer amount", captured ? row.amount : 0], ["Customer refund", row.refund], ["Gateway fee", row.fee]]} />
                <Note>Customer payment, client payment to the Master and provider payout are separate records. No card or bank details are shown.</Note>
            </>
        ),
        fulfillment: (
            <>
                <Table head={["Provider", "Product / enrollment", "Outcome", "Action"]}
                    rows={[[row.provider, <>{row.product}<div className="font-mono text-[11px] text-muted">ENR-DEMO-{row.id}</div></>, <Pill text={row.fulfillment} />, row.hold || "No action required"]]} />
                <Note>A paid activation failure does not trigger a second customer charge.</Note>
            </>
        ),
        subscription: row.subscriptionId ? (
            <>
                <KV rows={[["Subscription ID", row.subscriptionId], ["Agreement status", <Pill text={subState} />],
                ["Next charge / trial end", row.nextCharge || "None"], ["Client / merchant", `${row.client} · ${row.merchant}`]]} />
                <Note>Existing subscriptions stay in history even if the client's catalog assignment changes.</Note>
            </>
        ) : <Note>One-time purchase; no subscription.</Note>,
        margin: (
            <>
                <Note>Order lifetime. Master margin plus client margin equals combined product margin.</Note>
                <Money rows={[["Net customer sales", sales], ["Net Master billing to client", row.wholesale], ["Net provider cost", row.cost],
                ["Master platform margin", platform], ["Client margin", client], ["Gateway fee", row.fee],
                ["Combined contribution", sales - row.cost - row.fee, true]]} />
                <Note warn>A customer refund does not create a client credit or a supplier credit automatically. Each needs its own confirmed event.</Note>
            </>
        ),
        settlement: (
            <>
                <Table head={["Provider", "Net payable", "State", "Hold"]}
                    rows={[[row.provider, money(row.cost), <Pill text={settle} />, row.hold || (settle === "Ready" ? "Eligible" : "-")]]} />
                <KV rows={[["Client receipt state", <Pill text={row.receipt} />], ["Gateway funds", <Pill text={row.gatewayFunds} />]]} />
            </>
        ),
        timeline: (
            <Box>
                <ol className="flex flex-col gap-3 text-xs">
                    {events.map(([d, t], i) => (
                        <li key={i} className="flex gap-3"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" /><span><b className="text-ink">{t}</b><span className="block text-muted">{d}</span></span></li>
                    ))}
                </ol>
            </Box>
        ),
    };

    return (
        <Drawer title={row.id} kicker={`${row.client} · ${row.env} · ${mode === "live" ? "Live" : "Sandbox"}`}>
            <div className="flex flex-wrap items-center gap-2">
                <Pill text={row.payment} /><Pill text={row.fulfillment} /><Pill text={row.receipt} />
            </div>
            <div role="tablist" aria-label="Purchase details" className="flex gap-1 overflow-x-auto border-b border-line">
                {TABS.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                        className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}>
                        {label}
                    </button>
                ))}
            </div>
            {body[tab]}
        </Drawer>
    );
}