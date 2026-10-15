import { getProduct } from "@/data/products";
import { financeRows, totals } from "@/domain/finance";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import Tag from "@/components/shared/Tag";
import { Metric } from "@/components/shared/Metric";
import { DetailTable, Kv, MoneyRows } from "@/components/shared/Kv";
import { money, pct } from "@/utils/money";

export default function ProductDrawer({ id }: { id: string }) {
    const { filters } = useApp();
    const p = getProduct(id);
    const t = totals(financeRows(filters).filter((r) => r.productId === id));

    return (
        <Drawer title={p.name} kicker={`${p.id} · ${p.sku}`}>
            <div className="flex flex-wrap items-center gap-2.5">
                <Tag s={p.status} />
                <Tag s={p.type} c="blue" />
                {p.components.length > 0 && <Tag s="Bundle" c="purple" />}
            </div>
            <Kv
                items={[
                    ["Category", p.category],
                    ["Fulfillment / payee", p.provider],
                    ["Price / cost version", p.version],
                    ["Commercial owner", "ROJA backend"],
                    ["Trial eligibility", p.id === "PRD-002" ? "Illustrative 14-day trial" : "Configured per plan"],
                    ["Settlement basis", "Contract cost less confirmed supplier credits"],
                ]}
            />
            <div className="grid grid-cols-3 gap-3 max-[850px]:grid-cols-1">
                <Metric label="Current sell price" value={money(p.price)} detail={p.type === "Subscription" ? "Per month" : "Per unit"} />
                <Metric label="Current supplier cost" value={money(p.cost)} detail="Indicative contract price" />
                <Metric label="Indicative gross margin" value={money(p.price - p.cost)} detail={pct(p.price - p.cost, p.price) + " before fees"} />
            </div>
            {p.components.length > 0 && (
                <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]"><h3 className="text-sm font-semibold">Bundle components</h3></div>
                    <DetailTable head={["Component", "Allocated price", "Allocated cost"]} rows={p.components.map((c) => [c[0], money(c[1]), money(c[2])])} />
                </div>
            )}
            <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]"><h3 className="text-sm font-semibold">Actual results · selected financial period</h3></div>
                <div className="p-5">
                    <MoneyRows
                        rows={[
                            ["Net collected product sales", t.sales],
                            ["Net supplier cost", t.netCost],
                            ["Gross margin", t.gross],
                            ["Payment fees", t.fees],
                            ["Contribution", t.contribution],
                        ]}
                    />
                </div>
            </div>
            <div className="rounded-[9px] border border-note-info-border bg-note-info-bg px-4 py-3 text-xs text-note-info-text">
                Publishing a new price or supplier cost creates a new version. Existing purchases, bundle allocations, and subscribers keep their original snapshot unless an approved migration occurs.
            </div>
        </Drawer>
    );
}