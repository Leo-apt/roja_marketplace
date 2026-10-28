import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { customersService, type CustomerRec } from "@/services/customers.service";

const cols: Col<CustomerRec>[] = [
    { key: "stripeId", label: "Stripe ID", render: (r) => r.stripeId },
    { key: "name", label: "Name", render: (r) => r.name || "-" },
    { key: "email", label: "Email", render: (r) => r.email || "-" },
    { key: "phone", label: "Phone", render: (r) => r.phone || "-" },
    {
        key: "live", label: "Mode", render: (r) => (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.live ? "bg-goodbg text-good" : "bg-warnbg text-warn"}`}>
                {r.live ? "Live" : "Sandbox"}
            </span>
        ),
    },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [
    { key: "mode", label: "Mode", options: [{ value: "all", label: "All modes" }, { value: "live", label: "Live" }, { value: "sandbox", label: "Sandbox" }] },
];

export default function CustomersList() {
    const [data, setData] = useState<{ rows: CustomerRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [mode, setMode] = useState("all");
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        setLoading(true);
        customersService.listPage(page, PAGE_SIZE, q, mode)
            .then((r) => { if (live) setData(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [page, q, mode]);

    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setPage(1); setQ(""); setMode("all"); }} />;
    if (!data) return <LoadingBox />;

    return (
        <ListShell
            readOnly
            rows={data.rows}
            cols={cols}
            basePath="/customers"
            createLabel=""
            rowLabel="customers"
            searchPlaceholder="Search name, email, Stripe ID…"
            filterFields={fields}
            match={() => true}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s, f) => { setPage(p); setQ(s); setMode(f.mode ?? "all"); } }}
        />
    );
}