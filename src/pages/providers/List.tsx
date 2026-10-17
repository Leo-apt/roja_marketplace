import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { providersService, type ProviderRec } from "@/services/providers.service";

// +12124567890 -> +1 (212) 456-7890 (US/Canada); other numbers are left as they are
export const fmtPhone = (v?: string) => {
    const d = (v ?? "").replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("1")) return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return v ?? "";
};

const cols: Col<ProviderRec>[] = [
    { key: "providerId", label: "Provider ID", link: true, render: (r) => r.providerId || "N/A" },
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "email", label: "Email", render: (r) => r.email },
    { key: "phone", label: "Cell Phone Number", render: (r) => fmtPhone(r.phone) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [];

export default function ProvidersList() {
    const nav = useNavigate();
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
            extraActions={[
                { label: "Credentials", icon: <KeyRound className="size-4" />, onClick: (id) => nav(`/catalog/providers/${id}?tab=creds`) },
            ]}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s) => { setPage(p); setQ(s); } }}
        />
    );
}