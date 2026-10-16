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
            />

            <DSection title="Details">
                <p className="break-words text-sm text-cell-text mb-6">
                    <span className="font-semibold text-ink">Description :</span> {rec.description || "No description"}
                </p>
                <DTiles>
                    <DTile label="Background Color">
                        {rec.bgColor ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="size-5 rounded-sm border border-line" style={{ background: rec.bgColor }} />
                                <span className="font-mono">{rec.bgColor}</span>
                            </span>
                        ) : "-"}
                    </DTile>
                </DTiles>
            </DSection>

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