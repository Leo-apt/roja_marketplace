import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { signalsService, WEIGHT_TYPES, type SignalRec } from "@/services/signals.service";

export const BASE = "/catalog/engine-signals";

// long lists are cut with "..." and the full text shows on hover
// shows the first 2 keywords as chips, the rest as "+N"; the full list shows on hover
const MAX_CHIPS = 2;
const chips = (v: string[]) => {
    if (!v.length) return "N/A";
    const shown = v.slice(0, MAX_CHIPS);
    const extra = v.length - shown.length;
    return (
        <div title={v.join(", ")} className="flex max-w-[280px] flex-nowrap items-center gap-1.5">
            {shown.map((k) => (
                <span key={k} className="max-w-[110px] truncate border border-line px-2.5 py-0.5 text-xs text-ink">
                    {k}
                </span>
            ))}
            {extra > 0 && (
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-ink">
                    +{extra}
                </span>
            )}
        </div>
    );
};

const cols: Col<SignalRec>[] = [
    { key: "signalId", label: "Signal ID", link: true, render: (r) => r.signalId },
    { key: "label", label: "Label", render: (r) => r.label },
    { key: "keywords", label: "Keywords", render: (r) => chips(r.keywords) },
    { key: "weightType", label: "Weight Type", render: (r) => WEIGHT_TYPES.find((w) => w.value === r.weightType)?.label ?? r.weightType },
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