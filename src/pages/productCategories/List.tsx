import { useEffect, useState } from "react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import type { FilterField } from "@/components/catalog/ListDrawers";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { categoriesService, type CategoryRec } from "@/services/categories.service";

const cols: Col<CategoryRec>[] = [
    { key: "name", label: "Name", link: true, render: (r) => r.name },
    { key: "description", label: "Description", render: (r) => r.description || "-" },
    {
        key: "bgColor", label: "Background Color", sortValue: (r) => r.bgColor,
        render: (r) => r.bgColor ? (
            <span className="inline-flex items-center gap-2">
                <span className="size-4 rounded-sm border border-line" style={{ background: r.bgColor }} />
                <span className="font-mono">{r.bgColor}</span>
            </span>
        ) : "-",
    },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
];
const PAGE_SIZE = 10;
const fields: FilterField[] = []; // the backend lists active categories only and has no status filter
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function ProductCategoriesList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [data, setData] = useState<{ rows: CategoryRec[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<CategoryRec | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let live = true;
        setLoading(true);
        categoriesService.listPage(page, PAGE_SIZE, q)
            .then((r) => {
                if (!live) return;
                // the last item of the last page was deleted: go to the new last page
                if (!r.rows.length && r.total > 0 && page > 1) { setPage(Math.ceil(r.total / PAGE_SIZE)); return; }
                setData(r);
            })
            .catch((e) => { if (live) setError(msg(e)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [page, q, tick]);
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setPage(1); setQ(""); setTick((t) => t + 1); }} />;
    if (!data) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await categoriesService.remove(del.id);
            setTick((t) => t + 1);
            toast("Category deleted");
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
                rows={data.rows}
                cols={cols}
                basePath="/catalog/product-categories"
                createLabel="Create Category"
                rowLabel="categories"
                searchPlaceholder="Search categories…"
                filterFields={fields}
                match={() => true}
                server={{ total: data.total, pageSize: PAGE_SIZE, loading, onChange: (p, s) => { setPage(p); setQ(s); } }}
                onDelete={isAdmin ? (id) => setDel(data.rows.find((x) => x.id === id) ?? null) : undefined}
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