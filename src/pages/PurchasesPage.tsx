import { useMemo } from "react";
import { orders } from "@/data/orders";
import { commonOrder } from "@/domain/finance";
import { within } from "@/domain/filters";
import { ledger } from "@/domain/ledger";
import { useApp } from "@/hooks/useApp";
import type { Order } from "@/types";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { OrderLink } from "@/components/shared/Links";
import Tag from "@/components/shared/Tag";
import OrderDrawer from "@/components/drawers/OrderDrawer";
import { colsToExport, exportCsv } from "@/utils/csv";
import { money, sum } from "@/utils/money";

export default function PurchasesPage() {
    const { filters: f, batches, openDrawer } = useApp();
    const led = useMemo(() => ledger(batches), [batches]);

    const rows = orders.filter(
        (o) =>
            within(o.date, f) &&
            commonOrder(o, f) &&
            (f.status === "all" || o.payment === f.status) &&
            (f.tab === "all" ||
                (f.tab === "captured" && o.captured > 0) ||
                (f.tab === "attention" && !!o.hold && o.settlement !== "Recovered") ||
                (f.tab === "refunds" && o.refunded > 0) ||
                (f.tab === "recurring" && !!o.subscriptionId)),
    );

    const cols: Column<Order>[] = [
        {
            key: "id", label: "Order / created", value: (o) => o.id, render: (o) => (
                <div className="flex flex-col gap-[3px]"><OrderLink id={o.id} /><small className="text-xs text-muted">{o.date} · {o.channel}</small></div>
            )
        },
        {
            key: "customer", label: "Customer / EWA stage", value: (o) => o.customer, render: (o) => (
                <div className="flex flex-col gap-[3px]">
                    <span className="font-semibold text-ink">{o.customer}</span>
                    <small className="text-xs text-muted">{o.customerId} · Current stage {o.currentStage}</small>
                    {o.stage !== o.currentStage && <small className="text-xs text-muted">At purchase: stage {o.stage}</small>}
                </div>
            )
        },
        {
            key: "items", label: "Purchased products", sort: (o) => o.items[0].name, value: (o) => o.items.map((l) => l.name).join("; "), render: (o) => (
                <div className="flex flex-col gap-[3px]">
                    <span>{o.items[0].name}</span>
                    <small className="text-xs text-muted">{o.items.length > 1 ? `+${o.items.length - 1} item · ` : ""}{o.type}{o.renewal ? " · Renewal" : ""}</small>
                </div>
            )
        },
        {
            key: "total", label: "Order / paid", align: "right", value: (o) => o.total, render: (o) => (
                <><div className="font-semibold text-ink">{money(o.total)}</div><small className="text-xs text-muted">Captured {money(o.captured)}</small></>
            )
        },
        {
            key: "payment", label: "Payment / refund", value: (o) => o.payment, render: (o) => (
                <div className="flex flex-col gap-[3px]">
                    <Tag s={o.payment} />
                    {o.refunded ? <Tag s={"Refund " + money(o.refunded)} c="warn" /> : o.chargeback ? <Tag s="Chargeback" c="bad" /> : <small className="text-xs text-muted">No refund</small>}
                </div>
            )
        },
        {
            key: "fulfillment", label: "Enrollment / delivery", value: (o) => o.fulfillment, render: (o) => (
                <><Tag s={o.fulfillment} /><div className="text-xs text-muted">{o.items.every((l) => l.provider === "ARS") ? "ARS" : "Supplier fulfillment"}</div></>
            )
        },
        {
            key: "settlement", label: "Supplier settlement", value: (o) => led.find((r) => r.orderId === o.id)?.state ?? o.settlement, render: (o) => (
                <><Tag s={led.find((r) => r.orderId === o.id)?.state ?? o.settlement} /><div className="text-xs text-muted">Funds: {o.funds}</div></>
            )
        },
        {
            key: "action", label: "Details", render: (o) => (
                <button
                    className="inline-flex min-h-[29px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => openDrawer(<OrderDrawer id={o.id} />)}
                >
                    View order
                </button>
            )
        },
    ];

    return (
        <PageShell view="purchases" onExport={() => exportCsv({ view: "purchases", filters: f, rows, cols: colsToExport(cols) })}>
            <Cards>
                <Metric label="Orders in view" value={rows.length} detail="One order may contain multiple items" />
                <Metric label="Captured payments" value={money(sum(rows, "captured"))} detail="Includes tax and shipping; before refunds" />
                <Metric label="Customer refunds" value={money(sum(rows, "refunded"))} detail="Lifetime cash refunds on selected orders" />
                <Metric label="Needs attention" value={rows.filter((o) => o.hold && o.settlement !== "Recovered").length} detail="Payment, fulfillment, dispute, or credit hold" />
            </Cards>
            <DataTable
                rows={rows}
                cols={cols}
                viewKey="purchases"
                label="Marketplace purchases"
                rowLabel="orders"
                tabs={[["all", "All orders"], ["captured", "Captured"], ["attention", "Needs attention"], ["refunds", "Refunded"], ["recurring", "Subscription orders"]]}
                note="Payment success does not mean enrollment, shipment, or settlement success. These statuses remain independent."
            />
        </PageShell>
    );
}