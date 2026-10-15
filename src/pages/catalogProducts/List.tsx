import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { avg } from "@/components/catalog/StatCards";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { productsService, type ProductRec } from "@/services/products.service";
import { usd } from "@/utils/catalog";

const cols: Col<ProductRec>[] = [
    { key: "name", label: "Product Name", link: true, render: (r) => r.name },
    { key: "categoryName", label: "Category", render: (r) => r.categoryName },
    { key: "retail", label: "Retail Price ($)", align: "right", render: (r) => (r.retail == null ? "-" : usd(r.retail)) },
    { key: "sellingPrice", label: "Selling Price ($)", align: "right", render: (r) => (r.sellingPrice == null ? "-" : usd(r.sellingPrice)) },
    { key: "bundles", label: "Bundles", render: (r) => (r.bundles.length ? r.bundles.map((b) => b.name || b.shortCode).join(", ") : "-") },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
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

export default function CatalogProductsList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<ProductRec[] | null>(null);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<ProductRec | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        productsService.list()
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
            await productsService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
            toast("Product deleted");
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
                basePath="/catalog/products"
                createLabel="Create Product"
                rowLabel="products"
                searchPlaceholder="Search products…"
                cards={(r) => [
                    { label: "Total Products", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Draft", value: r.filter((x) => x.status === "Draft").length },
                    { label: "Avg Selling Price", value: usd(avg(r.flatMap((x) => (x.sellingPrice == null ? [] : [x.sellingPrice])))) },
                ]}
                filterFields={fields}
                match={(r, q, f) =>
                    (f.status === "all" || r.status === f.status) &&
                    (!q || r.name.toLowerCase().includes(q) || r.categoryName.toLowerCase().includes(q))}
                onDelete={(id) => setDel(rows.find((x) => x.id === id) ?? null)}
            />
            <ConfirmDialog
                isOpen={!!del}
                type="delete"
                itemType="product"
                itemName={del?.name}
                loading={deleting}
                onClose={() => setDel(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}