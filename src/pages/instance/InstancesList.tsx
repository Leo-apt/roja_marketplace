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
        catch (e) { setError(e instanceof Error ? e.message : "Failed to load entities"); }
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
            toast(`Entity ${on ? "activated" : "deactivated"}`);
        } catch (e) {
            toast(e instanceof Error ? e.message : "Update failed");
        }
    };

    const save = async (d: InstanceDraft, editing?: Instance) => {
        if (editing) {
            const rec = await entityService.update(editing.id, {
                name: d.name,
                description: d.description,
                // only send the image if it changed, so a name-only edit does not resend the large base64
                imageUrl: d.imageUrl !== editing.imageUrl ? d.imageUrl : undefined,
            });
            setRows((r) => r.map((x) => (x.id === editing.id ? { ...rec, products: x.products } : x)));
            toast("Entity updated");
            return;
        }
        const rec = await entityService.create(d);
        setRows((r) => [rec, ...r]);
        toast("Entity created");
    };

    const cols: Col<Instance>[] = [
        { key: "name", label: "Entity Name", link: true, render: (r) => r.name },
        {
            key: "status", label: "Status", render: (r) => (
                <StatusToggle label={`Toggle ${r.name}`} on={r.status === "Active"} onChange={(v) => void setStatus(r.id, v)} />
            ),
        },
        {
            key: "products", label: "Associated Products", render: (r) => (
                <button type="button" onClick={() => nav(`${BASE}/${r.id}`)} className="font-semibold text-brand hover:underline">
                    {r.products.length} products
                </button>
            ),
        },
    ];

    return (
        <>
            <ListShell
                rows={rows}
                cols={cols}
                basePath={BASE}
                createLabel="Create Entity"
                rowLabel="entities"
                searchPlaceholder="Search entities…"
                cards={(r) => [
                    { label: "Total Entities", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Total Products", value: r.reduce((n, x) => n + x.products.length, 0) },
                ]}
                filterFields={fields}
                match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.name.toLowerCase().includes(q))}
                onCreate={() => openDrawer(<InstanceDrawer onSubmit={(d) => save(d)} />)}
                onEdit={(id) => { const r = rows.find((x) => x.id === id); if (r) openDrawer(<InstanceDrawer initial={r} onSubmit={(d) => save(d, r)} />); }}
            />
        </>
    );
}