import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, Field, fixed2, money2, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { noLead, priceError, textError } from "@/utils/validate";
import { SignalError, signalsService, toNumStrings, WEIGHT_FIELDS, WEIGHT_TYPES, type SignalInput, type SignalRec } from "@/services/signals.service";
import { BASE } from "./List";

type Form = SignalInput;

// Limits: change here
const ID_MAX = 50, LABEL_MAX = 60, MIN_COUNT_MAX = 100000, NUM_MAX = 99999.99;
const ID_RE = /^[a-z][a-z0-9_]*$/;
const ORDER = ["signalId", "label", "minCount", "topCategory", "code", "mcc", "keywords", "sameAs", "weightType"];

const cleanId = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, ID_MAX); // no spaces or symbols
const oneSpace = (s: string) => noLead(s).replace(/\s{2,}/g, " ");

const idError = (label: string, v: string, required: boolean) =>
    textError(label, v, 2, ID_MAX, required) ||
    (v && !ID_RE.test(v) ? `${label} must start with a letter and use only lowercase letters, numbers and underscores` : "");

function validate(f: Form) {
    const e: Record<string, string> = {};
    e.signalId = idError("Signal ID", f.signalId, true);
    e.label = textError("Signal Label", f.label, 2, LABEL_MAX);
    if (f.minCount) {
        const n = Number(f.minCount);
        if (n < 1) e.minCount = "Minimum Count must be at least 1";
        else if (n > MIN_COUNT_MAX) e.minCount = `Minimum Count cannot be more than ${MIN_COUNT_MAX}`;
    }
    e.sameAs = idError("Same As", f.sameAs, false);
    if (!f.weightType) e.weightType = "Type is required";
    for (const w of WEIGHT_FIELDS[f.weightType] ?? []) {
        const m = priceError(w.label, f[w.key], { required: true, min: w.min, max: NUM_MAX });
        if (m) e[w.key] = m;
    }
    Object.keys(e).forEach((k) => { if (!e[k]) delete e[k]; });
    return e;
}

const blank: Form = {
    signalId: "", label: "", minCount: "", topCategory: "", code: "", mcc: "", keywords: "",
    sameAs: "", weightType: WEIGHT_TYPES[0].value,
    weightValue: "", cap: "", divisor: "", multiplier: "", reference: "", trigger: "",
};

function SignalForm({ initial }: { initial?: SignalRec }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [f, setF] = useState<Form>(initial ? {
        signalId: initial.signalId, label: initial.label, minCount: initial.minCount == null ? "" : String(initial.minCount),
        topCategory: initial.topCategory.join(", "), code: initial.code.join(", "), mcc: initial.mcc.join(", "), keywords: initial.keywords.join(", "),
        sameAs: initial.sameAs, weightType: initial.weightType, ...toNumStrings(initial),
    } : blank);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const errors = validate(f);
    const err = (k: string) => (touched[k] || submitted ? errors[k] || serverErrors[k] || "" : "");
    const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));
    const focus = (k: string) => document.getElementById(`sig-${k}`)?.focus();

    const set = <K extends keyof Form>(k: K, v: Form[K]) => {
        setF((p) => ({ ...p, [k]: v }));
        touch(k);
        setServerErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    };

    const submit = async () => {
        setSubmitted(true);
        setApiError("");
        const first = [...ORDER, ...(WEIGHT_FIELDS[f.weightType] ?? []).map((w) => w.key)].find((k) => errors[k]);
        if (first) return focus(first);
        setSaving(true);
        try {
            if (initial) await signalsService.update(initial.id, f);
            else await signalsService.create(f);
            toast(isEdit ? "Signal updated" : "Signal created");
            nav(BASE);
        } catch (e) {
            if (e instanceof SignalError) { setServerErrors({ [e.field]: e.message }); focus(e.field); }
            else setApiError(e instanceof Error ? e.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "EDIT PRODUCT ENGINE SIGNAL" : "CREATE PRODUCT ENGINE SIGNAL"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <div className="flex flex-col gap-6">
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Signal ID" required error={err("signalId")} note="Unique identifier for this signal. Used internally for references such as same_as">
                            <TextInput id="sig-signalId" value={f.signalId} maxLength={ID_MAX} placeholder="e.g. pet_spend"
                                onChange={(e) => set("signalId", cleanId(e.target.value))} onBlur={() => touch("signalId")} />
                        </Field>
                        <Field label="Signal Label" required error={err("label")} note="Friendly name describing what this signal represents.">
                            <TextInput id="sig-label" value={f.label} maxLength={LABEL_MAX}
                                onChange={(e) => set("label", oneSpace(e.target.value))} onBlur={() => { set("label", f.label.trim()); }} />
                        </Field>
                        <Field label="Minimum Count" error={err("minCount")} note="Minimum number of matching transactions required before this signal contributes to the score.">
                            <TextInput id="sig-minCount" value={f.minCount} inputMode="numeric" maxLength={6}
                                onChange={(e) => set("minCount", e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 6))} onBlur={() => touch("minCount")} />
                        </Field>
                    </div>

                    <div>
                        <p className="mb-3 text-sm text-muted">Match (Separate multiple values with commas.)</p>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            <Field label="Top Category" note="Match transactions belonging to a broad category such as Financial, Travel, or Health.">
                                <TextInput id="sig-topCategory" value={f.topCategory} maxLength={200} placeholder="Pets, Travel, Health"
                                    onChange={(e) => set("topCategory", noLead(e.target.value))} />
                            </Field>
                            <Field label="Code" note="Internal transaction category codes that identify specific transaction types">
                                <TextInput id="sig-code" value={f.code} maxLength={200} placeholder="PFS, PET"
                                    onChange={(e) => set("code", noLead(e.target.value))} />
                            </Field>
                            <Field label="MCC" note="Merchant Category Codes that should trigger this signal. Multiple values can be added.">
                                <TextInput id="sig-mcc" value={f.mcc} maxLength={200} placeholder="5995, 0742"
                                    onChange={(e) => set("mcc", noLead(e.target.value))} />
                            </Field>
                            <Field label="Keywords" note="Merchant names or text to search for in transaction descriptions (e.g., Walmart, Geico, CVS).">
                                <TextInput id="sig-keywords" value={f.keywords} maxLength={200} placeholder="petsmart, chewy"
                                    onChange={(e) => set("keywords", noLead(e.target.value))} />
                            </Field>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Same As (signal id)" error={err("sameAs")} note="Reuses the result of another signal instead of searching transactions again.">
                            <TextInput id="sig-sameAs" value={f.sameAs} maxLength={ID_MAX} placeholder="pet_spend"
                                onChange={(e) => set("sameAs", cleanId(e.target.value))} onBlur={() => touch("sameAs")} />
                        </Field>
                    </div>

                    <div>
                        <p className="mb-3 text-sm text-muted">Weight</p>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Type" required error={err("weightType")} note="The type of weight to apply to this signal.">
                                <Dropdownbox
                                    name="weightType"
                                    options={WEIGHT_TYPES}
                                    value={f.weightType}
                                    onChange={(e) => set("weightType", e.target.value)}
                                    rounded="rounded-md"
                                    buttonClassName="min-h-10"
                                    error={err("weightType")}
                                />
                            </Field>
                            {(WEIGHT_FIELDS[f.weightType] ?? []).map((w) => (
                                <Field key={w.key} label={w.label} required error={err(w.key)} note={w.note}>
                                    <TextInput id={`sig-${w.key}`} value={f[w.key]} inputMode="decimal"
                                        onChange={(e) => { const s = money2(e.target.value, NUM_MAX); if (s !== null) set(w.key, s); }}
                                        onBlur={() => { touch(w.key); const x = fixed2(f[w.key]); if (x !== f[w.key]) set(w.key, x); }} />
                                </Field>
                            ))}
                        </div>
                    </div>
                </div>
            </DCard>
            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Signals"}</button>
            </div>
        </div>
    );
}

export default function SignalsManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<SignalRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        signalsService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <SignalForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <SignalForm initial={rec} />;
}