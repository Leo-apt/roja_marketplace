import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { useEffect, useState } from "react";
import type { Bundle } from "@/data/catalog";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { bundlesService } from "@/services/bundles.service";
import { discountShort, sellingPrice, statusFilterOptions, usd } from "@/utils/catalog";
import { avg } from "@/components/catalog/StatCards";

const discountOf = (b: Bundle) => (b.discountOn && b.discountValue ? discountShort(b.discountType, b.discountValue) : "No discount");
const sellOf = (b: Bundle) =>
    b.price == null ? null : sellingPrice(b.price, b.discountOn ? b.discountType : "", b.discountValue ?? 0);

const cols: Col<Bundle>[] = [
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "pricingType", label: "Pricing Type", render: (r) => r.pricingType },
    { key: "price", label: "Price ($)", align: "right", render: (r) => usd(r.price) },
    { key: "discount", label: "Discount", render: (r) => discountOf(r) },
    { key: "selling", label: "Selling Price ($)", align: "right", render: (r) => usd(sellOf(r)) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const fields: FilterField[] = [
    {
        key: "pricingType", label: "Pricing Type", options: [
            { value: "all", label: "Select pricing type" }, { value: "Bundle", label: "Bundle" }, { value: "Add On", label: "Add On" }]
    },
    {
        key: "discount", label: "Discount Type", options: [
            { value: "all", label: "Select discount type" }, { value: "fixed", label: "Fixed" },
            { value: "percent", label: "Percentage" }, { value: "none", label: "No discount" }]
    },
    { key: "status", label: "Status", options: statusFilterOptions },
];

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function BundlesList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<Bundle[] | null>(null);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<Bundle | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        bundlesService.list()
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
            await bundlesService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
            toast("Bundle deleted");
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
                basePath="/catalog/bundles"
                createLabel="Create Bundle"
                rowLabel="bundles"
                searchPlaceholder="Search bundles…"
                cards={(r) => [
                    { label: "Total Bundles", value: r.length },
                    { label: "Add Ons", value: r.filter((x) => x.pricingType === "Add On").length },
                    { label: "Bundles", value: r.filter((x) => x.pricingType === "Bundle").length },
                    { label: "Avg Add-On Price", value: usd(avg(r.flatMap((x) => (x.price == null ? [] : [x.price])))) },
                ]}
                filterFields={fields}
                match={(r, q, f) => {
                    const dKind = r.discountOn && r.discountValue ? r.discountType : "none";
                    return (f.pricingType === "all" || r.pricingType === f.pricingType)
                        && (f.discount === "all" || dKind === f.discount)
                        && (f.status === "all" || r.status === f.status)
                        && (!q || r.name.toLowerCase().includes(q));
                }}
                onDelete={(id) => setDel(rows.find((x) => x.id === id) ?? null)}
            />
            <ConfirmDialog
                isOpen={!!del}
                type="delete"
                itemType="bundle"
                itemName={del?.name}
                loading={deleting}
                onClose={() => setDel(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}