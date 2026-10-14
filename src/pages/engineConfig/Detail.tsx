import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DCard, DetailShell, Grid, KV, StatusBadge } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { providers, weightFields, weightTypes, type EngineConfig } from "@/data/engine";
import { engineConfigsService } from "@/services/engineConfigs.service";

const BASE = "/catalog/engine-configuration";
const dash = (s: string) => s || "-";

export default function EngineConfigDetail() {
    const { id } = useParams();
    const [c, setC] = useState<EngineConfig | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        engineConfigsService.get(id)
            .then((r) => { if (live) setC(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!c || c.id !== id) return <LoadingBox />;
    return (
        <DetailShell backTo={BASE} editTo={`${BASE}/${c.id}/edit`}>
            <DCard title="Configuration">
                <Grid>
                    <KV k="Config Name">{c.name}</KV>
                    <KV k="Status"><StatusBadge status={c.status} /></KV>
                    <KV k="Provider ID">{providers.find((p) => p.value === c.providerId)?.label ?? c.providerId}</KV>
                    <KV k="Offer Type">{c.offerType}</KV>
                    <KV k="Category">{dash(c.category)}</KV>
                    <KV k="Base Score">{dash(c.baseScore)}</KV>
                    <KV k="Created By">{c.createdBy}</KV>
                    <KV k="Created On">{c.createdOn}</KV>
                    <KV k="Last Updated By">{c.updatedBy}</KV>
                    <KV k="Last Updated On">{c.updatedOn}</KV>
                </Grid>
            </DCard>

            <DCard title="Decision Thresholds">
                <Grid>
                    <KV k="Show ≥">{dash(c.show)}</KV>
                    <KV k="Review ≥">{dash(c.review)}</KV>
                    <KV k="Hide">{dash(c.hide)}</KV>
                </Grid>
            </DCard>

            {c.signals.length === 0 && <DCard title="Signals"><p className="text-sm text-muted">No signals configured.</p></DCard>}
            {c.signals.map((s, i) => (
                <DCard key={s.uid} title={`Signal ${i + 1}`}>
                    <Grid>
                        <KV k="Signal ID">{dash(s.signalId)}</KV>
                        <KV k="Label">{dash(s.label)}</KV>
                        <KV k="Min Count">{dash(s.minCount)}</KV>
                        <KV k="Top Category">{dash(s.topCategory)}</KV>
                        <KV k="Code">{dash(s.code)}</KV>
                        <KV k="MCC">{dash(s.mcc)}</KV>
                        <KV k="Keywords">{dash(s.keywords)}</KV>
                        <KV k="Same As (signal id)">{dash(s.sameAs)}</KV>
                        <KV k="Flags">{dash(s.flags)}</KV>
                        <KV k="Context Field">{dash(s.contextField)}</KV>
                        <KV k="Weight Type">{weightTypes.find((w) => w.value === s.weightType)?.label ?? s.weightType}</KV>
                        {(weightFields[s.weightType] ?? []).map((f) => <KV key={f.key} k={f.label}>{dash(s[f.key])}</KV>)}
                    </Grid>
                </DCard>
            ))}
        </DetailShell>
    );
}