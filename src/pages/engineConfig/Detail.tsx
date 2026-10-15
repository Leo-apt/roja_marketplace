import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DetailShell, DSection, DTile, DTiles } from "@/components/catalog/DetailBits";
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
                <DTiles>
                    <DTile label="Provider ID">{providerLabel}</DTile>
                    <DTile label="Offer Type">{c.offerType}</DTile>
                    <DTile label="Category">{dash(c.category)}</DTile>
                </DTiles>
            </DetailHeader>

            <DSection title="Decision Thresholds">
                <DTiles>
                    <DTile label="Show ≥">{dash(c.show)}</DTile>
                    <DTile label="Review ≥">{dash(c.review)}</DTile>
                    <DTile label="Hide">{dash(c.hide)}</DTile>
                </DTiles>
            </DSection>

            {c.signals.length === 0 && <DSection title="Signals"><EmptyState compact title="No signals configured" /></DSection>}
            {c.signals.map((s, i) => (
                <DSection key={s.uid} title={`Signal ${i + 1}`}>
                    <DTiles>
                        <DTile label="Signal ID">{dash(s.signalId)}</DTile>
                        <DTile label="Label">{dash(s.label)}</DTile>
                        <DTile label="Min Count">{dash(s.minCount)}</DTile>
                        <DTile label="Top Category">{dash(s.topCategory)}</DTile>
                        <DTile label="Code">{dash(s.code)}</DTile>
                        <DTile label="MCC">{dash(s.mcc)}</DTile>
                        <DTile label="Keywords">{dash(s.keywords)}</DTile>
                        <DTile label="Same As (signal id)">{dash(s.sameAs)}</DTile>
                        <DTile label="Flags">{dash(s.flags)}</DTile>
                        <DTile label="Context Field">{dash(s.contextField)}</DTile>
                        <DTile label="Weight Type">{weightTypes.find((w) => w.value === s.weightType)?.label ?? s.weightType}</DTile>
                        {(weightFields[s.weightType] ?? []).map((f) => <DTile key={f.key} label={f.label}>{dash(s[f.key])}</DTile>)}
                    </DTiles>
                </DSection>
            ))}

            <DSection title="Audit">
                <DTiles four>
                    <DTile label="Created By">{c.createdBy}</DTile>
                    <DTile label="Created On">{c.createdOn}</DTile>
                    <DTile label="Last Updated By">{c.updatedBy}</DTile>
                    <DTile label="Last Updated On">{c.updatedOn}</DTile>
                </DTiles>
            </DSection>
        </DetailShell>
    );
}