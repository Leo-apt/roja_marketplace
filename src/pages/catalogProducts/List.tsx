import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { avg } from "@/components/catalog/StatCards";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { productsService, type ProductRec } from "@/services/products.service";
import { discountShort, usd } from "@/utils/catalog";

const cols: Col<ProductRec>[] = [
    { key: "category", label: "Category", render: (r) => r.categoryName },
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "features", label: "Features", render: (r) => r.bundles.map((b) => b.name || b.shortCode).join(", ") || "-" },
    { key: "wholesale", label: "Wholesale Price ($)", align: "right", render: () => "-" }, // no API field yet
    { key: "retail", label: "Retail Price ($)", align: "right", render: (r) => usd(r.retail) },
    { key: "discount", label: "Discount", render: (r) => (r.discountType && r.discountValue ? discountShort(r.discountType, r.discountValue) : "No discount") },
    { key: "selling", label: "Selling Price ($)", align: "right", render: (r) => usd(r.sellingPrice) },
    { key: "buy", label: "Roja Buy Rate ($)", align: "right", render: () => "-" }, // no API field yet
    { key: "margin", label: "Margin vs. Retail ($)", align: "right", render: () => "-" }, // no API field yet
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const statusOptions = [
    { value: "all", label: "Select status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Draft", label: "Draft" },
    { value: "Scheduled", label: "Scheduled" },
];
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function CatalogProductsList() {
    const isAdmin = useIsAdmin();
    const { toast } = useApp();
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

    const catOptions = [
        { value: "all", label: "Select category" },
        ...[...new Map(rows.map((r) => [r.categoryId, r.categoryName])).entries()].map(([value, label]) => ({ value, label })),
    ];
    const fields: FilterField[] = [
        { key: "category", label: "Category", options: catOptions },
        { key: "status", label: "Status", options: statusOptions },
    ];

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await productsService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
            toast("Product deleted");
            setDel(null);
        } catch (e) {
            toast(msg(e));
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
                    (f.category === "all" || r.categoryId === f.category)
                    && (f.status === "all" || r.status === f.status)
                    && (!q || r.name.toLowerCase().includes(q))}
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