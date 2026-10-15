import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { offerTypes, providers, type EngineConfig } from "@/data/engine";
import { engineConfigsService } from "@/services/engineConfigs.service";
import { statusFilterOptions } from "@/utils/catalog";

const providerName = (v: string) => providers.find((p) => p.value === v)?.label ?? v;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const cols: Col<EngineConfig>[] = [
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "providerId", label: "Provider ID", render: (r) => providerName(r.providerId) },
    { key: "offerType", label: "Offer Type", render: (r) => r.offerType },
    { key: "createdOn", label: "Created On", render: (r) => r.createdOn, sortValue: (r) => Date.parse(r.createdOn) || 0 },
    { key: "updatedOn", label: "Last Updated On", render: (r) => r.updatedOn, sortValue: (r) => Date.parse(r.updatedOn) || 0 },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FilterField[] = [
    { key: "offerType", label: "Offer Type", options: [{ value: "all", label: "Select offer type" }, ...offerTypes] },
    { key: "status", label: "Status", options: statusFilterOptions },
];

export default function EngineConfigList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<EngineConfig[] | null>(null);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<EngineConfig | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        engineConfigsService.list()
            .then((r) => { if (live) setRows(r); })
            .catch((e) => { if (live) setError(msg(e)); });
        return () => { live = false; };
    }, [isAdmin, tick]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setRows(null); setTick((t) => t + 1); }} />;
    if (!rows) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await engineConfigsService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
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
                rows={rows}
                cols={cols}
                basePath="/catalog/engine-configuration"
                createLabel="Create Config"
                rowLabel="configs"
                searchPlaceholder="Search configs…"
                cards={(r) => [
                    { label: "Total Configs", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Inactive", value: r.filter((x) => x.status === "Inactive").length },
                ]}
                filterFields={fields}
                match={(r, q, f) =>
                    (f.offerType === "all" || r.offerType === f.offerType)
                    && (f.status === "all" || r.status === f.status)
                    && (!q || r.name.toLowerCase().includes(q))}
                onDelete={(id) => setDel(rows.find((x) => x.id === id) ?? null)}
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