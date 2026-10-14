import { reconRows, type ReconRow } from "@/domain/recon";
import { useApp } from "@/hooks/useApp";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { OrderLink } from "@/components/shared/Links";
import Tag from "@/components/shared/Tag";
import { colsToExport, exportCsv } from "@/utils/csv";
import { money, sum } from "@/utils/money";

export default function ReconciliationPage() {
    const { filters: f } = useApp();
    const rows = reconRows(f);

    const cols: Column<ReconRow>[] = [
        {
            key: "id", label: "Order / payment reference", value: (r) => r.id, render: (r) => (
                <div className="flex flex-col gap-[3px]">
                    <OrderLink id={r.id} />
                    <small className="text-xs text-muted font-mono">{r.o.captured ? "PG-DEMO-" + r.id.slice(-4) : "No captured payment"}</small>
                </div>
            )
        },
        { key: "customer", label: "Customer", value: (r) => r.customer, render: (r) => r.customer },
        { key: "expected", label: "Expected net gateway cash", align: "right", value: (r) => r.expected, render: (r) => money(r.expected) },
        { key: "gateway", label: "Gateway transaction net", align: "right", value: (r) => r.gateway, render: (r) => money(r.gateway) },
        {
            key: "variance", label: "Variance", align: "right", value: (r) => r.variance, render: (r) => (
                <span className={r.variance ? "text-bad" : ""}>{money(r.variance)}</span>
            )
        },
        { key: "status", label: "Reconciliation", value: (r) => r.status, render: (r) => <Tag s={r.status} /> },
        {
            key: "funds", label: "Deposit status", sort: (r) => r.o.funds, value: (r) => r.o.funds, render: (r) => (
                <Tag s={r.o.funds} c={r.o.funds === "Pending" ? "warn" : "good"} />
            )
        },
        {
            key: "exception", label: "Action / exception", sort: (r) => r.o.hold, value: (r) => r.o.hold, render: (r) => (
                <span className="text-xs text-muted">{r.o.hold || "Gateway transaction matched"}</span>
            )
        },
    ];

    return (
        <PageShell view="reconciliation" onExport={() => exportCsv({ view: "reconciliation", filters: f, rows, cols: colsToExport(cols) })}>
            <Cards>
                <Metric label="Gateway net cash expected" value={money(sum(rows, "expected"))} detail="Captured cash less fees, refunds, chargebacks" />
                <Metric label="Transaction variance" value={money(sum(rows, "variance"))} detail="Gateway records minus ROJA payment ledger" cls={sum(rows, "variance") ? "negative" : ""} />
                <Metric label="Awaiting gateway deposit" value={rows.filter((r) => r.status === "Awaiting deposit").length} detail="Do not release supplier payouts prematurely" />
                <Metric label="Action / mismatch" value={rows.filter((r) => /Action required|Mismatch/.test(r.status)).length} detail="Open the order for details and audit timeline" />
            </Cards>

            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">
                Transaction match, gateway deposit clearing, and supplier payout are three separate checks. The sample table is purchase-cohort reconciliation with lifetime adjustments through 7 Oct, not the event-date margin report.
            </div>

            <DataTable
                rows={rows}
                cols={cols}
                viewKey="reconciliation"
                label="Reconciliation & exceptions"
                note="Production reconciliation must also detect gateway-only payments, missing webhooks, orphan enrollments, duplicate references, invoice differences, and ambiguous payout outcomes."
            />
        </PageShell>
    );
}