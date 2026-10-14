import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, Field, inputCls, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import type { Status } from "@/data/catalog";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { engineConfigsService } from "@/services/engineConfigs.service";
import {
    blankSignal, offerTypes, providers, signalPresets, weightFields, weightTypes,
    type EngineConfig, type Signal, type WeightType,
} from "@/data/engine";
import { num, statusFormOptions } from "@/utils/catalog";

const BASE = "/catalog/engine-configuration";
type Errors = Record<string, string>;

// Numeric-only input: digits and one decimal point
function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input className={inputCls} inputMode="decimal" value={value} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))} />
    );
}

interface Form {
    providerId: string; offerType: string; name: string; category: string; baseScore: string;
    show: string; review: string; hide: string; status: Status; signals: Signal[];
}

const toForm = (c?: EngineConfig): Form =>
    c
        ? {
            providerId: c.providerId, offerType: c.offerType, name: c.name, category: c.category, baseScore: c.baseScore,
            show: c.show, review: c.review, hide: c.hide, status: c.status, signals: c.signals.map((s) => ({ ...s }))
        }
        : { providerId: "", offerType: "", name: "", category: "", baseScore: "", show: "", review: "", hide: "", status: "Active", signals: [blankSignal()] };

function EngineConfigForm({ initial }: { initial?: EngineConfig }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [f, setF] = useState<Form>(() => toForm(initial));
    const [errors, setErrors] = useState<Errors>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
    const setSig = (uid: string, patch: Partial<Signal>) =>
        setF((p) => ({ ...p, signals: p.signals.map((s) => (s.uid === uid ? { ...s, ...patch } : s)) }));

    const dd = (name: string, value: string, options: { value: string; label: string }[], on: (v: string) => void, placeholder?: string, searchable?: boolean) => (
        <Dropdownbox name={name} value={value} options={options} placeholder={placeholder} searchable={searchable}
            rounded="rounded-md" compact onChange={(e) => on(e.target.value)} />
    );

    const onPreset = (s: Signal, v: string) => {
        const p = signalPresets.find((x) => x.value === v);
        setSig(s.uid, { preset: v, ...(v ? { signalId: v, label: s.label || (p?.label ?? "") } : {}) });
    };
    const onWeightType = (s: Signal, v: WeightType) =>
        setSig(s.uid, { weightType: v, value: "", cap: "", divisor: "", multiplier: "", reference: "", trigger: "" });

    const submit = async () => {
        const e: Errors = {};
        if (!f.providerId) e.providerId = "Provider ID is required";
        if (!f.offerType) e.offerType = "Offer type is required";
        if (!f.name.trim()) e.name = "Config name is required";
        const sh = num(f.show), rv = num(f.review), hd = num(f.hide);
        if (!(sh >= rv && rv >= hd)) e.show = "Must satisfy Show ≥ Review ≥ Hide";
        const seen = new Set<string>();
        f.signals.forEach((s) => {
            const k = `${s.uid}.signalId`, sid = s.signalId.trim();
            if (!sid) e[k] = "Signal ID is required";
            else if (!/^[a-z0-9_]+$/.test(sid)) e[k] = "Use lowercase letters, numbers and underscores only";
            else if (seen.has(sid)) e[k] = "Signal ID must be unique";
            seen.add(sid);
        });
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        setSaving(true);
        try {
            if (initial) await engineConfigsService.update(initial.id, f);
            else await engineConfigsService.create(f);
            toast(isEdit ? "Config updated" : "Config created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const text = (s: Signal, key: keyof Signal, label: string) => (
        <Field label={label}>
            <TextInput value={String(s[key])} onChange={(e) => setSig(s.uid, { [key]: e.target.value } as Partial<Signal>)} />
        </Field>
    );

    return (
        <div className="flex flex-col gap-4">
            {apiError && <Alert kind="error">{apiError}</Alert>}
            <DCard title={isEdit ? "Edit Engine Configuration" : "Create Engine Configuration"}>
                <div className="flex flex-col gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Provider ID" required error={errors.providerId}>
                            {dd("provider", f.providerId, providers, (v) => set("providerId", v), "Select provider")}
                        </Field>
                        <Field label="Offer Type" required error={errors.offerType}>
                            {dd("offerType", f.offerType, offerTypes, (v) => set("offerType", v), "Select offer type")}
                        </Field>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Config Name" required error={errors.name}>
                            <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} />
                        </Field>
                        <Field label="Category">
                            <TextInput value={f.category} onChange={(e) => set("category", e.target.value)} />
                        </Field>
                        <Field label="Base Score"><NumInput value={f.baseScore} onChange={(v) => set("baseScore", v)} /></Field>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Status" required>
                            {dd("status", f.status, statusFormOptions, (v) => set("status", v as Status))}
                        </Field>
                    </div>
                </div>
            </DCard>

            <DCard title="Decision Thresholds">
                <div className="grid gap-5 md:grid-cols-3">
                    <Field label="Show ≥" error={errors.show}><NumInput value={f.show} onChange={(v) => set("show", v)} /></Field>
                    <Field label="Review ≥"><NumInput value={f.review} onChange={(v) => set("review", v)} /></Field>
                    <Field label="Hide"><NumInput value={f.hide} onChange={(v) => set("hide", v)} /></Field>
                </div>
            </DCard>

            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Signals</h3>
                {f.signals.map((s, i) => (
                    <section key={s.uid} className="rounded-xl border border-line bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-ink">Signal {i + 1}</span>
                            <button type="button" onClick={() => set("signals", f.signals.filter((x) => x.uid !== s.uid))}
                                className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                                Remove
                            </button>
                        </div>
                        <div className="flex flex-col gap-5">
                            <Field label="Select Signal" className="md:max-w-[33%]">
                                {dd(`preset-${s.uid}`, s.preset, signalPresets, (v) => onPreset(s, v), "Select signal", true)}
                            </Field>
                            <div className="grid gap-5 md:grid-cols-3">
                                <Field label="Signal ID" required error={errors[`${s.uid}.signalId`]}>
                                    <TextInput value={s.signalId} onChange={(e) => setSig(s.uid, { signalId: e.target.value })} />
                                </Field>
                                {text(s, "label", "Label")}
                                <Field label="Min Count"><NumInput value={s.minCount} onChange={(v) => setSig(s.uid, { minCount: v })} /></Field>
                            </div>

                            <div>
                                <p className="mb-2 text-sm text-muted">Match (comma-separated)</p>
                                <div className="grid gap-5 md:grid-cols-3">
                                    {text(s, "topCategory", "Top Category")}
                                    {text(s, "code", "Code")}
                                    {text(s, "mcc", "MCC")}
                                    {text(s, "keywords", "Keywords")}
                                    {text(s, "sameAs", "Same As (signal id)")}
                                    {text(s, "flags", "Flags")}
                                    {text(s, "contextField", "Context Field")}
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-sm text-muted">Weight</p>
                                <div className="grid gap-5 md:grid-cols-4">
                                    <Field label="Type" required>
                                        {dd(`wt-${s.uid}`, s.weightType, weightTypes, (v) => onWeightType(s, v as WeightType))}
                                    </Field>
                                    {(weightFields[s.weightType] ?? []).map((w) => (
                                        <Field key={w.key} label={w.label}>
                                            <NumInput value={s[w.key]} onChange={(v) => setSig(s.uid, { [w.key]: v } as Partial<Signal>)} />
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
                <div>
                    <button type="button" onClick={() => set("signals", [...f.signals, blankSignal()])}
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gray-200">+ Add Signal</button>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
            </div>
        </div>
    );
}
export default function EngineConfigManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<EngineConfig | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        engineConfigsService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <EngineConfigForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <EngineConfigForm initial={rec} />;
}