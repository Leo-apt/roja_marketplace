import { getOrder } from "@/data/orders";
import { subscriptions } from "@/data/subscriptions";
import { within, searchMatch } from "@/domain/filters";
import { useApp } from "@/hooks/useApp";
import type { Subscription } from "@/types";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { SubLink } from "@/components/shared/Links";
import Tag from "@/components/shared/Tag";
import SubscriptionDrawer from "@/components/drawers/SubscriptionDrawer";
import { colsToExport, exportCsv } from "@/utils/csv";
import { money } from "@/utils/money";

export default function SubscriptionsPage() {
    const { filters: f, openDrawer } = useApp();

    const rows = subscriptions.filter((s) => {
        const o = getOrder(s.order);
        return (
            within(s.start, f) &&
            searchMatch(s, f) &&
            (f.provider === "all" || s.provider === f.provider) &&
            (f.type === "all" || o?.type === f.type) &&
            (f.channel === "all" || o?.channel === f.channel) &&
            (f.status === "all" || s.status === f.status) &&
            (f.stage === "all" || s.stage === f.stage) &&
            (f.tab === "all" ||
                (f.tab === "active" && s.status === "Active") ||
                (f.tab === "trial" && s.status === "Trialing") ||
                (f.tab === "attention" && /Past due|Suspended|Cancel scheduled/.test(s.status)))
        );
    });

    const cols: Column<Subscription>[] = [
        {
            key: "id", label: "Subscription / customer", value: (s) => s.id, render: (s) => (
                <div className="flex flex-col gap-[3px]"><SubLink id={s.id} mono>{s.id}</SubLink><span>{s.customer}</span></div>
            )
        },
        {
            key: "product", label: "Product / billing", value: (s) => s.product, render: (s) => (
                <div className="flex flex-col gap-[3px]"><span className="font-semibold text-ink">{s.product}</span><small className="text-xs text-muted">{money(s.amount)} / month · {s.provider}</small></div>
            )
        },
        {
            key: "status", label: "Subscription / enrollment", value: (s) => s.status, render: (s) => (
                <><Tag s={s.status} /><div className="text-xs text-muted">{getOrder(s.order)?.fulfillment}</div></>
            )
        },
        {
            key: "next", label: "Next billing / term end", value: (s) => s.next, render: (s) => (
                <div className="flex flex-col gap-[3px]">
                    <span>{/Cancelled|Suspended|Cancel scheduled/.test(s.status) ? "—" : s.next}</span>
                    <small className="text-xs text-muted">{s.status === "Trialing" ? "Trial ends" : "Term ends"} {s.termEnd}</small>
                </div>
            )
        },
        {
            key: "attempts", label: "Payment retry", value: (s) => s.attempts, render: (s) =>
                s.attempts ? <span className="text-bad">{s.attempts} attempts · Grace period</span> : <span className="text-muted">No failed attempts</span>
        },
        { key: "stage", label: "Current EWA stage", value: (s) => s.stage, render: (s) => <Tag s={"Stage " + s.stage} c={s.stage === "4" ? "purple" : "blue"} /> },
        {
            key: "action", label: "Details", render: (s) => (
                <button
                    className="inline-flex min-h-[29px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => openDrawer(<SubscriptionDrawer id={s.id} />)}
                >
                    View subscription
                </button>
            )
        },
    ];

    return (
        <PageShell view="subscriptions" onExport={() => exportCsv({ view: "subscriptions", filters: f, rows, cols: colsToExport(cols) })}>
            <Cards>
                <Metric label="Marketplace subscriptions" value={rows.length} detail="Not the $10 EWA membership" />
                <Metric label="Active" value={rows.filter((s) => s.status === "Active").length} detail="Current service entitlement shown separately" />
                <Metric label="Trialing" value={rows.filter((s) => s.status === "Trialing").length} detail="No captured sale until first paid charge" />
                <Metric label="Past due / suspended" value={rows.filter((s) => /Past due|Suspended/.test(s.status)).length} detail="Review retry and entitlement policy" />
            </Cards>
            <DataTable
                rows={rows}
                cols={cols}
                viewKey="subscriptions"
                label="Marketplace subscriptions"
                tabs={[["all", "All subscriptions"], ["active", "Active"], ["trial", "Trialing"], ["attention", "Needs attention"]]}
                note="Product access is not automatically terminated by an EWA stage change. Any product-specific eligibility or cancellation rule must be explicitly approved."
            />
        </PageShell>
    );
}