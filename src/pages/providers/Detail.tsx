import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DSection, DTile, DTiles, StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { providersService, type ProviderRec } from "@/services/providers.service";

const BASE = "/catalog/providers";
const na = (v?: string) => (v ? v : "N/A");

export default function ProvidersDetail() {
    const { id } = useParams();
    const [rec, setRec] = useState<ProviderRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        providersService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;

    return (
        <DetailShell backTo={BASE}>
            <DetailHeader title={rec.name} subtitle={rec.providerId} status={rec.status} editTo={`${BASE}/${rec.id}/edit`} />
            <DSection title="Overview">
                <DTiles>
                    <DTile label="Company Name">{na(rec.name)}</DTile>
                    <DTile label="Email ID">{na(rec.email)}</DTile>
                    <DTile label="Cell Phone No">{na(rec.phone)}</DTile>
                    <DTile label="Status"><StatusBadge status={rec.status} /></DTile>
                    <DTile label="Created On">{na(rec.createdOn)}</DTile>
                    <DTile label="Last Updated On">{na(rec.updatedOn)}</DTile>
                    <DTile label="Created By">{na(rec.createdBy)}</DTile>
                    <DTile label="Last Updated By">{na(rec.updatedBy)}</DTile>
                </DTiles>
            </DSection>
        </DetailShell>
    );
}