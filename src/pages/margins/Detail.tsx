import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, NotFound, StatusBadge } from "@/components/catalog/DetailBits";
import { margins } from "@/data/catalog";
import { calcMargin, usd } from "@/utils/catalog";

const BASE = "/catalog/margins";

export default function MarginsDetail() {
    const { id } = useParams();
    const r = margins.find((x) => x.id === id);
    if (!r) return <NotFound backTo={BASE} />;
    const m = calcMargin(r.wholesale, r.retail, r.markup, r.markupType);
    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${r.id}/edit`}>
            <DCard title="Margin Details">
                <Grid>
                    <KV k="Product Name">{r.product}</KV>
                    <KV k="Features">{r.features.length ? r.features.map((x) => <div key={x}>{x}</div>) : "-"}</KV>
                    <KV k="Wholesale Price">{usd(r.wholesale)}</KV>
                    <KV k="Retail Price">{usd(r.retail)}</KV>
                    <KV k="Roja Markup">{usd(m.markupAmt)}</KV>
                    <KV k="Roja Buy Rate">{usd(m.buy)}</KV>
                    <KV k="Margin Vs. Retail">{usd(m.margin)}</KV>
                    <KV k="Status"><StatusBadge status={r.status} /></KV>
                    <KV k="Created By">{r.createdBy}</KV>
                    <KV k="Created On">{r.createdOn}</KV>
                    <KV k="Last Updated By">{r.updatedBy}</KV>
                    <KV k="Last Updated On">{r.updatedOn}</KV>
                </Grid>
            </DCard>
        </DetailShell>
    );
}