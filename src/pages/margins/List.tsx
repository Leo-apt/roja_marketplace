import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { margins, type MarginRec } from "@/data/catalog";
import { calcMargin, statusFilterOptions, usd } from "@/utils/catalog";
import { avg } from "@/components/catalog/StatCards";

const m = (r: MarginRec) => calcMargin(r.wholesale, r.retail, r.markup, r.markupType);

const cols: Col<MarginRec>[] = [
    { key: "product", label: "Product", link: true, render: (r) => r.product },
    { key: "wholesale", label: "Wholesale Price ($)", align: "right", render: (r) => usd(r.wholesale) },
    { key: "retail", label: "Suggested Retail ($)", align: "right", render: (r) => usd(r.retail) },
    { key: "markupAmt", label: "Roja Markup Amount ($)", align: "right", render: (r) => usd(m(r).markupAmt) },
    { key: "markupPct", label: "Roja Markup (%)", align: "right", render: (r) => `${m(r).markupPct}%` },
    { key: "buy", label: "Roja Buy Value ($)", align: "right", render: (r) => usd(m(r).buy) },
    { key: "margin", label: "Margin vs. Retail ($)", align: "right", render: (r) => usd(m(r).margin) },
];
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusFilterOptions }];

export default function MarginsList() {
    return (
        <ListShell
            rows={margins}
            cols={cols}
            basePath="/catalog/margins"
            createLabel="Create Margin"
            rowLabel="margins"
            searchPlaceholder="Search products…"
            cards={(r) => [
                { label: "Total Margins", value: r.length },
                { label: "Avg Markup", value: `${avg(r.map((x) => m(x).markupPct)).toFixed(2)}%` },
                { label: "Total Margin", value: usd(r.reduce((a, x) => a + m(x).margin, 0)) },
                { label: "Highest Margin", value: usd(r.length ? Math.max(...r.map((x) => m(x).margin)) : 0) },
            ]}
            filterFields={fields}
            match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.product.toLowerCase().includes(q))}
        />
    );
}