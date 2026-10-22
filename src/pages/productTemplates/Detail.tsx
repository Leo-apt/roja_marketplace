import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DSection, DTile, DTiles, NotFound } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { fmt } from "@/services/categories.service";
import { COLOR_FIELDS, productTemplatesService, type TemplateRec } from "@/services/productTemplates.service";
import { BASE, Swatch } from "./List";

const na = (v?: string) => (v ? v : "N/A");

const Img = ({ src, alt }: { src: string; alt: string }) =>
    src ? <img src={src} alt={alt} className="h-24 rounded-md border border-line object-contain" /> : <>N/A</>;

export default function ProductTemplatesDetail() {
    const { id } = useParams();
    const [rec, setRec] = useState<TemplateRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        productTemplatesService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!id) return <NotFound backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;

    return (
        <div className="flex flex-col gap-4">
            <DetailHeader title={rec.name} status={rec.status} editTo={`${BASE}/${rec.id}/edit`} />
            <DSection title="Overview">
                <DTiles>
                    <DTile label="Template Name">{na(rec.name)}</DTile>
                    <DTile label="Created On">{fmt(rec.createdAt)}</DTile>
                    <DTile label="Last Updated On">{fmt(rec.updatedAt)}</DTile>
                    <DTile label="Created By">{na(rec.createdBy)}</DTile>
                    <DTile label="Last Updated By">{na(rec.updatedBy)}</DTile>
                </DTiles>
            </DSection>
            <DSection title="Template Information">
                <DTiles>
                    <DTile label="Background Image"><Img src={rec.bgImageUrl} alt="Background" /></DTile>
                    <DTile label="Front Image"><Img src={rec.frontImageUrl} alt="Front" /></DTile>
                    {COLOR_FIELDS.map((c) => (
                        <DTile key={c.key} label={c.label}><Swatch v={rec[c.key]} /></DTile>
                    ))}
                </DTiles>
            </DSection>
        </div>
    );
}