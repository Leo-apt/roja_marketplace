import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DSection, DRow, DRows } from "@/components/catalog/DetailBits";
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

            <DSection title="Overview">
                <DRows>
                    <DRow label="Description" wide>{rec.description || "No description"}</DRow>
                    <DRow label="Background Color">
                        {rec.bgColor ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="size-5 rounded-sm border border-line" style={{ background: rec.bgColor }} />
                                <span className="font-mono">{rec.bgColor}</span>
                            </span>
                        ) : "-"}
                    </DRow>
                </DRows>
            </DSection>

            <DSection title="Audit">
                <DRows>
                    <DRow label="Created By">{rec.createdBy}</DRow>
                    <DRow label="Created On">{rec.createdOn}</DRow>
                    <DRow label="Last Updated By">{rec.updatedBy}</DRow>
                    <DRow label="Last Updated On">{rec.updatedOn}</DRow>
                </DRows>
            </DSection>
        </DetailShell>
    );
}