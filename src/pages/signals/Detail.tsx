import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DetailHeader, DSection, DTile, DTiles, NotFound } from "@/components/catalog/DetailBits";
import { ErrorBox, LoadingBox } from "@/components/catalog/PageState";
import { fmtDate, signalsService, WEIGHT_FIELDS, WEIGHT_TYPES, type SignalRec } from "@/services/signals.service";
import { BASE } from "./List";

const na = (v?: string | number | null) => (v === null || v === undefined || v === "" ? "N/A" : String(v));

function Chips({ items }: { items: string[] }) {
    if (!items.length) return <>N/A</>;
    return (
        <span className="flex flex-wrap gap-1.5">
            {items.map((v) => (
                <span key={v} className="rounded-full bg-brandsoft px-2.5 py-1 text-xs font-semibold text-brand">{v}</span>
            ))}
        </span>
    );
}

export default function SignalsDetail() {
    const { id } = useParams();
    const [rec, setRec] = useState<SignalRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        let live = true;
        signalsService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id]);

    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!id) return <NotFound backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;

    const weight = WEIGHT_TYPES.find((w) => w.value === rec.weightType)?.label ?? rec.weightType;

    return (
        <div className="flex flex-col gap-4">
            <DetailHeader title={rec.label} subtitle={rec.signalId} editTo={`${BASE}/${rec.id}/edit`} />
            <DSection title="Overview">
                <DTiles>
                    <DTile label="Signal ID">{na(rec.signalId)}</DTile>
                    <DTile label="Signal Label">{na(rec.label)}</DTile>
                    <DTile label="Minimum Count">{na(rec.minCount)}</DTile>
                    <DTile label="Same As">{na(rec.sameAs)}</DTile>
                    <DTile label="Weight Type">{na(weight)}</DTile>
                    {(WEIGHT_FIELDS[rec.weightType] ?? []).map((w) => (
                        <DTile key={w.key} label={w.label}>{na(rec[w.key])}</DTile>
                    ))}
                </DTiles>
            </DSection>
            <DSection title="Match Criteria">
                <DTiles>
                    <DTile label="Top Category"><Chips items={rec.topCategory} /></DTile>
                    <DTile label="Code"><Chips items={rec.code} /></DTile>
                    <DTile label="MCC"><Chips items={rec.mcc} /></DTile>
                    <DTile label="Keywords"><Chips items={rec.keywords} /></DTile>
                </DTiles>
            </DSection>
            <DSection title="Audit">
                <DTiles>
                    <DTile label="Created On">{fmtDate(rec.createdAt)}</DTile>
                    <DTile label="Last Updated On">{fmtDate(rec.updatedAt)}</DTile>
                    <DTile label="Created By">{na(rec.createdBy)}</DTile>
                    <DTile label="Last Updated By">{na(rec.updatedBy)}</DTile>
                </DTiles>
            </DSection>
        </div>
    );
}