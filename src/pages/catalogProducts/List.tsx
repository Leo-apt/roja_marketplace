import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
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
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "draft", label: "Draft" },
    { value: "scheduled", label: "Scheduled" },
];
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusOptions }];
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const PAGE_SIZE = 10;

export default function CatalogProductsList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<ProductRec[]>([]);
    const [total, setTotal] = useState(0);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState({ page: 1, q: "", status: "" });
    const [tick, setTick] = useState(0);
    const [stats, setStats] = useState<{ all: number; active: number; draft: number; scheduled: number } | null>(null);
    const [del, setDel] = useState<ProductRec | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        setLoading(true);
        productsService.listPage(query.page, PAGE_SIZE, query.q, query.status)
            .then((r) => { if (live) { setRows(r.rows); setTotal(r.total); setReady(true); } })
            .catch((e) => { if (live) setError(msg(e)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [isAdmin, query, tick]);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        Promise.all([
            productsService.count(), productsService.count("active"),
            productsService.count("draft"), productsService.count("scheduled"),
        ])
            .then(([all, active, draft, scheduled]) => { if (live) setStats({ all, active, draft, scheduled }); })
            .catch(() => { /* cards show "-" if this fails */ });
        return () => { live = false; };
    }, [isAdmin, tick]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setTick((t) => t + 1); }} />;
    if (!ready) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await productsService.remove(del.id);
            toast("Product deleted");
            setDel(null);
            setTick((t) => t + 1); // reload the current page and the cards
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
                cards={() => [
                    { label: "Total Products", value: stats?.all ?? "-" },
                    { label: "Active", value: stats?.active ?? "-" },
                    { label: "Draft", value: stats?.draft ?? "-" },
                    { label: "Scheduled", value: stats?.scheduled ?? "-" },
                ]}
                filterFields={fields}
                match={() => true}
                server={{
                    total,
                    pageSize: PAGE_SIZE,
                    loading,
                    onChange: (page, q, f) => {
                        const status = !f.status || f.status === "all" ? "" : f.status;
                        setQuery((p) => (p.page === page && p.q === q && p.status === status ? p : { page, q, status }));
                    },
                }}
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