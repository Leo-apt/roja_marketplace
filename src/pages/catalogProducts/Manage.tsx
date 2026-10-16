import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import Tabs from "@/components/shared/Tabs";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { bundlesService } from "@/services/bundles.service";
import { categoriesService } from "@/services/categories.service";
import { PLACEMENT_OPTIONS, productsService, ymd, type ProductInput, type ProductRec } from "@/services/products.service";
import { DCard, Grid, KV } from "@/components/catalog/DetailBits";
import RichTextEditor from "@/components/catalog/RichTextEditor";
import { engineConfigsService } from "@/services/engineConfigs.service";
import {
    btn, Check, Field, MoneyInput, MultiSelect, RadioCard, Section, Stepper, TextArea, TextInput,
} from "@/components/catalog/FormBits";
import { productTemplates, type Status } from "@/data/catalog";
import { calcMargin, discountTypeFormOptions, isHex, num, sellingPrice, statusFormOptions, usd, type DiscountType } from "@/utils/catalog";

const BASE = "/catalog/products";
const TODAY = ymd(new Date().toISOString());
const STEPS = ["Overview", "Content", "Pricing & Bundle", "Audience", "Placement", "Preview"];
const markupTypes = [{ value: "flat", label: "$ Flat" }, { value: "percent", label: "% Percent" }];

interface Form {
    name: string; categoryId: string; providerId: string; status: Status;
    termsFile: File | null; imageFile: File | null; imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    retail: string; discountType: DiscountType; discountValue: string; bundleIds: string[];
    wholesale: string; markupType: "flat" | "percent"; markupValue: string;
    audience: "everyone" | "provider"; productConfig: string;
    placements: string[]; freqCap: string; publish: "now" | "later"; availableFrom: string; expires: boolean; expiresOn: string;
}
type Errors = Record<string, string>;

const empty: Form = {
    name: "", categoryId: "", providerId: "", status: "Active",
    termsFile: null, imageFile: null, imageBg: "", shortDescription: "", longDescription: "", pricingContent: "",
    template: "", dashTitle: "", cta: "", featureTitle: "", dashShort: "",
    retail: "", discountType: "fixed", discountValue: "", bundleIds: [],
    wholesale: "", markupType: "flat", markupValue: "",
    audience: "everyone", productConfig: "", placements: [], freqCap: "", publish: "now", availableFrom: "", expires: false, expiresOn: "",
};

interface FormProps {
    initial?: ProductRec;
    categories: { id: string; name: string }[];
    bundleOpts: { id: string; label: string }[];
}

const fromRec = (r: ProductRec): Form => ({
    ...empty,
    name: r.name, categoryId: r.categoryId, providerId: r.providerId,
    status: r.status === "Inactive" ? "Inactive" : "Active", // UI only: the API sets status itself
    imageBg: r.imageBg, shortDescription: r.shortDescription, longDescription: r.longDescription, pricingContent: r.pricingContent,
    template: r.template, dashTitle: r.dashTitle, cta: r.cta, featureTitle: r.featureTitle, dashShort: r.dashShort,
    retail: r.retail == null ? "" : String(r.retail), discountType: r.discountType || "fixed",
    discountValue: r.discountValue == null ? "" : String(r.discountValue), bundleIds: r.bundles.map((b) => b.id),
    wholesale: r.wholesale == null ? "" : String(r.wholesale), markupType: r.markupType,
    markupValue: r.markupValue == null ? "" : String(r.markupValue),
    audience: r.audience, productConfig: r.configurationId, placements: r.placements, freqCap: r.freqCap == null ? "" : String(r.freqCap),
    publish: r.publish, availableFrom: r.availableFrom, expires: !!r.expiresOn, expiresOn: r.expiresOn,
});

function ProductForm({ initial, categories, bundleOpts }: FormProps) {
    const nav = useNavigate();
    const { toast, toastError } = useApp();
    const isEdit = !!initial;
    const [savedId, setSavedId] = useState(initial?.id ?? "");
    const [f, setF] = useState<Form>(initial ? fromRec(initial) : empty);
    const [step, setStep] = useState(0);
    const [tab, setTab] = useState("market");
    const [errors, setErrors] = useState<Errors>({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState<"" | "draft" | "publish">("");
    const [opts, setOpts] = useState(bundleOpts);
    const [cfgOpts, setCfgOpts] = useState<{ value: string; label: string }[]>(
        initial?.configurationId ? [{ value: initial.configurationId, label: initial.configurationName || initial.configurationId }] : [],
    );
    const [cfgLoading, setCfgLoading] = useState(false);
    const [cfgLoaded, setCfgLoaded] = useState(false);
    const loadConfigs = () => {
        if (cfgLoaded || cfgLoading) return; // call the API only once
        setCfgLoading(true);
        engineConfigsService.list()
            .then((rows) => { setCfgOpts(rows.map((c) => ({ value: c.id, label: c.name }))); setCfgLoaded(true); })
            .catch((err) => toastError(err instanceof Error ? err.message : "Failed to load configurations"))
            .finally(() => setCfgLoading(false));
    };

    const imgUrl = useMemo(() => (f.imageFile ? URL.createObjectURL(f.imageFile) : null), [f.imageFile]);
    useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl); }, [imgUrl]);

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
    const selling = sellingPrice(num(f.retail), f.discountType, num(f.discountValue));
    const m = calcMargin(num(f.wholesale), num(f.retail), num(f.markupValue), f.markupType);
    const catName = categories.find((c) => c.id === f.categoryId)?.name ?? "-";

    const validate = (s: number): Errors => {
        const e: Errors = {};
        if (s === 0) {
            if (!f.name.trim()) e.name = "Product name is required";
            if (!f.categoryId) e.categoryId = "Product category is required";
            if (f.providerId.trim() && !/^[a-f0-9]{24}$/i.test(f.providerId.trim())) e.providerId = "Provider ID must be a valid 24-character id";
        }
        if (s === 1) {
            const plain = (h: string) => h.replace(/<[^>]*>/g, "").trim();
            // 1) Marketplace fields first
            if (f.imageBg && !isHex(f.imageBg)) e.imageBg = "Enter a valid HEX code";
            if (!f.shortDescription.trim()) e.mShort = "Short Description is required";
            if (!plain(f.longDescription)) e.mLong = "Long Description is required";
            if (!f.pricingContent.trim()) e.mPricing = "Pricing / Renewal Content is required";
            // 2) Dashboard fields are checked only when Marketplace is fully valid
            if (!Object.keys(e).length) {
                if (!f.template) e.dTemplate = "Template is required";
                if (!f.dashTitle.trim()) e.dTitle = "Title is required";
                if (!f.cta.trim()) e.dCta = "Call to Action is required";
                if (!f.featureTitle.trim()) e.dFeature = "Feature Title is required";
                if (!f.dashShort.trim()) e.dShort = "Short Description is required";
            }
        }
        if (s === 2) {
            if (!f.retail.trim()) e.retail = "Retail price is required";
            const dv = num(f.discountValue);
            if (dv > 0 && f.discountType === "percent" && dv > 100) e.discountValue = "Percentage cannot exceed 100";
            if (dv > 0 && f.discountType === "fixed" && dv > num(f.retail)) e.discountValue = "Discount cannot be more than the retail price";
            if (!f.wholesale.trim() || num(f.wholesale) < 0.01) e.wholesale = "Wholesale price must be at least 0.01";
            if (!f.markupValue.trim()) e.markup = "Roja markup is required";
            if (!e.retail && !e.wholesale && !e.markup && m.margin < 0) e.markup = "Margin vs. retail cannot be negative. Lower the markup or raise the retail price.";
        }
        if (s === 3 && f.audience === "provider" && !f.productConfig) e.productConfig = "Product configuration is required";
        if (s === 4) {
            if (!f.placements.length) e.placements = "Select at least one placement";
            if (!f.freqCap.trim() || num(f.freqCap) < 1) e.freqCap = "Enter a frequency cap of 1 or more";
            if (f.publish === "later") {
                if (!f.availableFrom) e.availableFrom = "Available from date is required";
                if (f.expires && !f.expiresOn) e.expiresOn = "Expiry date is required";
            }
        }
        return e;
    };

    const marketKeys = ["imageBg", "mShort", "mLong", "mPricing"];
    const dashKeys = ["dTemplate", "dTitle", "dCta", "dFeature", "dShort"];
    const marketHasError = marketKeys.some((k) => errors[k]);
    const dashHasError = dashKeys.some((k) => errors[k]);
    const showErrorTab = (e: Errors) => {
        if (marketKeys.some((k) => e[k])) setTab("market");
        else if (dashKeys.some((k) => e[k])) setTab("dashboard");
    };

    const next = () => {
        const e = validate(step);
        setErrors(e);
        if (Object.keys(e).length) showErrorTab(e);
        else setStep((s) => s + 1);
    };
    const saveLabel = isEdit && initial?.status !== "Draft" ? "Save Changes" : "Save Draft";
    const canPublish = !(isEdit && initial?.status === "Active");

    const save = async (publish: boolean) => {
        for (const s of publish ? [0, 1, 2, 3, 4] : [0, 1]) {
            const e = validate(s);
            if (Object.keys(e).length) { setErrors(e); setStep(s); showErrorTab(e); return; }
        }
        setErrors({});
        setApiError("");
        setBusy(publish ? "publish" : "draft");
        try {
            const input: ProductInput = { ...f, bundleIds: f.bundleIds.filter((b) => !b.startsWith("local:")) };
            let id = savedId;
            if (id) await productsService.update(id, input);
            else {
                id = (await productsService.create(input)).id;
                setSavedId(id); // a later retry updates this product instead of creating a duplicate
            }
            if (publish) await productsService.publish(id);
            const skipped = f.bundleIds.length - input.bundleIds.length;
            toast((publish ? "Product published" : "Product saved") + (skipped ? ` (${skipped} new bundle name(s) were not saved — create them in Bundles first)` : ""));
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setBusy("");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };
    const dd = (name: string, value: string, options: { value: string; label: string }[], on: (v: string) => void, placeholder?: string) => (
        <Dropdownbox name={name} value={value} options={options} placeholder={placeholder} rounded="rounded-md" compact onChange={(e) => on(e.target.value)} />
    );

    return (
        <div className="flex flex-col gap-4">
            {apiError && <Alert kind="error">{apiError}</Alert>}
            <Stepper steps={STEPS} current={step} onGo={(i) => { setErrors({}); setStep(i); }} />

            {step === 0 && (
                <Section n={1} title="Overview" subtitle="Basic product identity.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Product Name" required error={errors.name}>
                            <TextInput value={f.name} placeholder="e.g. Financial +" onChange={(e) => set("name", e.target.value)} />
                        </Field>
                        <Field label="Product Category" required error={errors.categoryId}>
                            {dd("category", f.categoryId, categories.map((c) => ({ value: c.id, label: c.name })), (v) => set("categoryId", v), "Select category")}
                        </Field>
                        <Field label="Provider ID" error={errors.providerId}>
                            <TextInput value={f.providerId} placeholder="e.g. PRV-1000" onChange={(e) => set("providerId", e.target.value)} />
                        </Field>
                        <Field label="Status" required>
                            {dd("status", f.status, statusFormOptions, (v) => set("status", v as Status))}
                        </Field>
                    </div>
                </Section>
            )}

            {step === 1 && (
                <Section n={2} title="Content" subtitle="Marketplace and dashboard copy.">
                    <div className="-mx-1 mb-5">
                        <Tabs
                            tabs={[
                                ["market", marketHasError ? "Marketplace ⚠ Required fields missing" : "Marketplace"],
                                ["dashboard", dashHasError ? "Dashboard ⚠ Required fields missing" : "Dashboard"],
                            ]}
                            value={tab} onChange={setTab} label="Content tabs" />
                    </div>
                    {tab === "market" ? (
                        <div className="flex flex-col gap-5">
                            <h3 className="text-sm font-bold text-ink">Marketplace Content</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Product Template" required error={errors.dTemplate}>
                                    {dd("template", f.template, productTemplates.map((t) => ({ value: t, label: t })), (v) => set("template", v), "Select template")}
                                </Field>
                                <Field label="Title" required error={errors.dTitle}>
                                    <TextInput maxLength={100} value={f.dashTitle} onChange={(e) => set("dashTitle", e.target.value)} />
                                </Field>
                                <Field label="Call to Action" required error={errors.dCta}>
                                    <TextInput maxLength={50} value={f.cta} onChange={(e) => set("cta", e.target.value)} />
                                </Field>
                                <Field label="Feature Title" required error={errors.dFeature}>
                                    <TextInput maxLength={100} value={f.featureTitle} onChange={(e) => set("featureTitle", e.target.value)} />
                                </Field>
                            </div>
                            <Field label="Short Description" required error={errors.mShort}>
                                <TextArea rows={3} maxLength={300} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
                            </Field>
                            <Field label="Long Description" required error={errors.mLong}>
                                <RichTextEditor value={f.longDescription} onChange={(v) => set("longDescription", v)} />
                            </Field>
                            <Field label="Pricing / Renewal Content" required error={errors.mPricing}>
                                <TextArea rows={3} value={f.pricingContent} onChange={(e) => set("pricingContent", e.target.value)} />
                            </Field>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <h3 className="text-sm font-bold text-ink">Dashboard Content</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Product Template">
                                    {dd("template", f.template, productTemplates.map((t) => ({ value: t, label: t })), (v) => set("template", v), "Select template")}
                                </Field>
                                <Field label="Title"><TextInput value={f.dashTitle} onChange={(e) => set("dashTitle", e.target.value)} /></Field>
                                <Field label="Call to Action"><TextInput value={f.cta} onChange={(e) => set("cta", e.target.value)} /></Field>
                                <Field label="Feature Title"><TextInput value={f.featureTitle} onChange={(e) => set("featureTitle", e.target.value)} /></Field>
                            </div>
                            <Field label="Short Description">
                                <TextArea rows={3} value={f.dashShort} onChange={(e) => set("dashShort", e.target.value)} />
                            </Field>
                        </div>
                    )}
                </Section>
            )}

            {step === 2 && (
                <Section n={3} title="Pricing & Bundle" subtitle="Retail price, discount and bundled features.">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Retail Price" required error={errors.retail}>
                            <MoneyInput value={f.retail} onChange={(v) => set("retail", v)} />
                        </Field>
                        <Field label="Discount" error={errors.discountValue}>
                            <div className="grid grid-cols-2 gap-2">
                                {dd("dtype", f.discountType, discountTypeFormOptions, (v) => set("discountType", v as DiscountType))}
                                <MoneyInput prefix={f.discountType === "percent" ? "%" : "$"} value={f.discountValue}
                                    placeholder={f.discountType === "percent" ? "e.g. 10" : "e.g. 2.00"} onChange={(v) => set("discountValue", v)} />
                            </div>
                        </Field>
                        <Field label="Selling Price">
                            <MoneyInput value={selling.toFixed(2)} readOnly />
                        </Field>
                        <div className="hidden md:block" />
                        <Field label="Wholesale Price" required error={errors.wholesale}>
                            <MoneyInput value={f.wholesale} onChange={(v) => set("wholesale", v)} />
                        </Field>
                        <Field label="Roja Markup" required error={errors.markup}>
                            <div className="grid grid-cols-2 gap-2">
                                {dd("mtype", f.markupType, markupTypes, (v) => set("markupType", v as "flat" | "percent"))}
                                <MoneyInput prefix={f.markupType === "percent" ? "%" : "$"} value={f.markupValue}
                                    onChange={(v) => set("markupValue", v)} />
                            </div>
                        </Field>
                        <Field label="Roja Buy Rate"><MoneyInput value={m.buy.toFixed(2)} readOnly /></Field>
                        <Field label="Margin vs. Retail" note={m.margin < 0 ? `Negative margin: ${usd(m.margin)}` : undefined}>
                            <MoneyInput value={m.margin.toFixed(2)} readOnly />
                        </Field>
                        <Field label="Bundled" className="md:col-span-2">
                            <MultiSelect
                                options={opts.map((o) => o.label)}
                                values={f.bundleIds.map((b) => opts.find((o) => o.id === b)?.label ?? b.replace("local:", ""))}
                                onChange={(labels) => set("bundleIds", labels.map((l) => opts.find((o) => o.label === l)?.id ?? `local:${l}`))}
                                onAddOption={(l) => setOpts((o) => [...o, { id: `local:${l}`, label: l }])} />
                        </Field>
                    </div>
                </Section>
            )}

            {step === 3 && (
                <Section n={4} title="Audience Strategy" subtitle="Who can see this product.">
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <RadioCard name="aud" title="Everyone" note="No promotional targeting rules. Available to all customers."
                                checked={f.audience === "everyone"} onChange={() => setF((p) => ({ ...p, audience: "everyone", productConfig: "" }))} />
                            <RadioCard name="aud" title="Provider rules" note="Available only to selected customers identified by the ML engine based on transaction signals."
                                checked={f.audience === "provider"} onChange={() => set("audience", "provider")} />
                        </div>
                        {f.audience === "provider" && (
                            <Field label="Product Configuration" required error={errors.productConfig} className="md:max-w-[50%]">
                                <Dropdownbox name="config" value={f.productConfig} options={cfgOpts} placeholder="Select configuration"
                                    rounded="rounded-md" compact loading={cfgLoading} onOpen={loadConfigs}
                                    onChange={(e) => set("productConfig", e.target.value)} />
                            </Field>
                        )}
                    </div>
                </Section>
            )}

            {step === 4 && (
                <Section n={5} title="Placement" subtitle="Where and when this product is shown.">
                    <div className="flex flex-col gap-6">
                        <Field label="Placements" required error={errors.placements}>
                            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                                {PLACEMENT_OPTIONS.map((o) => (
                                    <Check key={o.value} label={o.label} checked={f.placements.includes(o.value)}
                                        onChange={(on) => set("placements", on ? [...f.placements, o.value] : f.placements.filter((x) => x !== o.value))} />
                                ))}
                            </div>
                        </Field>
                        <Field label="Per-user frequency cap" required error={errors.freqCap} className="md:max-w-[50%]">
                            <TextInput inputMode="numeric" value={f.freqCap} placeholder="e.g. 3"
                                onChange={(e) => set("freqCap", e.target.value.replace(/\D/g, ""))} />
                        </Field>
                        <Field label="Publishing Schedule">
                            <div className="grid gap-3 md:grid-cols-2">
                                <RadioCard name="pub" title="Publish immediately" note="The product will be available as soon as it is published."
                                    checked={f.publish === "now"} onChange={() => setF((p) => ({ ...p, publish: "now", availableFrom: "", expires: false, expiresOn: "" }))} />
                                <RadioCard name="pub" title="Schedule for later" note="Pick the exact date and time this product should become available."
                                    checked={f.publish === "later"} onChange={() => set("publish", "later")} />
                            </div>
                        </Field>
                        {f.publish === "later" && (
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Available From" required error={errors.availableFrom}>
                                    <DatePicker value={f.availableFrom} minDate={TODAY} placeholder="Select date" onChange={(v) => set("availableFrom", v)} />
                                </Field>
                                <div className="flex flex-col gap-2">
                                    <Check label="Expires" checked={f.expires} onChange={(on) => setF((p) => ({ ...p, expires: on, expiresOn: on ? p.expiresOn : "" }))} />
                                    {f.expires && (
                                        <Field label="Expires On" required error={errors.expiresOn}>
                                            <DatePicker value={f.expiresOn} minDate={f.availableFrom || TODAY} placeholder="Select date" onChange={(v) => set("expiresOn", v)} />
                                        </Field>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Section>
            )}

            {step === 5 && (
                <Section n={6} title="Preview" subtitle="Review everything before submitting.">
                    <div className="flex flex-col gap-5">
                        <div className="max-w-sm overflow-hidden rounded-xl border border-line">
                            <div className="grid h-40 place-items-center" style={{ background: isHex(f.imageBg) ? f.imageBg : "#eef2fa" }}>
                                {imgUrl ? <img src={imgUrl} alt="Product" className="h-full w-full object-contain" /> : <span className="text-xs text-muted">No image uploaded</span>}
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-muted">{catName}</p>
                                <h4 className="text-base font-bold text-ink">{f.name || "-"}</h4>
                                <p className="mt-1 text-xs text-[#3c4d66]">{f.shortDescription || "-"}</p>
                                <p className="mt-2 text-sm font-bold text-ink">
                                    {usd(selling)} {selling !== num(f.retail) && <s className="ml-1 text-xs font-normal text-muted">{usd(num(f.retail))}</s>}
                                </p>
                            </div>
                        </div>

                        <DCard title="Overview">
                            <Grid>
                                <KV k="Product Name">{f.name || "-"}</KV><KV k="Category">{catName}</KV>
                                <KV k="Provider ID">{f.providerId || "-"}</KV><KV k="Status">{f.status}</KV>
                            </Grid>
                        </DCard>
                        <DCard title="Marketplace Content">
                            <Grid one>
                                <KV k="Terms & Conditions">{f.termsFile?.name ?? "-"}</KV>
                                <KV k="Image Background">{f.imageBg || "-"}</KV>
                                <KV k="Long Description"><div className="[&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: f.longDescription || "-" }} /></KV>
                                <KV k="Pricing / Renewal">{f.pricingContent || "-"}</KV>
                            </Grid>
                        </DCard>
                        <DCard title="Dashboard Content">
                            <Grid>
                                <KV k="Template">{f.template || "-"}</KV><KV k="Title">{f.dashTitle || "-"}</KV>
                                <KV k="Call to Action">{f.cta || "-"}</KV><KV k="Feature Title">{f.featureTitle || "-"}</KV>
                                <KV k="Short Description">{f.dashShort || "-"}</KV>
                            </Grid>
                        </DCard>
                        <DCard title="Pricing & Bundle">
                            <Grid>
                                <KV k="Retail Price">{usd(num(f.retail))}</KV>
                                <KV k="Discount">{f.discountValue ? (f.discountType === "percent" ? `${f.discountValue}%` : usd(num(f.discountValue))) : "No discount"}</KV>
                                <KV k="Selling Price">{usd(selling)}</KV><KV k="Bundled">{f.bundleIds.map((b) => opts.find((o) => o.id === b)?.label ?? b.replace("local:", "")).join(", ") || "-"}</KV>
                            </Grid>
                        </DCard>
                        <DCard title="Audience & Placement">
                            <Grid>
                                <KV k="Audience">{f.audience === "everyone" ? "Everyone" : "Provider rules"}</KV>
                                <KV k="Configuration">{cfgOpts.find((o) => o.value === f.productConfig)?.label ?? (f.productConfig || "-")}</KV>
                                <KV k="Placements">{f.placements.map((p) => PLACEMENT_OPTIONS.find((o) => o.value === p)?.label ?? p).join(", ") || "-"}</KV><KV k="Frequency Cap">{f.freqCap || "-"}</KV>
                                <KV k="Publishing">{f.publish === "now" ? "Publish immediately" : `From ${f.availableFrom || "-"}`}</KV>
                                <KV k="Expires On">{f.expires ? f.expiresOn || "-" : "Never"}</KV>
                            </Grid>
                        </DCard>
                    </div>
                </Section>
            )}

            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)}>Cancel</button>
                {step > 0 && <button className={btn.secondary} onClick={() => { setErrors({}); setStep((s) => s - 1); }}>Back</button>}
                {step < STEPS.length - 1
                    ? <button className={btn.primary} onClick={next}>Next</button>
                    : (
                        <>
                            <button className={btn.secondary} disabled={!!busy} onClick={() => save(false)}>
                                {busy === "draft" ? "Saving…" : saveLabel}
                            </button>
                            {canPublish && (
                                <button className={btn.primary} disabled={!!busy} onClick={() => save(true)}>
                                    {busy === "publish" ? "Publishing…" : "Publish"}
                                </button>
                            )}
                        </>
                    )}
            </div>
        </div>
    );
}

export default function CatalogProductsManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [data, setData] = useState<{ rec?: ProductRec; cats: { id: string; name: string }[]; opts: { id: string; label: string }[] } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAdmin) return;
        let live = true;
        Promise.all([
            categoriesService.list(),
            bundlesService.list(1, 100),
            id ? productsService.get(id) : Promise.resolve(undefined),
        ])
            .then(([cats, bs, rec]) => {
                if (!live) return;
                const c = cats.map((x) => ({ id: x.id, name: x.name }));
                if (rec && rec.categoryId && !c.some((x) => x.id === rec.categoryId)) c.push({ id: rec.categoryId, name: rec.categoryName });
                setData({ rec, cats: c, opts: bs.rows.map((b) => ({ id: b.id, label: `${b.name} (${b.shortCode})` })) });
            })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!data || (id && data.rec?.id !== id)) return <LoadingBox />;
    return <ProductForm key={id ?? "new"} initial={data.rec} categories={data.cats} bundleOpts={data.opts} />;
}