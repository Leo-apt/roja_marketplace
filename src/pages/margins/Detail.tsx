import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DSection, DTile, DTiles } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { marginsService, type MarginRec } from "@/services/margins.service";
import { usd } from "@/utils/catalog";

const BASE = "/catalog/margins";

export default function MarginsDetail() {
    const { id } = useParams();
    const [r, setR] = useState<MarginRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        marginsService.get(id)
            .then((x) => { if (live) setR(x); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!r || r.id !== id) return <LoadingBox />;
    return (
        <DetailShell backTo={BASE}>
            <DetailHeader
                title={r.product}
                subtitle="Margin details"
                status={r.status || undefined}
                highlight={{ label: "Margin Vs. Retail", value: usd(r.marginVsRetail) }}
                editTo={`${BASE}/${r.id}/edit`}
            >
                <DTiles four>
                    <DTile label="Wholesale Price">{usd(r.wholesale)}</DTile>
                    <DTile label="Retail Price">{usd(r.retail)}</DTile>
                    <DTile label="Roja Markup">{usd(r.markupAmount)}</DTile>
                    <DTile label="Roja Buy Rate">{usd(r.buyRate)}</DTile>
                </DTiles>
            </DetailHeader>

            <DSection title="Features">
                {r.features.length ? (
                    <div className="flex flex-wrap gap-2">
                        {r.features.map((x) => (
                            <span key={x} className="rounded-md bg-brandsoft px-3 py-1 text-xs font-semibold text-brand">{x}</span>
                        ))}
                    </div>
                ) : <p className="text-sm text-muted">No features.</p>}
            </DSection>

            <DSection title="Audit">
                <DTiles four>
                    <DTile label="Created By">{r.createdBy}</DTile>
                    <DTile label="Created On">{r.createdOn}</DTile>
                    <DTile label="Last Updated By">{r.updatedBy}</DTile>
                    <DTile label="Last Updated On">{r.updatedOn}</DTile>
                </DTiles>
            </DSection>
        </DetailShell>
    );
}