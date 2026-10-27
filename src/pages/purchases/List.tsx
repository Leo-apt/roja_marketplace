// Marketplace > Purchases: one row per customer order, filters in the side drawer (sample data for now).
import { CreditCard, Eye, Receipt, TriangleAlert, Undo2 } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import type { Stat } from "@/components/catalog/StatCards";
import { useApp } from "@/hooks/useApp";
import { useEnv } from "@/env/EnvContext";
import { money } from "@/pages/history/format";
import { CLIENTS, ENVS, PROVIDERS, PURCHASE_DATA, needsAttention, type Purchase } from "./purchasesData";
import PurchaseDrawer, { Pill } from "./PurchaseDrawer";

const opts = (all: string, xs: string[]) => [{ value: "all", label: all }, ...xs.map((x) => ({ value: x, label: x }))];

const fields: FilterField[] = [
    {
        key: "view", label: "Show", options: [
            { value: "all", label: "All purchases" }, { value: "attention", label: "Needs attention" },
            { value: "recurring", label: "Recurring" }, { value: "refunds", label: "Refunds" },
        ]
    },
    { key: "client", label: "Client", options: opts("All clients", CLIENTS) },
    { key: "env", label: "Environment", options: opts("All environments", ENVS) },
    { key: "provider", label: "Provider", options: opts("All providers", PROVIDERS) },
    { key: "type", label: "Purchase type", options: opts("All types", ["Subscription", "One-time", "Trial"]) },
    { key: "payment", label: "Payment status", options: opts("All statuses", ["Captured", "Failed", "No charge"]) },
    { key: "fulfillment", label: "Enrollment / delivery", options: opts("All", ["Active", "Delivered", "Partially fulfilled", "Not started"]) },
    { key: "receipt", label: "Client receipt", options: opts("All", ["Paid", "Awaiting client payment", "N/A"]) },
    { key: "from", label: "Purchase date · from", type: "date", options: [] },
    { key: "to", label: "Purchase date · to", type: "date", options: [] },
];

const match = (r: Purchase, q: string, f: Record<string, string>) =>
    (!q || [r.id, r.customer, r.product, r.client, r.env, r.provider, r.reference, r.merchant].some((v) => v.toLowerCase().includes(q))) &&
    (f.view === "all" || (f.view === "attention" && needsAttention(r)) || (f.view === "recurring" && r.type !== "One-time") || (f.view === "refunds" && r.refund > 0)) &&
    (f.client === "all" || r.client === f.client) &&
    (f.env === "all" || r.env === f.env) &&
    (f.provider === "all" || r.provider === f.provider) &&
    (f.type === "all" || r.type === f.type) &&
    (f.payment === "all" || r.payment === f.payment) &&
    (f.fulfillment === "all" || r.fulfillment === f.fulfillment) &&
    (f.receipt === "all" || r.receipt === f.receipt) &&
    (f.from === "all" || r.date >= f.from) &&
    (f.to === "all" || r.date <= f.to);

const cards = (rs: Purchase[]): Stat[] => [
    { label: "Orders in view", value: rs.length, note: "One customer order per row", icon: Receipt },
    { label: "Captured payments", value: money(rs.filter((r) => r.payment === "Captured").reduce((n, r) => n + r.amount, 0)), note: "Client merchant account · USD", icon: CreditCard },
    { label: "Customer refunds", value: money(rs.reduce((n, r) => n + r.refund, 0)), note: "On the purchases in view", icon: Undo2 },
    { label: "Needs attention", value: rs.filter(needsAttention).length, note: "Payment, provider or receipt exceptions", icon: TriangleAlert },
];

const dollars = (c: number) => (c / 100).toFixed(2);

export default function PurchasesList() {
    const { openDrawer } = useApp();
    const { mode } = useEnv();
    const rows = PURCHASE_DATA[mode];
    const view = (r: Purchase) => openDrawer(<PurchaseDrawer row={r} mode={mode} />);

    const cols: Col<Purchase>[] = [
        {
            key: "id", label: "Order ID", sticky: 140, render: (r) => (
                <button type="button" onClick={() => view(r)} className="text-left font-semibold text-link hover:underline">{r.id}</button>
            )
        },
        { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
        { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
        { key: "date", label: "Purchase date", render: (r) => r.date },
        { key: "customer", label: "Customer", render: (r) => r.customer },
        { key: "product", label: "Product", render: (r) => r.product },
        { key: "provider", label: "Fulfillment provider", render: (r) => r.provider },
        { key: "type", label: "Type", render: (r) => r.type },
        { key: "amount", label: "Customer amount", align: "right", render: (r) => money(r.amount), exportValue: (r) => dollars(r.amount) },
        { key: "refund", label: "Refund", align: "right", render: (r) => (r.refund ? money(r.refund) : "-"), exportValue: (r) => dollars(r.refund) },
        { key: "fee", label: "Gateway fee", align: "right", render: (r) => money(r.fee), exportValue: (r) => dollars(r.fee) },
        { key: "payment", label: "Payment", render: (r) => <Pill text={r.payment} /> },
        { key: "fulfillment", label: "Enrollment / delivery", render: (r) => <Pill text={r.fulfillment} /> },
    ];

    return (
        <ListShell
            rows={rows}
            cols={cols}
            basePath="/marketplace/purchases"
            createLabel=""
            rowLabel="purchases"
            searchPlaceholder="Search order, customer, product, provider…"
            filterFields={fields}
            match={match}
            cards={cards}
            exportName={`purchases-${mode}`}
            hideView
            hideEdit
            hideCreate
            extraActions={[{
                label: "View order",
                icon: <Eye className="size-4" />,
                onClick: (id) => { const r = rows.find((x) => x.id === id); if (r) view(r); },
            }]}
        />
    );
}