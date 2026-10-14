import { useMemo, useState } from "react";
import { financeRows, groupFinance, totals, type Totals } from "@/domain/finance";
import { useApp } from "@/hooks/useApp";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { OrderLink, ProductLink } from "@/components/shared/Links";
import { exportCsv, financeExportCols } from "@/utils/csv";
import { money, pct } from "@/utils/money";
import Dropdownbox from "@/components/shared/Dropdownbox";

interface MRow extends Totals {
    id: string;
    label: string;
    productId: string;
    orderId?: string;
    product?: string;
    version?: string;
    orderCount?: number;
    units: number;
}

type Group = "product" | "provider" | "order";

export default function MarginPage() {
    const { filters: f } = useApp();
    const [group, setGroup] = useState<Group>("product");
    const rs = useMemo(() => financeRows(f), [f]);
    const t = totals(rs);

    const rows: MRow[] =
        group === "order" ? rs.map((r) => ({ ...r, label: r.orderId })) : groupFinance(rs, group).map((g) => ({ ...g }));

    const metricCols: Column<MRow>[] = (
        [
            ["capturedSales", "Captured sales"], ["refund", "Product refunds"], ["chargeback", "Chargebacks"],
            ["sales", "Net product sales"], ["netCost", "Net supplier cost"], ["gross", "Gross margin"],
            ["fees", "Payment fees"], ["contribution", "Contribution"],
        ] as const
    ).map(([key, label]) => ({
        key, label, align: "right" as const, value: (r: MRow) => r[key],
        render: (r: MRow) => (
            <>
                <span className={`${r[key] < 0 ? "text-bad" : ""} ${key === "contribution" ? "font-semibold text-ink" : ""}`}>{money(r[key])}</span>
                {key === "gross" && <div className="text-xs text-muted">{pct(r.gross, r.sales)}</div>}
            </>
        ),
    }));

    const cols: Column<MRow>[] = [
        {
            key: "label",
            label: group === "order" ? "Order / product" : group === "provider" ? "Supplier / payee" : "Product",
            sort: (r) => r.label,
            value: (r) => r.label,
            render: (r) =>
                group === "order" && r.orderId ? (
                    <div className="flex flex-col gap-[3px]"><OrderLink id={r.orderId} /><span>{r.product}</span><small className="text-xs text-muted">{r.version}</small></div>
                ) : (
                    <div className="flex flex-col gap-[3px]">
                        {group === "product" ? <ProductLink id={r.productId}>{r.label}</ProductLink> : <span className="font-semibold text-ink">{r.label}</span>}
                        <small className="text-xs text-muted">{r.orderCount} orders · {r.units} captured units</small>
                    </div>
                ),
        },
        ...metricCols,
    ];

    return (
        <PageShell view="margin" onExport={() => exportCsv({ view: "margin", filters: f, rows: rs, cols: financeExportCols, raw: true })}>
            <Cards>
                <Metric label="Net collected product sales" value={money(t.sales)} detail="Captured sales − product refunds − chargebacks" />
                <Metric label="Net supplier cost" value={money(t.netCost)} detail="Accrued cost − confirmed supplier credits" />
                <Metric label="Gross margin" value={money(t.gross)} detail={pct(t.gross, t.sales) + " margin, not markup"} cls={t.gross < 0 ? "negative" : ""} />
                <Metric label="Contribution after payment fees" value={money(t.contribution)} detail="Includes processing and dispute fees" cls={t.contribution < 0 ? "negative" : ""} />
            </Cards>

            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">
                Financial-event basis: an October refund or supplier credit on a September purchase appears in October. Catalog changes never recalculate historical margin. Margin % is unavailable when net sales are zero or negative.
            </div>

            <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                    <h2 className="text-sm font-semibold">Margin bridge</h2>
                    <span className="text-xs text-muted">Operational contribution; excludes overhead / delivery cost</span>
                </div>
                <div className="grid grid-cols-5 gap-3.5 p-5 max-[850px]:grid-cols-2">
                    {([["Net product sales", t.sales], ["Net supplier cost", t.netCost], ["Gross margin", t.gross], ["Payment fees", t.fees], ["Contribution", t.contribution]] as [string, number][]).map(([l, n]) => (
                        <div key={l}>
                            <small className="block text-xs text-muted">{l}</small>
                            <strong className={`block text-lg font-bold tabular-nums ${n < 0 ? "text-bad" : ""}`}>{money(n)}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <DataTable
                key={group}
                rows={rows}
                cols={cols}
                viewKey="margin"
                label="Margin reports"
                rowLabel="report rows"
                selectable={undefined}
                extra={
                    <div className="flex items-center gap-2 text-xs text-muted">
                        Group by
                        <Dropdownbox
                            name="group"
                            value={group}
                            options={[
                                { value: "product", label: "Product" },
                                { value: "provider", label: "Supplier / payee" },
                                { value: "order", label: "Order line" },
                            ]}
                            onChange={(e) => setGroup(e.target.value as Group)}
                            rounded="rounded-lg"
                            compact
                            className="w-[160px]"
                        />
                    </div>
                }
                note="Supplier credits are counted only after confirmation. Refunds do not automatically recover the supplier cost; tax and shipping refunds are excluded from this product-margin report."
            />
        </PageShell>
    );
}