import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { Toggle } from "@/components/catalog/FormBits";
import { AdminNotice, useIsAdmin } from "@/components/catalog/PageState";
import InstanceDrawer, { type InstanceDraft } from "@/components/catalog/InstanceDrawer";
import { useApp } from "@/hooks/useApp";
import type { Status } from "@/data/catalog";
import { instances, type Instance } from "@/data/instances";
import { statusFilterOptions } from "@/utils/catalog";

const BASE = "/instances";
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusFilterOptions }];

export default function InstancesList() {
    const isAdmin = useIsAdmin();
    const nav = useNavigate();
    const { toast } = useApp();
    const [rows, setRows] = useState<Instance[]>([...instances]);
    const [drawer, setDrawer] = useState(false);

    if (!isAdmin) return <AdminNotice />;

    const setStatus = (id: string, on: boolean) => {
        const s: Status = on ? "Active" : "Inactive";
        instances.forEach((i) => { if (i.id === id) i.status = s; }); // keeps the mock store in sync
        setRows((r) => r.map((x) => (x.id === id ? { ...x, status: s } : x)));
        toast(`Instance ${on ? "activated" : "deactivated"}`);
    };

    const create = (d: InstanceDraft) => {
        const rec: Instance = { id: `i${Date.now()}`, ...d, status: "Active", products: [] };
        instances.push(rec);
        setRows((r) => [...r, rec]);
        toast("Instance created");
    };

    const cols: Col<Instance>[] = [
        { key: "name", label: "Instance Name", link: true, render: (r) => r.name },
        {
            key: "status", label: "Status", render: (r) => (
                <div className="flex items-center gap-2">
                    <Toggle label={`Toggle ${r.name}`} on={r.status === "Active"} onChange={(v) => setStatus(r.id, v)} />
                    <span>{r.status}</span>
                </div>
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
                rowLabel="instances"
                searchPlaceholder="Search instances…"
                cards={(r) => [
                    { label: "Total Instances", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Total Products", value: r.reduce((n, x) => n + x.products.length, 0) },
                ]}
                filterFields={fields}
                match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.name.toLowerCase().includes(q))}
                onCreate={() => setDrawer(true)}
            />
            <InstanceDrawer open={drawer} onClose={() => setDrawer(false)} onCreate={create} />
        </>
    );
}