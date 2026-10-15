import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DSection, DTile, DTiles } from "@/components/catalog/DetailBits";
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
        <DetailShell backTo={BASE}>
            <DetailHeader
                title={rec.name}
                subtitle={`Slug · ${rec.slug}`}
                status={rec.status}
                editTo={`${BASE}/${rec.id}/edit`}
            >
                <p className="text-sm text-cell-text">{rec.description || "No description"}</p>
            </DetailHeader>

            <DSection title="Audit">
                <DTiles four>
                    <DTile label="Created By">{rec.createdBy}</DTile>
                    <DTile label="Created On">{rec.createdOn}</DTile>
                    <DTile label="Last Updated By">{rec.updatedBy}</DTile>
                    <DTile label="Last Updated On">{rec.updatedOn}</DTile>
                </DTiles>
            </DSection>
        </DetailShell>
    );
}