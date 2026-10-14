import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { categoriesService, type CategoryRec } from "@/services/categories.service";

const BASE = "/catalog/product-categories";

export default function ProductCategoriesDetail() {
    const { id } = useParams();
    const [rec, setRec] = useState<CategoryRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        categoriesService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;

    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${rec.id}/edit`}>
            <DCard title="Category Details">
                <Grid>
                    <KV k="Name">{rec.name}</KV>
                    <KV k="Slug">{rec.slug}</KV>
                    <KV k="Status"><StatusBadge status={rec.status} /></KV>
                    <KV k="Description">{rec.description || "-"}</KV>
                    <KV k="Created By">{rec.createdBy}</KV>
                    <KV k="Created On">{rec.createdOn}</KV>
                    <KV k="Last Updated By">{rec.updatedBy}</KV>
                    <KV k="Last Updated On">{rec.updatedOn}</KV>
                </Grid>
            </DCard>
        </DetailShell>
    );
}