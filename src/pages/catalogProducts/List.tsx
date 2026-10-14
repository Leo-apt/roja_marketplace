import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { avg } from "@/components/catalog/StatCards";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { marginsService, type MarginRec } from "@/services/margins.service";
import { usd } from "@/utils/catalog";

const cols: Col<MarginRec>[] = [
    { key: "product", label: "Product", link: true, render: (r) => r.product },
    { key: "wholesale", label: "Wholesale Price ($)", align: "right", render: (r) => usd(r.wholesale) },
    { key: "retail", label: "Suggested Retail ($)", align: "right", render: (r) => usd(r.retail) },
    { key: "markupAmt", label: "Roja Markup Amount ($)", align: "right", render: (r) => usd(r.markupAmount) },
    { key: "markupPct", label: "Roja Markup (%)", align: "right", render: (r) => `${r.markupPercent}%` },
    { key: "buy", label: "Roja Buy Value ($)", align: "right", render: (r) => usd(r.buyRate) },
    { key: "margin", label: "Margin vs. Retail ($)", align: "right", render: (r) => usd(r.marginVsRetail) },
];

const statusOptions = [
    { value: "all", label: "Select status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Draft", label: "Draft" },
    { value: "Scheduled", label: "Scheduled" },
];
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusOptions }];
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function MarginsList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<MarginRec[] | null>(null);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<MarginRec | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        marginsService.list()
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
            await marginsService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
            toast("Margin deleted");
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
                basePath="/catalog/margins"
                createLabel="Create Margin"
                rowLabel="margins"
                searchPlaceholder="Search products…"
                cards={(r) => {
                    const ms = r.flatMap((x) => (x.marginVsRetail == null ? [] : [x.marginVsRetail]));
                    return [
                        { label: "Total Margins", value: r.length },
                        { label: "Avg Markup", value: `${avg(r.map((x) => x.markupPercent)).toFixed(2)}%` },
                        { label: "Total Margin", value: usd(ms.reduce((a, b) => a + b, 0)) },
                        { label: "Highest Margin", value: usd(ms.length ? Math.max(...ms) : 0) },
                    ];
                }}
                filterFields={fields}
                match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.product.toLowerCase().includes(q))}
                onDelete={(id) => setDel(rows.find((x) => x.id === id) ?? null)}
            />
            <ConfirmDialog
                isOpen={!!del}
                type="delete"
                itemType="margin"
                itemName={del?.product}
                loading={deleting}
                onClose={() => setDel(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}