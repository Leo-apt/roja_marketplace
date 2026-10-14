import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { orders } from "@/data/orders";
import { products } from "@/data/products";
import { commonOrder, financeRows, totals } from "@/domain/finance";
import { within } from "@/domain/filters";
import { ledger } from "@/domain/ledger";
import { useApp } from "@/hooks/useApp";
import PageShell from "@/components/layout/PageShell";
import { Cards, Metric } from "@/components/shared/Metric";
import { ProductLink } from "@/components/shared/Links";
import TrendChart from "@/components/charts/TrendChart";
import { exportCsv, financeExportCols } from "@/utils/csv";
import { money, pct, sum } from "@/utils/money";

export default function OverviewPage() {
    const { filters: f, batches } = useApp();
    const navigate = useNavigate();
    const rs = useMemo(() => financeRows(f), [f]);
    const t = totals(rs);
    const led = useMemo(() => ledger(batches), [batches]);

    const os = orders.filter((o) => within(o.date, f) && commonOrder(o, f));
    const paid = os.filter((o) => o.captured > 0);
    const scoped = led.filter((r) => within(r.date, f) && (f.provider === "all" || r.provider === f.provider));
    const ready = scoped.filter((r) => r.state === "Ready");
    const held = scoped.filter((r) => /Held|Awaiting funds/.test(r.state));

    const views = os.length * 120;
    const clicks = os.length * 24;
    const checkouts = os.length + Math.ceil(os.length / 3);
    const counts: [string, number, string][] = [
        ["Product impressions", views, "Sample event counts"],
        ["Product clicks", clicks, "CTR " + pct(clicks, views)],
        ["Checkout sessions", checkouts, "Includes abandoned sessions"],
        ["Paid orders", paid.length, "Conversion " + pct(paid.length, checkouts)],
    ];

    const byProduct = products
        .map((p) => ({ p, sales: sum(rs.filter((r) => r.productId === p.id), "sales") }))
        .filter((x) => x.sales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    const max = Math.max(1, ...byProduct.map((x) => Math.abs(x.sales)));

    const attention: [string, number][] = [
        ["Activation / delivery failed", os.filter((o) => /Failed|Partially/.test(o.fulfillment)).length],
        ["Payment failures", os.filter((o) => o.payment === "Failed").length],
        ["Refunded, supplier cost unrecovered", os.filter((o) => o.refunded > 0 && sum(o.items, "cost") > sum(o.items, "credit")).length],
    ];

    return (
        <PageShell view="overview" onExport={() => exportCsv({ view: "overview", filters: f, rows: rs, cols: financeExportCols, raw: true })}>
            <Cards>
                <Metric label="Net collected product sales" value={money(t.sales)} detail="After product refunds and chargebacks" />
                <Metric label="Paid orders" value={String(paid.length)} detail="Captured purchases in selected origin period" />
                <Metric label="Gross margin" value={money(t.gross)} detail={pct(t.gross, t.sales) + " of net product sales"} cls={t.gross < 0 ? "negative" : ""} />
                <Metric label="Contribution after payment fees" value={money(t.contribution)} detail="Gross margin less processing / dispute fees" cls={t.contribution < 0 ? "negative" : ""} />
            </Cards>

            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">
                Operational transaction report, not accounting revenue recognition. Taxes and shipping are excluded from product sales and margin; shipping cost is not modeled. Supplier costs follow illustrative contract snapshots.
            </div>

            <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                    <h2 className="text-sm font-semibold">Marketplace conversion</h2>
                    <span className="text-xs text-muted">Illustrative events; no unique-user claim</span>
                </div>
                <div className="grid grid-cols-4 gap-3.5 p-5 max-[850px]:grid-cols-2">
                    {counts.map(([l, n, d]) => (
                        <div key={l} className="flex flex-col gap-0.5 rounded-[9px] bg-surfacealt px-4 py-3.5">
                            <small className="text-xs text-muted">{l}</small>
                            <strong className="text-2xl font-bold tabular-nums">{n.toLocaleString()}</strong>
                            <small className="text-xs text-muted">{d}</small>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-2 gap-4 max-[1180px]:grid-cols-1">
                <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                        <h2 className="text-sm font-semibold">Captured sales & gross margin</h2>
                        <span className="text-xs text-muted">Financial event dates</span>
                    </div>
                    <div className="p-5">
                        <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
                            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-brand" />Captured product sales</span>
                            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-good" />Gross margin after adjustments</span>
                        </div>
                        <TrendChart f={f} />
                    </div>
                </section>

                <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                        <h2 className="text-sm font-semibold">Product performance</h2>
                        <button className="border-0 bg-transparent p-0 text-left text-xs font-semibold text-brand" onClick={() => navigate("/margin")}>View margin report →</button>
                    </div>
                    <div className="flex flex-col gap-3.5 p-5">
                        {byProduct.length === 0 && <p className="text-muted">No sales in this range.</p>}
                        {byProduct.map(({ p, sales }) => (
                            <div key={p.id}>
                                <div className="flex items-center justify-between gap-3">
                                    <ProductLink id={p.id}>{p.name}</ProductLink>
                                    <strong className={`tabular-nums ${sales < 0 ? "text-bad" : ""}`}>{money(sales)}</strong>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-linesoft">
                                    <span className="block h-full rounded-full bg-brand" style={{ width: `${(100 * Math.abs(sales)) / max}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[1180px]:grid-cols-1">
                <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                        <h2 className="text-sm font-semibold">Operational attention</h2>
                        <button className="border-0 bg-transparent p-0 text-left text-xs font-semibold text-brand" onClick={() => navigate("/reconciliation")}>Review exceptions →</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 p-5 max-[850px]:grid-cols-1">
                        {attention.map(([l, n]) => (
                            <div key={l} className="flex flex-col gap-0.5 rounded-[9px] bg-surfacealt px-4 py-3.5">
                                <strong className="text-[25px] font-bold">{n}</strong>
                                <small className="text-xs text-muted">{l}</small>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]">
                        <h2 className="text-sm font-semibold">Supplier payable position</h2>
                        <button className="border-0 bg-transparent p-0 text-left text-xs font-semibold text-brand" onClick={() => navigate("/settlements")}>Open settlements →</button>
                    </div>
                    <div className="flex flex-col gap-3.5 p-5">
                        <div className="flex items-center justify-between gap-3"><span>Ready, including confirmed credits</span><strong>{money(sum(ready, "amount"))}</strong></div>
                        <div className="flex items-center justify-between gap-3"><span>Held / awaiting gateway funds</span><strong>{money(sum(held, "amount"))}</strong></div>
                        <small className="text-xs text-muted">Payables are liabilities, not ROJA margin. Approved batches are already reserved.</small>
                    </div>
                </section>
            </div>
        </PageShell>
    );
}