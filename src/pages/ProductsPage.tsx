import { useMemo } from "react";
import { products } from "@/data/products";
import { financeRows } from "@/domain/finance";
import { searchMatch } from "@/domain/filters";
import { useApp } from "@/hooks/useApp";
import type { Product } from "@/types";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { ProductLink } from "@/components/shared/Links";
import Tag from "@/components/shared/Tag";
import { colsToExport, exportCsv } from "@/utils/csv";
import { money, pct, sum } from "@/utils/money";

export default function ProductsPage() {
    const { filters: f } = useApp();
    const rs = useMemo(() => financeRows(f), [f]);

    const rows = products.filter(
        (p) =>
            searchMatch(p, f) &&
            (f.provider === "all" || p.provider === f.provider) &&
            (f.status === "all" || p.status === f.status) &&
            (f.type === "all" || p.type === f.type) &&
            (f.tab === "all" ||
                (f.tab === "bundles" && p.components.length > 0) ||
                (f.tab === "active" && p.status === "Active") ||
                (f.tab === "drafts" && p.status === "Draft")),
    );

    const netSales = (p: Product) => sum(rs.filter((r) => r.productId === p.id), "sales");

    const cols: Column<Product>[] = [
        {
            key: "name", label: "Product / SKU", value: (p) => p.name, render: (p) => (
                <div className="flex flex-col gap-[3px]">
                    <ProductLink id={p.id}>{p.name}</ProductLink>
                    <small className="text-xs text-muted font-mono">{p.sku} · {p.id}</small>
                </div>
            )
        },
        {
            key: "category", label: "Category / provider", value: (p) => p.category, render: (p) => (
                <div className="flex flex-col gap-[3px]"><span>{p.category}</span><small className="text-xs text-muted">{p.provider}</small></div>
            )
        },
        {
            key: "type", label: "Purchase model", value: (p) => p.type, render: (p) => (
                <>
                    <Tag s={p.components.length ? "Bundle" : "Product"} c="blue" />
                    <div className="text-xs text-muted">{p.type}{p.type === "Subscription" ? " · Monthly" : ""}</div>
                </>
            )
        },
        { key: "price", label: "Sell price", align: "right", value: (p) => p.price, render: (p) => money(p.price) },
        { key: "cost", label: "Supplier cost", align: "right", value: (p) => p.cost, render: (p) => money(p.cost) },
        {
            key: "margin", label: "Indicative gross margin", align: "right", sort: (p) => p.price - p.cost, value: (p) => p.price - p.cost, render: (p) => (
                <>
                    <div className="font-semibold text-ink">{money(p.price - p.cost)}</div>
                    <small className="text-xs text-muted">{pct(p.price - p.cost, p.price)} · before fees</small>
                </>
            )
        },
        { key: "sales", label: "Net sales in period", align: "right", sort: netSales, value: netSales, render: (p) => money(netSales(p)) },
        {
            key: "status", label: "Status / version", value: (p) => p.status, render: (p) => (
                <><Tag s={p.status} /><div className="text-xs text-muted">{p.version}</div></>
            )
        },
    ];

    return (
        <PageShell view="products" onExport={() => exportCsv({ view: "products", filters: f, rows, cols: colsToExport(cols) })}>
            <Cards>
                <Metric label="Catalog records" value={rows.length} detail="Includes products and parent bundle SKUs" />
                <Metric label="Active in view" value={rows.filter((p) => p.status === "Active").length} detail="Published, customer-facing catalog" />
                <Metric label="Bundles in view" value={rows.filter((p) => p.components.length).length} detail="Component costs snapshotted per purchase" />
                <Metric label="Recurring plans in view" value={rows.filter((p) => p.type === "Subscription").length} detail="Marketplace billing, separate from EWA" />
            </Cards>

            <DataTable
                rows={rows}
                cols={cols}
                viewKey="products"
                label="Products & bundles"
                tabs={[["all", "All products"], ["active", "Active"], ["bundles", "Bundles"], ["drafts", "Drafts"]]}
                note="Catalog margins are estimates. Discounts, refunds, dispute fees, and historical cost versions appear in the margin report."
            />

            <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">
                Insurance and prescription product enablement requires confirmed providers, eligibility, compliance, and fulfillment scope. The sample catalog does not imply these integrations exist.
            </div>
        </PageShell>
    );
}