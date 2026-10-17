import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DRow, DRows, DSection } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { marginsService, type MarginRec } from "@/services/margins.service";
import { usd } from "@/utils/catalog";
import EmptyState from "@/components/shared/EmptyState";

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
            />

            <DSection title="Overview">
                <DRows>
                    <DRow label="Wholesale Price">{usd(r.wholesale)}</DRow>
                    <DRow label="Retail Price">{usd(r.retail)}</DRow>
                    <DRow label="Roja Markup">{usd(r.markupAmount)}</DRow>
                    <DRow label="Roja Buy Rate">{usd(r.buyRate)}</DRow>
                </DRows>
            </DSection>

            <DSection title="Features">
                {r.features.length ? (
                    <div className="flex flex-wrap gap-2">
                        {r.features.map((x) => (
                            <span key={x} className="rounded-md bg-brandsoft px-3 py-1 text-xs font-semibold text-brand">{x}</span>
                        ))}
                    </div>
                ) : <EmptyState compact title="No features" />}
            </DSection>

            <DSection title="Audit">
                <DRows>
                    <DRow label="Created By">{r.createdBy}</DRow>
                    <DRow label="Created On">{r.createdOn}</DRow>
                    <DRow label="Last Updated By">{r.updatedBy}</DRow>
                    <DRow label="Last Updated On">{r.updatedOn}</DRow>
                </DRows>
            </DSection>
        </DetailShell>
    );
}