import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { docsService, METHODS, type DocRec } from "@/services/docs.service";
import MethodBadge from "./MethodBadge";

const cols: Col<DocRec>[] = [
    { key: "name", label: "API Name", render: (r) => r.name },
    { key: "method", label: "Method", render: (r) => <MethodBadge m={r.method} /> },
    { key: "provider", label: "Provider", render: (r) => r.providerName || "General" },
    { key: "url", label: "URL", render: (r) => r.url },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [
    { key: "method", label: "Method", options: [{ value: "all", label: "All methods" }, ...METHODS.map((m) => ({ value: m, label: m }))] },
    { key: "status", label: "Status", options: [{ value: "all", label: "All statuses" }, { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }] },
];

export default function DocsList() {
    const [data, setData] = useState<{ rows: DocRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [method, setMethod] = useState("all");
    const [status, setStatus] = useState("all");
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        setLoading(true);
        docsService.listPage(page, PAGE_SIZE, q, method, status)
            .then((r) => { if (live) setData(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [page, q, method, status]);

    const setRowActive = (id: string, v: boolean) =>
        setData((d) => d && { ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, isActive: v, status: v ? "Active" : "Inactive" } : r)) });

    const toggleStatus = (id: string, next: boolean) => {
        setRowActive(id, next);
        docsService.setStatus(id, next).catch((e) => {
            setRowActive(id, !next);
            console.error("Status update failed", e);
        });
    };

    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setPage(1); setQ(""); }} />;
    if (!data) return <LoadingBox />;

    return (
        <ListShell
            rows={data.rows}
            cols={cols}
            basePath="/tools/documents-manage"
            createLabel="Add Documentation"
            rowLabel="docs"
            hideView
            searchPlaceholder="Search API, URL, provider…"
            filterFields={fields}
            match={() => true}
            statusToggle={{ isActive: (r) => r.isActive, onToggle: toggleStatus }}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s, fv) => { setPage(p); setQ(s); setMethod(fv.method ?? "all"); setStatus(fv.status ?? "all"); } }}
        />
    );
}