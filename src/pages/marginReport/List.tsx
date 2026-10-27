// Marketplace > Platform & client margins: sales, Master billing, provider cost and margins (sample data for now).
import { useRef, useState } from "react";
import { BadgePercent, DollarSign, Eye, TrendingUp, Wallet } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import type { Stat } from "@/components/catalog/StatCards";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { useApp } from "@/hooks/useApp";
import { useEnv } from "@/env/EnvContext";
import { money } from "@/pages/history/format";
import { CLIENTS, ENVS, PROVIDERS } from "@/pages/purchases/purchasesData";
import { ADD, finish, MARGIN_DATA, MARGIN_PRODUCTS, type MarginRow } from "./marginData";

type GroupBy = "client" | "env" | "provider" | "product" | "order";
const GROUPS: { value: GroupBy; label: string }[] = [
    { value: "client", label: "Client" }, { value: "env", label: "Client · Environment" },
    { value: "provider", label: "Provider" }, { value: "product", label: "Product" }, { value: "order", label: "Order" },
];
const KEY: Record<GroupBy, (r: MarginRow) => string> = {
    client: (r) => r.client, env: (r) => `${r.client} · ${r.env}`, provider: (r) => r.provider, product: (r) => r.product, order: (r) => r.orderId,
};

const opts = (all: string, xs: string[]) => [{ value: "all", label: all }, ...xs.map((x) => ({ value: x, label: x }))];
const fields: FilterField[] = [
    { key: "client", label: "Client", options: opts("All clients", CLIENTS) },
    { key: "env", label: "Environment", options: opts("All environments", ENVS) },
    { key: "provider", label: "Provider", options: opts("All providers", PROVIDERS) },
    { key: "product", label: "Product", options: opts("All products", MARGIN_PRODUCTS) },
    { key: "status", label: "Contribution", options: [{ value: "all", label: "All" }, { value: "negative", label: "Negative contribution" }] },
    { key: "from", label: "Event date · from", type: "date", options: [] },
    { key: "to", label: "Event date · to", type: "date", options: [] },
];

const match = (r: MarginRow, q: string, f: Record<string, string>) =>
    (!q || [r.orderId, r.client, r.env, r.provider, r.product].some((v) => v.toLowerCase().includes(q))) &&
    (f.client === "all" || r.client === f.client) &&
    (f.env === "all" || r.env === f.env) &&
    (f.provider === "all" || r.provider === f.provider) &&
    (f.product === "all" || r.product === f.product) &&
    (f.status === "all" || r.contribution < 0) &&
    (f.from === "all" || r.date >= f.from) &&
    (f.to === "all" || r.date <= f.to);

function group(rows: MarginRow[], by: GroupBy): MarginRow[] {
    const map = new Map<string, MarginRow>();
    for (const r of rows) {
        const k = KEY[by](r);
        const g = map.get(k);
        if (!g) map.set(k, { ...r, id: k, label: k, count: 1 });
        else { for (const key of ADD) g[key] += r[key]; g.count++; }
    }
    return [...map.values()].map(finish); // margins are recalculated from the summed amounts
}

const sum = (rs: MarginRow[], k: keyof MarginRow) => rs.reduce((n, r) => n + (r[k] as number), 0);
const cards = (rs: MarginRow[]): Stat[] => [
    { label: "Net customer sales (R)", value: money(sum(rs, "sales")), note: "After refunds", icon: DollarSign },
    { label: "Master platform margin", value: money(sum(rs, "platform")), note: "Net client price (W) − net provider cost (C)", icon: TrendingUp },
    { label: "Client gross margin", value: money(sum(rs, "clientMargin")), note: "Customer net sales − net Master billing", icon: BadgePercent },
    { label: "Combined contribution", value: money(sum(rs, "contribution")), note: "Master + client margin − gateway fees", icon: Wallet },
];

type NumKey = "sales" | "masterBilling" | "cost" | "platform" | "clientMargin" | "fees" | "contribution";
const dollars = (c: number) => (c / 100).toFixed(2);
const num = (key: NumKey, label: string): Col<MarginRow> => ({
    key, label, align: "right",
    render: (r) => <span className={r[key] < 0 ? "text-bad" : ""}>{money(r[key])}</span>,
    sortValue: (r) => r[key],
    exportValue: (r) => dollars(r[key]),
});

function MarginDrawer({ row, by, mode }: { row: MarginRow; by: GroupBy; mode: string }) {
    const lines: [string, number, boolean?][] = [
        ["Customer sales (R)", row.R], ["Customer refunds", -row.refund], ["Net customer sales", row.sales, true],
        ["Master billing (W)", row.W], ["Client credits", -row.clientCredit], ["Net Master billing", row.masterBilling, true],
        ["Provider cost (C)", row.C], ["Supplier credits", -row.supplierCredit], ["Net provider cost", row.cost, true],
        ["Master platform margin", row.platform], ["Client gross margin", row.clientMargin], ["Gateway fees", -row.fees],
        ["Combined contribution", row.contribution, true],
    ];
    return (
        <Drawer title={row.label} kicker={`${GROUPS.find((g) => g.value === by)?.label} · ${mode === "live" ? "Live" : "Sandbox"} · ${row.count} rows`}>
            <div className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-col gap-2.5 text-xs">
                    {lines.map(([k, v, strong]) => (
                        <div key={k} className={`flex justify-between ${strong ? "border-t border-line pt-2.5 font-bold" : ""}`}>
                            <span className="text-muted">{k}</span>
                            <span className={v < 0 ? "text-bad" : "text-ink"}>{money(v)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-lg border border-note-info-border bg-note-info-bg px-4 py-3 text-xs text-note-info-text">
                Master margin + client margin = combined product margin. A customer refund does not create a client or supplier credit by itself.
            </div>
        </Drawer>
    );
}

export default function MarginList() {
    const { openDrawer } = useApp();
    const { mode } = useEnv();
    const [by, setBy] = useState<GroupBy>("client");
    const grouped = useRef<MarginRow[]>([]);

    const cols: Col<MarginRow>[] = [
        { key: "label", label: GROUPS.find((g) => g.value === by)!.label, sticky: 200, render: (r) => <span className="font-semibold text-ink">{r.label}</span> },
        { key: "count", label: "Financial rows", align: "right", render: (r) => r.count },
        num("sales", "Net customer sales"), num("masterBilling", "Net Master billing"), num("cost", "Net provider cost"),
        num("platform", "Master margin"), num("clientMargin", "Client margin"), num("fees", "Gateway fees"), num("contribution", "Contribution"),
    ];

    return (
        <ListShell
            rows={MARGIN_DATA[mode]}
            cols={cols}
            basePath="/marketplace/margins"
            createLabel=""
            rowLabel="rows"
            searchPlaceholder="Search client, provider, product, order…"
            filterFields={fields}
            match={match}
            transform={(rs) => (grouped.current = group(rs, by))}
            cards={cards}
            exportName={`margins-${by}-${mode}`}
            hideView
            hideEdit
            hideCreate
            notice={
                <div className="rounded-lg border border-note-info-border bg-note-info-bg px-4 py-3 text-xs text-note-info-text">
                    R = customer price · W = Master price billed to the client · C = provider cost. Master margin = W − C · Client margin = R − W · Gateway fees are borne by the client.
                </div>
            }
            toolbar={
                <div className="w-56">
                    <Dropdownbox name="groupBy" label="Group by" value={by} options={GROUPS} rounded="rounded-lg" compact
                        onChange={(e) => setBy(e.target.value as GroupBy)} />
                </div>
            }
            extraActions={[{
                label: "View breakdown",
                icon: <Eye className="size-4" />,
                onClick: (id) => { const r = grouped.current.find((x) => x.id === id); if (r) openDrawer(<MarginDrawer row={r} by={by} mode={mode} />); },
            }]}
        />
    );
}