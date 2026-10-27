import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { btn, ColorField, Field, FileInput, HexNote, Section, TextInput } from "@/components/catalog/FormBits";
import { DCard } from "@/components/catalog/DetailBits";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import type { Status } from "@/data/catalog";
import { isHex, statusFormOptions } from "@/utils/catalog";
import { imageError, noLead, textError } from "@/utils/validate";
import {
    COLOR_FIELDS, productTemplatesService, TemplateError, type TemplateInput, type TemplateRec,
} from "@/services/productTemplates.service";
import { BASE } from "./List";

type Form = TemplateInput;

// Limits: change here
const NAME_MAX = 60;
const ORDER = ["name", "status", "bgImage", "frontImage", ...COLOR_FIELDS.map((c) => c.key)];
const oneSpace = (s: string) => noLead(s).replace(/\s{2,}/g, " "); // no leading or double spaces

function validate(f: Form) {
    const e: Record<string, string> = {};
    e.name = textError("Template name", f.name, 3, NAME_MAX);
    if (!f.status) e.status = "Status is required";
    e.bgImage = imageError(f.bgImage);
    e.frontImage = imageError(f.frontImage);
    for (const c of COLOR_FIELDS) {
        if (f[c.key] && !isHex(f[c.key])) e[c.key] = `${c.label} must be a valid HEX code, e.g. #000000`;
    }
    Object.keys(e).forEach((k) => { if (!e[k]) delete e[k]; });
    return e;
}

const blank: Form = {
    name: "", status: "Active", bgImage: null, frontImage: null,
    cardBg: "", buttonBg: "", buttonText: "", textPrimary: "", textSecondary: "",
};

function useFileUrl(file: File | null) {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
    return url;
}

function TemplateForm({ initial }: { initial?: TemplateRec }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [f, setF] = useState<Form>(initial ? {
        name: initial.name, status: initial.status, bgImage: null, frontImage: null,
        cardBg: initial.cardBg, buttonBg: initial.buttonBg, buttonText: initial.buttonText,
        textPrimary: initial.textPrimary, textSecondary: initial.textSecondary,
    } : blank);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const bgUrl = useFileUrl(f.bgImage);
    const frontUrl = useFileUrl(f.frontImage);
    const shownBg = bgUrl ?? initial?.bgImageUrl ?? "";
    const shownFront = frontUrl ?? initial?.frontImageUrl ?? "";

    const errors = validate(f);
    const err = (k: string) => (touched[k] || submitted ? errors[k] || serverErrors[k] || "" : "");
    const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));
    const focus = (k: string) => {
        const el = document.getElementById(`tpl-${k}`);
        const target = el?.matches("input,button,textarea,select") ? el : el?.querySelector<HTMLElement>("input,button");
        target?.focus();
    };

    const set = <K extends keyof Form>(k: K, v: Form[K]) => {
        setF((p) => ({ ...p, [k]: v }));
        touch(k);
        setServerErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    };

    const submit = async () => {
        setSubmitted(true);
        setApiError("");
        const first = ORDER.find((k) => errors[k]);
        if (first) return focus(first);
        setSaving(true);
        try {
            if (initial) await productTemplatesService.update(initial.id, f);
            else await productTemplatesService.create(f);
            toast(isEdit ? "Template updated" : "Template created");
            nav(BASE);
        } catch (e) {
            if (e instanceof TemplateError) { setServerErrors({ [e.field]: e.message }); focus(e.field); }
            else setApiError(e instanceof Error ? e.message : "Save failed");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <DCard title={isEdit ? "EDIT PRODUCT TEMPLATE" : "CREATE PRODUCT TEMPLATE"}>
                {apiError && <Alert kind="error">{apiError}</Alert>}
                <div className="flex flex-col gap-5">
                    <Section n={1} title="Basic Info">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Template Name" required error={err("name")}>
                                <TextInput id="tpl-name" value={f.name} maxLength={NAME_MAX} placeholder='e.g. "FinancialConnect"'
                                    onChange={(e) => set("name", oneSpace(e.target.value))}
                                    onBlur={() => { touch("name"); if (f.name !== f.name.trim()) set("name", f.name.trim()); }} />
                            </Field>
                            <Field label="Status" required error={err("status")}>
                                <div id="tpl-status">
                                    <Dropdownbox name="status" value={f.status} options={statusFormOptions} placeholder="Select Status"
                                        rounded="rounded-md" buttonClassName="min-h-10" error={err("status")}
                                        onChange={(e) => set("status", e.target.value as Status)} />
                                </div>
                            </Field>
                        </div>
                    </Section>

                    <Section n={2} title="Template Information">
                        <div className="flex flex-col gap-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Background Image" error={err("bgImage")} note="Upload a JPEG, PNG or WEBP image that is less than 2 MB.">
                                    <div id="tpl-bgImage">
                                        <FileInput accept="image/png,image/jpeg,image/webp" file={f.bgImage} onChange={(file) => set("bgImage", file)} />
                                    </div>
                                    {shownBg && <img src={shownBg} alt="Background preview" onError={(e) => { e.currentTarget.style.display = "none"; }} className="mt-3 h-24 rounded-md border border-line bg-white object-contain" />}
                                </Field>
                                <Field label="Front Image" error={err("frontImage")} note="Upload a JPEG, PNG or WEBP image that is less than 2 MB.">
                                    <div id="tpl-frontImage">
                                        <FileInput accept="image/png,image/jpeg,image/webp" file={f.frontImage} onChange={(file) => set("frontImage", file)} />
                                    </div>
                                    {shownFront && <img src={shownFront} alt="Front preview" onError={(e) => { e.currentTarget.style.display = "none"; }} className="mt-3 h-24 rounded-md border border-line bg-white object-contain" />}
                                </Field>
                            </div>
                            <div className="grid gap-5 md:grid-cols-3">
                                {COLOR_FIELDS.map((c) => (
                                    <Field key={c.key} label={c.label} note={HexNote} error={err(c.key)}>
                                        <div id={`tpl-${c.key}`} onBlur={() => touch(c.key)}>
                                            <ColorField value={f[c.key]} onChange={(v) => set(c.key, v.replace(/\s/g, ""))} />
                                        </div>
                                    </Field>
                                ))}
                            </div>
                        </div>
                    </Section>
                </div>
            </DCard>
            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
            </div>
        </div>
    );
}

export default function ProductTemplatesManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<TemplateRec | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        productTemplatesService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <TemplateForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <TemplateForm initial={rec} />;
}