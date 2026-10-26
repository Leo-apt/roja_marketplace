import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusToggle } from "@/components/catalog/FormBits";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import InstanceDrawer, { type InstanceDraft } from "@/components/catalog/InstanceDrawer";
import { useApp } from "@/hooks/useApp";
import type { Status } from "@/data/catalog";
import type { Instance } from "@/data/instances";
import { entityService } from "@/services/entity.service";
import { statusFilterOptions } from "@/utils/catalog";
import { KeyRound, Layers } from "lucide-react";

const BASE = "/instances";
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusFilterOptions }];

export default function InstancesList() {
    const isAdmin = useIsAdmin();
    const nav = useNavigate();
    const { toast, openDrawer } = useApp();
    const [rows, setRows] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try { setRows(await entityService.list()); }
        catch (e) { setError(e instanceof Error ? e.message : "Failed to load clients"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { if (isAdmin) void load(); }, [isAdmin, load]);

    if (!isAdmin) return <AdminNotice />;
    if (loading) return <LoadingBox />;
    if (error) return <ErrorBox message={error} onRetry={load} />;

    const setStatus = async (id: string, on: boolean) => {
        const s: Status = on ? "Active" : "Inactive";
        try {
            await entityService.update(id, { status: s });
            setRows((r) => r.map((x) => (x.id === id ? { ...x, status: s } : x)));
            toast(`Client ${on ? "activated" : "deactivated"}`);
        } catch (e) {
            toast(e instanceof Error ? e.message : "Update failed");
        }
    };

    const save = async (d: InstanceDraft, editing?: Instance) => {
        if (editing) {
            const rec = await entityService.update(editing.id, {
                name: d.name,
                description: d.description,
                file: d.file, // only set when a new image was picked
            });
            setRows((r) => r.map((x) => (x.id === editing.id ? { ...rec, products: x.products, environments: x.environments } : x)));
            toast("Client updated");
            return;
        }
        const rec = await entityService.create(d);
        setRows((r) => [rec, ...r]);
        toast("Client created");
    };

    const envNames = (r: Instance): string[] => r.environments ?? [];

    const cols: Col<Instance>[] = [
        {
            key: "name", label: "Client Name", link: true, render: (r) => (
                <span className="inline-flex items-center gap-3">
                    {r.imageUrl
                        ? <img src={r.imageUrl} alt={r.name} className="size-9 shrink-0 rounded-lg object-cover" />
                        : <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brandsoft text-sm font-bold text-brand">{r.name[0]}</span>}
                    <span>{r.name}</span>
                </span>
            ),
        },
        {
            key: "description", label: "Description", render: (r) => (
                <span className="block max-w-[280px] truncate" title={r.description || ""}>{r.description || "-"}</span>
            ),
        },
        {
            key: "environments", label: "Associated Environments", render: (r) => {
                const names = envNames(r);
                return names.length ? (
                    <div className="flex max-w-[320px] flex-wrap gap-1.5">
                        {names.map((n) => (
                            <span key={n} className="inline-flex items-center rounded-md border border-line bg-white px-2 py-1 text-xs text-ink">{n}</span>
                        ))}
                    </div>
                ) : "-";
            },
        },
        {
            key: "status", label: "Status", render: (r) => (
                <StatusToggle label={`Toggle ${r.name}`} on={r.status === "Active"} onChange={(v) => void setStatus(r.id, v)} />
            ),
        },
    ];

    return (
        <>
            <ListShell
                rows={rows}
                cols={cols}
                basePath={BASE}
                createLabel="Add Client"
                rowLabel="clients"
                searchPlaceholder="Search clients…"
                cards={(r) => [
                    { label: "Total Clients", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Total Products", value: r.reduce((n, x) => n + x.products.length, 0) },
                ]}
                filterFields={fields}
                match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.name.toLowerCase().includes(q))}
                onCreate={() => openDrawer(<InstanceDrawer onSubmit={(d) => save(d)} />)}
                onEdit={(id) => { const r = rows.find((x) => x.id === id); if (r) openDrawer(<InstanceDrawer initial={r} onSubmit={(d) => save(d, r)} />); }}
                extraActions={[
                    { label: "Environment", icon: <Layers className="size-4" />, onClick: (id) => nav(`${BASE}/${id}?tab=entity`) },
                    { label: "Token Generation", icon: <KeyRound className="size-4" />, onClick: (id) => nav(`${BASE}/${id}?tab=token`) },
                ]}
            />
        </>
    );
}