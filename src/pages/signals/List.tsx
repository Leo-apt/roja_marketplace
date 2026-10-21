import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { signalsService, WEIGHT_FIELDS, WEIGHT_TYPES, type SignalRec } from "@/services/signals.service";

export const BASE = "/catalog/engine-signals";

// long lists are cut with "..." and the full text shows on hover
const joined = (v: string[]) => {
    const t = v.join(", ");
    return t ? <span title={t} className="block max-w-[180px] truncate">{t}</span> : "N/A";
};

const cols: Col<SignalRec>[] = [
    { key: "signalId", label: "Signal ID", link: true, render: (r) => r.signalId },
    { key: "label", label: "Label", render: (r) => r.label },
    { key: "minCount", label: "Minimum Count", render: (r) => r.minCount ?? "N/A" },
    { key: "topCategory", label: "Top Category", render: (r) => joined(r.topCategory) },
    { key: "code", label: "Code", render: (r) => joined(r.code) },
    { key: "mcc", label: "MCC", render: (r) => joined(r.mcc) },
    { key: "keywords", label: "Keywords", render: (r) => joined(r.keywords) },
    { key: "weightType", label: "Weight Type", render: (r) => WEIGHT_TYPES.find((w) => w.value === r.weightType)?.label ?? r.weightType },
    {
        key: "weight", label: "Weight",
        render: (r) => (WEIGHT_FIELDS[r.weightType] ?? []).map((w) => `${w.label}: ${r[w.key] ?? "N/A"}`).join(", ") || "N/A",
    },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = [];

export default function SignalsList() {
    const [data, setData] = useState<{ rows: SignalRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        setLoading(true);
        signalsService.listPage(page, PAGE_SIZE, q)
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
            createLabel="Create Product Engine Signal"
            rowLabel="signals"
            searchPlaceholder="Search signals…"
            filterFields={fields}
            match={() => true}
            server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s) => { setPage(p); setQ(s); } }}
        />
    );
}