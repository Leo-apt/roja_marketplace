import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { providers, type EngineConfig } from "@/data/engine";
import { engineConfigsService } from "@/services/engineConfigs.service";

const providerName = (v: string) => providers.find((p) => p.value === v)?.label ?? v;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const cols: Col<EngineConfig>[] = [
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "providerId", label: "Provider ID", render: (r) => providerName(r.providerId) },
    { key: "category", label: "Category", render: (r) => r.category || "-" },
    { key: "baseScore", label: "Base Score", align: "right", render: (r) => r.baseScore || "-" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const PAGE_SIZE = 10;

export default function EngineConfigList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [data, setData] = useState<{ rows: EngineConfig[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<EngineConfig | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        setLoading(true);
        engineConfigsService.listPage(page, PAGE_SIZE, q)
            .then((r) => {
                if (!live) return;
                // the last item of the last page was deleted: go to the new last page
                if (!r.rows.length && r.total > 0 && page > 1) { setPage(Math.ceil(r.total / PAGE_SIZE)); return; }
                setData(r);
            })
            .catch((e) => { if (live) setError(msg(e)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [isAdmin, page, q, tick]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setPage(1); setQ(""); setTick((t) => t + 1); }} />;
    if (!data) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await engineConfigsService.remove(del.id);
            setTick((t) => t + 1);
            toast("Config deleted");
            setDel(null);
        } catch (e) {
            toastError(msg(e));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <ListShell
                rows={data.rows}
                cols={cols}
                basePath="/catalog/engine-configuration"
                createLabel="Create Config"
                rowLabel="configs"
                searchPlaceholder="Search configs…"
                filterFields={[]}
                match={() => true}
                server={{
                    total: data.total, pageSize: PAGE_SIZE, loading,
                    onChange: (p, s) => { setPage(p); setQ(s); },
                }}
                onDelete={(id) => setDel(data.rows.find((x) => x.id === id) ?? null)}
            />
            <ConfirmDialog
                isOpen={!!del}
                type="delete"
                itemType="config"
                itemName={del?.name}
                loading={deleting}
                onClose={() => setDel(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}