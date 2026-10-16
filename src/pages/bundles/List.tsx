import ListShell, { type Col } from "@/components/catalog/ListShell";
import { StatusBadge } from "@/components/catalog/DetailBits";
import { useEffect, useState } from "react";
import type { Bundle } from "@/data/catalog";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useApp } from "@/hooks/useApp";
import { bundlesService } from "@/services/bundles.service";
import { discountShort, sellingPrice, usd } from "@/utils/catalog";

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

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const PAGE_SIZE = 8;

export default function BundlesList() {
    const isAdmin = useIsAdmin();
    const { toast, toastError } = useApp();
    const [rows, setRows] = useState<Bundle[]>([]);
    const [total, setTotal] = useState(0);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState({ page: 1, q: "" });
    const [tick, setTick] = useState(0);
    const [del, setDel] = useState<Bundle | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        setLoading(true);
        bundlesService.list(query.page, PAGE_SIZE, query.q)
            .then((r) => { if (live) { setRows(r.rows); setTotal(r.total); setReady(true); } })
            .catch((e) => { if (live) setError(msg(e)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [isAdmin, query, tick]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setTick((t) => t + 1); }} />;
    if (!ready) return <LoadingBox />;

    const confirmDelete = async () => {
        if (!del) return;
        setDeleting(true);
        try {
            await bundlesService.remove(del.id);
            toast("Bundle deleted");
            setDel(null);
            setTick((t) => t + 1); // reload the current page from the server
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
                searchPlaceholder="Search name, short code, description…"
                cards={(r) => [
                    { label: "Total Bundles", value: total },
                    { label: "Add Ons (this page)", value: r.filter((x) => x.pricingType === "Add On").length },
                    { label: "Bundles (this page)", value: r.filter((x) => x.pricingType === "Bundle").length },
                ]}
                filterFields={[]}
                match={() => true}
                server={{
                    total,
                    pageSize: PAGE_SIZE,
                    loading,
                    onChange: (page, q) => setQuery((p) => (p.page === page && p.q === q ? p : { page, q })),
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