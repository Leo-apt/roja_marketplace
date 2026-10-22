import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { productTemplatesService, type TemplateRec } from "@/services/productTemplates.service";

export const BASE = "/catalog/product-templates";

export const Swatch = ({ v }: { v: string }) =>
    v ? (
        <span className="inline-flex items-center gap-2">
            <span className="size-4 rounded border border-line" style={{ background: v }} />
            {v}
        </span>
    ) : <>N/A</>;

const cols: Col<TemplateRec>[] = [
    { key: "name", label: "Template Name", link: true, render: (r) => r.name },
    { key: "cardBg", label: "Card Background", render: (r) => <Swatch v={r.cardBg} /> },
    { key: "buttonBg", label: "Button Background", render: (r) => <Swatch v={r.buttonBg} /> },
    { key: "buttonText", label: "Button Text", render: (r) => <Swatch v={r.buttonText} /> },
    { key: "textPrimary", label: "Text Primary", render: (r) => <Swatch v={r.textPrimary} /> },
    { key: "textSecondary", label: "Text Secondary", render: (r) => <Swatch v={r.textSecondary} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [];

export default function ProductTemplatesList() {
    const [data, setData] = useState<{ rows: TemplateRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        setLoading(true);
        productTemplatesService.listPage(page, PAGE_SIZE, q)
            .then((r) => { if (live) setData(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [page, q]);

    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setPage(1); setQ(""); }} />;
    if (!data) return <LoadingBox />;

    return (
        <ListShell
            rows={data.rows}
            cols={cols}
            basePath={BASE}
            createLabel="Create Product Template"
            rowLabel="templates"
            searchPlaceholder="Search templates…"
            filterFields={fields}
            match={() => true}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s) => { setPage(p); setQ(s); } }}
        />
    );
}