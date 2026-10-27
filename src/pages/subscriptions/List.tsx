// Marketplace > Subscriptions: recurring agreements, trials and renewals (sample data for now).
import { BadgeCheck, Clock, Eye, Repeat, TriangleAlert } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import type { Stat } from "@/components/catalog/StatCards";
import { useApp } from "@/hooks/useApp";
import { useEnv } from "@/env/EnvContext";
import { money } from "@/pages/history/format";
import { CLIENTS, ENVS, PROVIDERS, PURCHASE_DATA, type Purchase } from "@/pages/purchases/purchasesData";
import PurchaseDrawer, { Pill } from "@/pages/purchases/PurchaseDrawer";

const subState = (r: Purchase) => (r.type === "Trial" ? "Trialing" : r.refund ? "Cancelled" : r.payment === "Failed" ? "Past due" : "Active");
const opts = (all: string, xs: string[]) => [{ value: "all", label: all }, ...xs.map((x) => ({ value: x, label: x }))];

const fields: FilterField[] = [
    { key: "client", label: "Client", options: opts("All clients", CLIENTS) },
    { key: "env", label: "Environment", options: opts("All environments", ENVS) },
    { key: "provider", label: "Provider", options: opts("All providers", PROVIDERS) },
    { key: "status", label: "Agreement status", options: opts("All statuses", ["Active", "Trialing", "Past due", "Cancelled"]) },
    { key: "from", label: "Purchase date · from", type: "date", options: [] },
    { key: "to", label: "Purchase date · to", type: "date", options: [] },
];

const match = (r: Purchase, q: string, f: Record<string, string>) =>
    (!q || [r.subscriptionId, r.id, r.customer, r.product, r.client, r.env, r.provider].some((v) => v.toLowerCase().includes(q))) &&
    (f.client === "all" || r.client === f.client) &&
    (f.env === "all" || r.env === f.env) &&
    (f.provider === "all" || r.provider === f.provider) &&
    (f.status === "all" || subState(r) === f.status) &&
    (f.from === "all" || r.date >= f.from) &&
    (f.to === "all" || r.date <= f.to);

const cards = (rs: Purchase[]): Stat[] => [
    { label: "Marketplace agreements", value: rs.length, note: "Separate from EWA membership", icon: Repeat },
    { label: "Active", value: rs.filter((r) => subState(r) === "Active").length, note: "Provider entitlement tracked separately", icon: BadgeCheck },
    { label: "Trialing", value: rs.filter((r) => r.type === "Trial").length, note: "A free trial is not counted as a sale", icon: Clock },
    { label: "Past due", value: rs.filter((r) => subState(r) === "Past due").length, note: "Apply the retry and grace policy", icon: TriangleAlert },
];

export default function SubscriptionsList() {
    const { openDrawer } = useApp();
    const { mode } = useEnv();
    const rows = PURCHASE_DATA[mode].filter((p) => p.subscriptionId);
    const view = (r: Purchase) => openDrawer(<PurchaseDrawer row={r} mode={mode} initial="subscription" />);
    const price = (r: Purchase) => (r.type === "Trial" ? "Free trial" : `${money(r.amount)} / month`);

    const cols: Col<Purchase>[] = [
        {
            key: "subscriptionId", label: "Subscription ID", sticky: 150, render: (r) => (
                <button type="button" onClick={() => view(r)} className="text-left font-semibold text-link hover:underline">{r.subscriptionId}</button>
            )
        },
        { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
        { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
        { key: "id", label: "Order ID", render: (r) => r.id },
        { key: "product", label: "Product", render: (r) => r.product },
        { key: "customer", label: "Customer", render: (r) => r.customer },
        { key: "provider", label: "Provider", render: (r) => r.provider },
        { key: "price", label: "Billing price", align: "right", render: price, sortValue: (r) => r.amount, exportValue: price },
        { key: "state", label: "Agreement status", render: (r) => <Pill text={subState(r)} />, sortValue: subState, exportValue: subState },
        { key: "fulfillment", label: "Enrollment", render: (r) => <Pill text={r.fulfillment} /> },
        { key: "nextCharge", label: "Next charge / trial end", render: (r) => r.nextCharge || "-" },
        { key: "date", label: "Purchase date", render: (r) => r.date },
    ];

    return (
        <ListShell
            rows={rows}
            cols={cols}
            basePath="/marketplace/subscriptions"
            createLabel=""
            rowLabel="subscriptions"
            searchPlaceholder="Search subscription, order, customer, product…"
            filterFields={fields}
            match={match}
            cards={cards}
            exportName={`subscriptions-${mode}`}
            hideView
            hideEdit
            hideCreate
            extraActions={[{ label: "View agreement", icon: <Eye className="size-4" />, onClick: (id) => { const r = rows.find((x) => x.id === id); if (r) view(r); } }]}
        />
    );
}