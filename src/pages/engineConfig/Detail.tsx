import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DRow, DRows, DSection } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { providers, weightFields, weightTypes, type EngineConfig } from "@/data/engine";
import { engineConfigsService } from "@/services/engineConfigs.service";
import EmptyState from "@/components/shared/EmptyState";

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
    const providerLabel = providers.find((p) => p.value === c.providerId)?.label ?? c.providerId;
    return (
        <DetailShell backTo={BASE}>
            <DetailHeader
                title={c.name}
                subtitle={`${providerLabel} · ${c.offerType}`}
                status={c.status}
                highlight={{ label: "Base Score", value: dash(c.baseScore) }}
                editTo={`${BASE}/${c.id}/edit`}
            >
                <DRows>
                    <DRow label="Provider ID">{providerLabel}</DRow>
                    <DRow label="Offer Type">{c.offerType}</DRow>
                    <DRow label="Category">{dash(c.category)}</DRow>
                </DRows>
            </DetailHeader>

            <DSection title="Decision Thresholds">
                <DSection title="Decision Thresholds">
                    <DRows>
                        <DRow label="Show ≥">{dash(c.show)}</DRow>
                        <DRow label="Review ≥">{dash(c.review)}</DRow>
                        <DRow label="Hide">{dash(c.hide)}</DRow>
                    </DRows>
                </DSection>
            </DSection>

            {c.signals.length === 0 && <DSection title="Signals"><EmptyState compact title="No signals configured" /></DSection>}
            {c.signals.map((s, i) => (
                <DSection key={s.uid} title={`Signal ${i + 1}`}>
                    <DRows>
                        <DRow label="Signal ID">{dash(s.signalId)}</DRow>
                        <DRow label="Label">{dash(s.label)}</DRow>
                        <DRow label="Min Count">{dash(s.minCount)}</DRow>
                        <DRow label="Top Category">{dash(s.topCategory)}</DRow>
                        <DRow label="Code">{dash(s.code)}</DRow>
                        <DRow label="MCC">{dash(s.mcc)}</DRow>
                        <DRow label="Keywords">{dash(s.keywords)}</DRow>
                        <DRow label="Same As (signal id)">{dash(s.sameAs)}</DRow>
                        <DRow label="Flags">{dash(s.flags)}</DRow>
                        <DRow label="Context Field">{dash(s.contextField)}</DRow>
                        <DRow label="Weight Type">{weightTypes.find((w) => w.value === s.weightType)?.label ?? s.weightType}</DRow>
                        {(weightFields[s.weightType] ?? []).map((f) => <DRow key={f.key} label={f.label}>{dash(s[f.key])}</DRow>)}
                    </DRows>
                </DSection>
            ))}

            <DSection title="Audit">
                <DRows>
                    <DRow label="Created By">{c.createdBy}</DRow>
                    <DRow label="Created On">{c.createdOn}</DRow>
                    <DRow label="Last Updated By">{c.updatedBy}</DRow>
                    <DRow label="Last Updated On">{c.updatedOn}</DRow>
                </DRows>
            </DSection>
        </DetailShell>
    );
}