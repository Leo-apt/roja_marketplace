import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { providersService, type ProviderRec } from "@/services/providers.service";

const cols: Col<ProviderRec>[] = [
    { key: "providerId", label: "Provider ID", link: true, render: (r) => r.providerId },
    { key: "email", label: "Email", render: (r) => r.email },
    { key: "phone", label: "Cell Phone Number", render: (r) => r.phone },
    { key: "createdBy", label: "Created By", render: (r) => r.createdBy },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdOn", label: "Created On", render: (r) => r.createdOn },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [];

export default function ProvidersList() {
    const [data, setData] = useState<{ rows: ProviderRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        setLoading(true);
        providersService.listPage(page, PAGE_SIZE, q)
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
            basePath="/catalog/providers"
            createLabel="Add Provider"
            rowLabel="providers"
            searchPlaceholder="Search providers…"
            filterFields={fields}
            match={() => true}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s) => { setPage(p); setQ(s); } }}
        />
    );
}