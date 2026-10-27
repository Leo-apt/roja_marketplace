// Overview: sales, margins, purchases and settlement position per client (sample data for now).
import { useNavigate } from "react-router-dom";
import { Banknote, BadgePercent, DollarSign, HandCoins, Receipt, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import StatCards, { type Stat } from "@/components/catalog/StatCards";
import { useEnv } from "@/env/EnvContext";
import { money, td, th } from "@/pages/history/format";
import { CLIENTS, PURCHASE_DATA, needsAttention } from "@/pages/purchases/purchasesData";
import { MARGIN_DATA } from "@/pages/marginReport/marginData";
import { payables, receivables } from "@/pages/settlements/settlementData";

const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + f(x), 0);

const LINKS: [string, string][] = [
    ["Purchases", "/marketplace/purchases"], ["Subscriptions", "/marketplace/subscriptions"], ["Margins", "/marketplace/margins"],
    ["Settlements", "/marketplace/settlements"], ["Approvals", "/marketplace/approvals"], ["Reports", "/marketplace/reports"],
];

export default function Overview() {
    const nav = useNavigate();
    const { mode } = useEnv();
    const orders = PURCHASE_DATA[mode];
    const margins = MARGIN_DATA[mode];
    const pay = payables(mode);
    const recv = receivables(mode);

    const money1: Stat[] = [
        { label: "Net customer sales (R)", value: money(sum(margins, (r) => r.sales)), note: "After refunds", icon: DollarSign },
        { label: "Master platform margin", value: money(sum(margins, (r) => r.platform)), note: "Net client price (W) − net provider cost (C)", icon: TrendingUp },
        { label: "Client gross margin", value: money(sum(margins, (r) => r.clientMargin)), note: "Customer net sales − net Master billing", icon: BadgePercent },
        { label: "Combined contribution", value: money(sum(margins, (r) => r.contribution)), note: "Master + client margin − gateway fees", icon: Wallet },
    ];
    const money2: Stat[] = [
        { label: "Orders", value: orders.length, note: "All purchases in this environment", icon: Receipt },
        { label: "Needs attention", value: orders.filter(needsAttention).length, note: "Payment, provider or receipt exceptions", icon: TriangleAlert },
        { label: "Ready provider payable", value: money(sum(pay.filter((p) => p.status === "Ready"), (p) => p.amount)), note: "Eligible for a payout batch", icon: Banknote },
        { label: "Client receivable due", value: money(sum(recv, (r) => r.balance)), note: "Client merchant to Master", icon: HandCoins },
    ];

    const rows = CLIENTS.map((c) => {
        const m = margins.filter((r) => r.client === c);
        const o = orders.filter((r) => r.client === c);
        return { c, orders: o.length, attention: o.filter(needsAttention).length, sales: sum(m, (r) => r.sales), platform: sum(m, (r) => r.platform), client: sum(m, (r) => r.clientMargin) };
    });

    return (
        <div className="flex flex-col gap-4">
            <StatCards items={money1} />
            <StatCards items={money2} />

            <div className="flex flex-wrap gap-2">
                {LINKS.map(([label, path]) => (
                    <button key={path} type="button" onClick={() => nav(path)}
                        className="rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-link hover:bg-brandsoft">
                        {label}
                    </button>
                ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-line bg-card">
                <div className="border-b border-line px-5 py-[17px]">
                    <h3 className="text-sm font-semibold text-ink">Performance by client · {mode === "live" ? "Live" : "Sandbox"}</h3>
                </div>
                <div className="overflow-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>Client</th><th className={th}>Orders</th><th className={th}>Needs attention</th>
                                <th className={th}>Net customer sales</th><th className={th}>Master margin</th><th className={th}>Client margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.c} className="hover:bg-row-hover">
                                    <td className={`${td} pl-5 font-semibold text-ink`}>{r.c}</td>
                                    <td className={td}>{r.orders}</td>
                                    <td className={td}>{r.attention}</td>
                                    <td className={td}>{money(r.sales)}</td>
                                    <td className={td}>{money(r.platform)}</td>
                                    <td className={td}>{money(r.client)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}