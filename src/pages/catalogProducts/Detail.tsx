import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, StatusBadge } from "@/components/catalog/DetailBits";
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
        <DetailShell backTo={BASE} editTo={`${BASE}/${r.id}/edit`}>
            <DCard title="Margin Details">
                <Grid>
                    <KV k="Product Name">{r.product}</KV>
                    <KV k="Features">{r.features.length ? r.features.map((x) => <div key={x}>{x}</div>) : "-"}</KV>
                    <KV k="Wholesale Price">{usd(r.wholesale)}</KV>
                    <KV k="Retail Price">{usd(r.retail)}</KV>
                    <KV k="Roja Markup">{usd(r.markupAmount)}</KV>
                    <KV k="Roja Buy Rate">{usd(r.buyRate)}</KV>
                    <KV k="Margin Vs. Retail">{usd(r.marginVsRetail)}</KV>
                    <KV k="Status">{r.status ? <StatusBadge status={r.status} /> : "-"}</KV>
                    <KV k="Created By">{r.createdBy}</KV>
                    <KV k="Created On">{r.createdOn}</KV>
                    <KV k="Last Updated By">{r.updatedBy}</KV>
                    <KV k="Last Updated On">{r.updatedOn}</KV>
                </Grid>
            </DCard>
        </DetailShell>
    );
}