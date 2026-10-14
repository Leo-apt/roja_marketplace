import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { categoriesService, type CategoryRec } from "@/services/categories.service";
import { statusFilterOptions } from "@/utils/catalog";

const cols: Col<CategoryRec>[] = [
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "description", label: "Description", render: (r) => r.description || "-" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];
const fields: FilterField[] = [{ key: "status", label: "Status", options: statusFilterOptions }];
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function ProductCategoriesList() {
    const isAdmin = useIsAdmin();
    const { toast } = useApp();
    const [rows, setRows] = useState<CategoryRec[] | null>(null);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<CategoryRec | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let live = true;
        categoriesService.list()
            .then((r) => { if (live) setRows(r); })
            .catch((e) => { if (live) setError(msg(e)); });
        return () => { live = false; };
    }, [tick]);
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setRows(null); setTick((t) => t + 1); }} />;
    if (!rows) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await categoriesService.remove(del.id);
            setRows((r) => (r ? r.filter((x) => x.id !== del.id) : r));
            toast("Category deleted");
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
                basePath="/catalog/product-categories"
                createLabel="Create Category"
                rowLabel="categories"
                searchPlaceholder="Search categories…"
                cards={(r) => [
                    { label: "Total Categories", value: r.length },
                    { label: "Active", value: r.filter((x) => x.status === "Active").length },
                    { label: "Inactive", value: r.filter((x) => x.status === "Inactive").length },
                ]}
                filterFields={fields}
                match={(r, q, f) => (f.status === "all" || r.status === f.status) && (!q || r.name.toLowerCase().includes(q))}
                onDelete={isAdmin ? (id) => setDel(rows.find((x) => x.id === id) ?? null) : undefined}
            />
            <ConfirmDialog
                isOpen={!!del}
                type="delete"
                itemType="category"
                itemName={del?.name}
                loading={deleting}
                onClose={() => setDel(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}