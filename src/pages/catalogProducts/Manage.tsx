import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
import BundledSelect, { type BundleOpt } from "@/components/catalog/BundledSelect";
import BundleCreateDrawer from "@/components/catalog/BundleCreateDrawer";
import { engineConfigsService } from "@/services/engineConfigs.service";
import {
    btn, Check, ColorField, Field, FileInput, HexNote, MoneyInput, Radio, RadioCard, Section, Stepper, TextArea, TextInput,
} from "@/components/catalog/FormBits";
import { imageError, noLead, plainText, priceError, textError } from "@/utils/validate";
import { productTemplates, type Bundle, type Status } from "@/data/catalog";
import { calcMargin, discountTypeFormOptions, isHex, num, sellingPrice, statusFormOptions, usd, type DiscountType } from "@/utils/catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BASE = "/catalog/products";
const TODAY = ymd(new Date().toISOString());
const STEPS = ["Overview", "Content", "Pricing & Bundle", "Audience", "Placement", "Preview"];
const markupTypes = [{ value: "flat", label: "$ Flat" }, { value: "percent", label: "% Percent" }];

// light orange button (Back, Next, Preview)
const softOrange = "inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-orange-200 bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-200 disabled:opacity-50";

type ExpOpt = "7" | "30" | "60" | "90" | "custom" | "never";
const EXP_OPTIONS: { value: ExpOpt; label: string }[] = [
    { value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" },
    { value: "90", label: "90 days" }, { value: "custom", label: "Custom" }, { value: "never", label: "Never" },
];
// base date (yyyy-mm-dd) + n days -> yyyy-mm-dd
const addDays = (base: string, n: number) => {
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + n);
    const p = (x: number) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// providers to choose from: add { value: "<provider id>", label: "<name>" } here, or load them from the API later
const PROVIDER_OPTIONS: { value: string; label: string }[] = [];

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

// min / max characters per text field: change the numbers here
const LIMITS = {
    name: [3, 60], title: [3, 50], cta: [2, 30], feature: [3, 50], dashShort: [3, 120],
    mShort: [3, 160], long: [10, 2000], pricing: [3, 500],
} as const;
const MAX_PRICE = 99999.99;
type TextKey = "name" | "providerId" | "shortDescription" | "pricingContent" | "dashTitle" | "cta" | "featureTitle" | "dashShort";

// one rule per error key; an empty string means the field is valid
const rules: Record<string, (f: Form) => string> = {
    name: (f) => textError("Product name", f.name, ...LIMITS.name),
    categoryId: (f) => (f.categoryId ? "" : "Product category is required"),
    termsFile: (f) => imageError(f.termsFile),
    imageFile: (f) => imageError(f.imageFile),
    imageBg: (f) => (f.imageBg && !isHex(f.imageBg) ? "Enter a valid HEX code, e.g. #000000" : ""),
    mShort: (f) => textError("Short Description", f.shortDescription, ...LIMITS.mShort),
    mLong: (f) => textError("Long Description", plainText(f.longDescription), ...LIMITS.long),
    mPricing: (f) => textError("Pricing / Renewal Content", f.pricingContent, ...LIMITS.pricing),
    dTemplate: (f) => (f.template ? "" : "Template is required"),
    dTitle: (f) => textError("Title", f.dashTitle, ...LIMITS.title),
    dCta: (f) => textError("Call to Action", f.cta, ...LIMITS.cta),
    dFeature: (f) => textError("Feature Title", f.featureTitle, ...LIMITS.feature),
    dShort: (f) => textError("Short Description", f.dashShort, ...LIMITS.dashShort),
    retail: (f) => priceError("Retail price", f.retail, { required: true, min: 0.01, max: MAX_PRICE }),
    discountValue: (f) => {
        if (!f.discountValue.trim()) return "";
        const percent = f.discountType === "percent";
        const err = priceError("Discount", f.discountValue, { max: percent ? 100 : MAX_PRICE });
        if (err) return err;
        const dv = num(f.discountValue);
        if (dv > 0 && !percent && dv > num(f.retail)) return "Discount cannot be more than the retail price";
        if (dv > 0 && f.retail.trim() && sellingPrice(num(f.retail), f.discountType, dv) <= 0) return "Discount leaves a selling price of $0.00. Reduce the discount";
        return "";
    },
    wholesale: (f) => priceError("Wholesale price", f.wholesale, { max: MAX_PRICE }),
    markup: (f) => {
        const v = f.markupValue.trim();
        if (v) {
            const err = priceError("Roja markup", v, { max: f.markupType === "percent" ? 1000 : MAX_PRICE });
            if (err) return err;
        }
        if (f.wholesale.trim() || v) {
            const m = calcMargin(num(f.wholesale), num(f.retail), num(f.markupValue), f.markupType);
            if (m.margin < 0) return "Margin vs. retail cannot be negative. Lower the markup or raise the retail price.";
        }
        return "";
    },
    productConfig: (f) => (f.audience === "provider" && !f.productConfig ? "Product configuration is required" : ""),
    placements: (f) => (f.placements.length ? "" : "Select at least one placement"),
    freqCap: (f) => {
        const v = f.freqCap.trim();
        if (!v) return "Frequency cap is required";
        if (Number(v) < 1) return "Frequency cap must be at least 1";
        if (Number(v) > 100) return "Frequency cap cannot be more than 100";
        return "";
    },
    availableFrom: (f) => (f.publish === "later" && !f.availableFrom ? "Available from date is required" : ""),
    expiresOn: (f) => {
        if (f.publish !== "later" || !f.expires) return "";
        if (!f.expiresOn) return "Expiry date is required";
        return f.availableFrom && f.expiresOn < f.availableFrom ? "Expiry date cannot be before the available date" : "";
    },
};

// which rules each step checks (the Content step checks both tabs)
const STEP_KEYS: string[][] = [
    ["name", "categoryId"],
    ["termsFile", "imageFile", "imageBg", "mShort", "mLong", "mPricing", "dTemplate", "dTitle", "dCta", "dFeature", "dShort"],
    ["retail", "discountValue", "wholesale", "markup"],
    ["productConfig"],
    ["placements", "freqCap", "availableFrom", "expiresOn"],
    [],
];

interface FormProps {
    initial?: ProductRec;
    categories: { id: string; name: string }[];
    bundleOpts: BundleOpt[];
}

const fromRec = (r: ProductRec): Form => ({
    ...empty,
    name: r.name, categoryId: r.categoryId, providerId: r.providerId,
    status: r.status === "Inactive" ? "Inactive" : "Active", // UI only: the API sets status itself
    imageBg: r.imageBg, shortDescription: r.shortDescription, longDescription: r.longDescription, pricingContent: r.pricingContent,
    template: r.template, dashTitle: r.dashTitle, cta: r.cta, featureTitle: r.featureTitle, dashShort: r.dashShort,
    retail: r.retail == null ? "" : String(r.retail), discountType: r.discountType || "fixed",
    discountValue: r.discountValue ? String(r.discountValue) : "",
    bundleIds: r.bundles.map((b) => b.id),
    wholesale: r.wholesale == null ? "" : String(r.wholesale), markupType: r.markupType,
    markupValue: r.markupValue == null ? "" : String(r.markupValue),
    audience: r.audience, productConfig: r.configurationId, placements: r.placements, freqCap: r.freqCap == null ? "" : String(r.freqCap),
    publish: r.publish, availableFrom: r.availableFrom, expires: !!r.expiresOn, expiresOn: r.expiresOn,
});

function ProductForm({ initial, categories, bundleOpts }: FormProps) {
    const nav = useNavigate();
    const { toast, toastError, openDrawer } = useApp();
    const isEdit = !!initial;
    const [savedId, setSavedId] = useState(initial?.id ?? "");
    const [f, setF] = useState<Form>(initial ? fromRec(initial) : empty);
    const [step, setStep] = useState(0);
    const [tab, setTab] = useState("market");
    const [errors, setErrors] = useState<Errors>({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState<"" | "draft" | "publish">("");
    const [opts, setOpts] = useState(bundleOpts);
    const bundleLabel = (b: Bundle) => (b.shortCode ? `${b.name} (${b.shortCode})` : b.name);
    // called by the drawer after a bundle is created: adds it to the options and selects it
    const addCreatedBundle = (b: Bundle) => {
        setOpts((o) => [...o, { id: b.id, label: bundleLabel(b), type: b.pricingType }]);
        setF((p) => ({ ...p, bundleIds: [...p.bundleIds, b.id] }));
    };
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
    const shownImg = imgUrl ?? initial?.imageUrl ?? "";

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
    const [expOpt, setExpOpt] = useState<ExpOpt>(initial?.expiresOn ? "custom" : "never");
    const pickExpiry = (o: ExpOpt) => {
        setExpOpt(o);
        if (o === "never") setF((p) => ({ ...p, expires: false, expiresOn: "" }));
        else if (o === "custom") setF((p) => ({ ...p, expires: true }));
        else setF((p) => ({ ...p, expires: true, expiresOn: addDays(p.availableFrom || TODAY, Number(o)) }));
    };
    // text fields: spaces at the start are not allowed; errors update when the user leaves the field
    const setText = (k: TextKey, v: string) => setF((p) => ({ ...p, [k]: noLead(v) }));
    const tp = (k: TextKey, errKey: string) => ({
        value: f[k],
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(k, e.target.value),
        onBlur: () => touch(errKey),
    });
    // image uploads are checked as soon as a file is chosen
    const pickFile = (k: "termsFile" | "imageFile", file: File | null) => {
        set(k, file);
        const msg = imageError(file);
        setErrors((p) => { const n = { ...p }; if (msg) n[k] = msg; else delete n[k]; return n; });
    };
    const selling = sellingPrice(num(f.retail), f.discountType, num(f.discountValue));
    const m = calcMargin(num(f.wholesale), num(f.retail), num(f.markupValue), f.markupType);
    const catName = categories.find((c) => c.id === f.categoryId)?.name ?? "-";

    const validate = (s: number): Errors => {
        const e: Errors = {};
        for (const k of STEP_KEYS[s] ?? []) {
            const msg = rules[k](f);
            if (msg) e[k] = msg;
        }
        return e;
    };

    // live validation: errors that are showing re-check on every change and disappear once the value is valid
    useEffect(() => {
        setErrors((prev) => {
            const keys = Object.keys(prev);
            if (!keys.length) return prev;
            const next: Errors = {};
            for (const k of keys) { const msg = rules[k]?.(f); if (msg) next[k] = msg; }
            const same = keys.length === Object.keys(next).length && keys.every((k) => next[k] === prev[k]);
            return same ? prev : next;
        });
    }, [f]);

    // show or clear one field's error when the user leaves it
    const touch = (key: string) =>
        setErrors((prev) => {
            const msg = rules[key](f);
            if (msg) return prev[key] === msg ? prev : { ...prev, [key]: msg };
            if (!(key in prev)) return prev;
            const rest = { ...prev };
            delete rest[key];
            return rest;
        });

    const marketKeys = ["termsFile", "imageFile", "imageBg", "mShort", "mLong", "mPricing"];
    const dashKeys = ["dTemplate", "dTitle", "dCta", "dFeature", "dShort"];
    const marketHasError = marketKeys.some((k) => errors[k]);
    const dashHasError = dashKeys.some((k) => errors[k]);
    // stay on the current tab if it has errors, otherwise open the tab that does
    const showErrorTab = (e: Errors) => {
        const m = marketKeys.some((k) => e[k]);
        const d = dashKeys.some((k) => e[k]);
        if (tab === "market" && !m && d) setTab("dashboard");
        else if (tab === "dashboard" && !d && m) setTab("market");
    };

    // after the errors render, scroll to the first one and focus its input
    const bodyRef = useRef<HTMLDivElement>(null);
    const [focusTick, setFocusTick] = useState(0);
    useEffect(() => {
        if (!focusTick) return;
        const box = bodyRef.current?.querySelector<HTMLElement>('p[role="alert"]')?.parentElement;
        if (!box) return;
        const el = box.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')
            ?? box.querySelector<HTMLElement>("button");
        box.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
    }, [focusTick]);
    const fail = (e: Errors) => { setErrors(e); showErrorTab(e); setFocusTick((t) => t + 1); };

    // checks the given steps, shows errors for ALL of them, but moves/focuses only on the FIRST failing step
    const checkSteps = (steps: number[]): boolean => {
        const all: Errors = {};
        let first = -1;
        for (const s of steps) {
            const e = validate(s);
            if (Object.keys(e).length) {
                Object.assign(all, e);
                if (first < 0) first = s;
            }
        }
        if (first < 0) return true;
        setErrors(all);
        setStep(first);
        showErrorTab(validate(first));
        setFocusTick((t) => t + 1);
        return false;
    };

    // step bar click: going back is always allowed, going forward needs every earlier step to be valid
    // step bar click: open any step, no checks (Publish does the checking)
    const goTo = (i: number) => setStep(i);

    const next = () => {
        const e = validate(step);
        if (Object.keys(e).length) fail(e);
        else setStep((s) => s + 1);
    };

    const isLive = isEdit && initial?.status !== "Draft";
    const canPublish = !(isEdit && initial?.status === "Active");

    const save = async (publish: boolean, full = publish) => {
        if (!checkSteps(full ? [0, 1, 2, 3, 4] : [0, 1])) return;
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

    // heading row, right side: Save Draft (dark blue) + Preview (light orange)
    const topActions = (
        <div className="flex justify-end gap-2">
            {!isLive && (
                <button className={btn.navy} disabled={!!busy} onClick={() => save(false, true)}>
                    {busy === "draft" ? "Saving…" : "Save Draft"}
                </button>
            )}
            <button className={softOrange} disabled={!!busy} onClick={() => setStep(STEPS.length - 1)}>Preview</button>
        </div>
    );

    const bottomActions = (
        <div className="flex items-center justify-between gap-2">
            <div>
                {step > 0 && (
                    <button className={softOrange} disabled={!!busy} onClick={() => setStep((s) => s - 1)}>
                        <ChevronLeft className="size-4" /> Back
                    </button>
                )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)}>Cancel</button>
                {step < STEPS.length - 1 && (
                    <button className={softOrange} disabled={!!busy} onClick={next}>
                        Next <ChevronRight className="size-4" />
                    </button>
                )}
                <button className={btn.primary} disabled={!!busy} onClick={() => save(canPublish, true)}>
                    {busy === "publish" ? "Publishing…" : "Publish"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-4">
            {apiError && <Alert kind="error">{apiError}</Alert>}
            <Stepper steps={STEPS} current={step} onGo={goTo} />
            <div ref={bodyRef} className="flex flex-col gap-4">
                {step === 0 && (
                    <Section n={1} title="Overview" subtitle="Basic product identity." action={topActions} >
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Product Name" required error={errors.name}>
                                <TextInput {...tp("name", "name")} maxLength={LIMITS.name[1]} placeholder="e.g. Financial +" />
                            </Field>
                            <Field label="Product Category" required error={errors.categoryId}>
                                {dd("category", f.categoryId, categories.map((c) => ({ value: c.id, label: c.name })), (v) => set("categoryId", v), "Select category")}
                            </Field>
                            <Field label="Provider ID">
                                {dd("provider", f.providerId,
                                    f.providerId && !PROVIDER_OPTIONS.some((o) => o.value === f.providerId)
                                        ? [{ value: f.providerId, label: f.providerId }, ...PROVIDER_OPTIONS]
                                        : PROVIDER_OPTIONS,
                                    (v) => set("providerId", v), "Select provider ID")}
                            </Field>
                            <Field label="Status" required>
                                {dd("status", f.status, statusFormOptions, (v) => set("status", v as Status))}
                            </Field>
                        </div>
                    </Section>
                )}

                {step === 1 && (
                    <Section n={2} title="Content" subtitle="Marketplace and dashboard copy." action={topActions} >
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
                                    <Field label="Terms & Conditions" note="JPEG or PNG, under 2 MB." error={errors.termsFile}>
                                        <FileInput accept="image/png,image/jpeg" file={f.termsFile} onChange={(v) => pickFile("termsFile", v)} />
                                        {!f.termsFile && initial?.termsUrl && (
                                            <a href={initial.termsUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-link hover:underline">View current file</a>
                                        )}
                                    </Field>
                                    <Field label="Product Image" note="JPEG or PNG, under 2 MB." error={errors.imageFile}>
                                        <FileInput accept="image/png,image/jpeg" file={f.imageFile} onChange={(v) => pickFile("imageFile", v)} />
                                        {shownImg && <img src={shownImg} alt="Product preview" className="mt-3 h-28 w-full rounded-lg border border-line object-contain" />}
                                    </Field>
                                    <Field label="Image Background Color" note={HexNote} error={errors.imageBg}>
                                        <ColorField value={f.imageBg} onChange={(v) => set("imageBg", v.replace(/\s/g, ""))} />
                                    </Field>
                                </div>
                                <Field label="Short Description" required error={errors.mShort}>
                                    <TextArea rows={3} maxLength={LIMITS.mShort[1]} {...tp("shortDescription", "mShort")} />
                                </Field>
                                <Field label="Long Description" required error={errors.mLong}>
                                    <RichTextEditor value={f.longDescription} onChange={(v) => set("longDescription", v)} />
                                </Field>
                                <Field label="Pricing / Renewal Content" required error={errors.mPricing}>
                                    <TextArea rows={3} maxLength={LIMITS.pricing[1]} {...tp("pricingContent", "mPricing")} />
                                </Field>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                <h3 className="text-sm font-bold text-ink">Dashboard Content</h3>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Product Template" required error={errors.dTemplate}>
                                        {dd("template", f.template, productTemplates.map((t) => ({ value: t, label: t })), (v) => set("template", v), "Select template")}
                                    </Field>
                                    <Field label="Title" required error={errors.dTitle}>
                                        <TextInput maxLength={LIMITS.title[1]} {...tp("dashTitle", "dTitle")} />
                                    </Field>
                                    <Field label="Call to Action" required error={errors.dCta}>
                                        <TextInput maxLength={LIMITS.cta[1]} {...tp("cta", "dCta")} />
                                    </Field>
                                    <Field label="Feature Title" required error={errors.dFeature}>
                                        <TextInput maxLength={LIMITS.feature[1]} {...tp("featureTitle", "dFeature")} />
                                    </Field>
                                </div>
                                <Field label="Short Description" required error={errors.dShort}>
                                    <TextArea rows={3} maxLength={LIMITS.dashShort[1]} {...tp("dashShort", "dShort")} />
                                </Field>
                            </div>
                        )}
                    </Section>
                )}

                {step === 2 && (
                    <Section n={3} title="Pricing & Bundle" subtitle="Retail price, discount and bundled features." action={topActions} >
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Retail Price" required error={errors.retail}>
                                <MoneyInput value={f.retail} onChange={(v) => set("retail", v)} />
                            </Field>
                            <Field label="Discount" error={errors.discountValue}>
                                <div className="grid grid-cols-2 gap-2">
                                    {dd("dtype", f.discountType, discountTypeFormOptions, (v) => set("discountType", v as DiscountType))}
                                    <MoneyInput prefix={f.discountType === "percent" ? "%" : "$"} value={f.discountValue}
                                        max={f.discountType === "percent" ? 100 : 99999.99}
                                        placeholder={f.discountType === "percent" ? "e.g. 10" : "e.g. 2.00"} onChange={(v) => set("discountValue", v)} />
                                </div>
                            </Field>
                            <Field label="Selling Price" required>
                                <MoneyInput value={selling.toFixed(2)} readOnly />
                            </Field>
                            <div className="hidden md:block" />
                            <Field label="Wholesale Price" error={errors.wholesale}>
                                <MoneyInput value={f.wholesale} onChange={(v) => set("wholesale", v)} />
                            </Field>
                            <Field label="Roja Markup" error={errors.markup}>
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
                                <BundledSelect
                                    options={opts}
                                    value={f.bundleIds}
                                    onChange={(ids) => set("bundleIds", ids)}
                                    onAdd={() => openDrawer(<BundleCreateDrawer onCreated={addCreatedBundle} />)}
                                />
                            </Field>
                        </div>
                    </Section>
                )}

                {step === 3 && (
                    <Section n={4} title="Audience Strategy" subtitle="Who can see this product." action={topActions} >
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
                    <Section n={5} title="Placement" subtitle="Where and when this product is shown." action={topActions} >
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
                                <TextInput inputMode="numeric" maxLength={3} value={f.freqCap} placeholder="e.g. 3"
                                    onChange={(e) => set("freqCap", e.target.value.replace(/\D/g, ""))} onBlur={() => touch("freqCap")} />
                            </Field>
                            <Field label="Publishing Schedule" required>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <RadioCard name="pub" title="Publish immediately" note="The product will be available as soon as it is published."
                                        checked={f.publish === "now"} onChange={() => { setExpOpt("never"); setF((p) => ({ ...p, publish: "now", availableFrom: "", expires: false, expiresOn: "" })); }} />
                                    <RadioCard name="pub" title="Schedule for later" note="Pick the exact date and time this product should become available."
                                        checked={f.publish === "later"} onChange={() => set("publish", "later")} />
                                </div>
                            </Field>
                            {f.publish === "later" && (
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Available From" required error={errors.availableFrom}>
                                        <DatePicker value={f.availableFrom} minDate={TODAY} placeholder="Select date"
                                            onChange={(v) => setF((p) => ({ ...p, availableFrom: v, expiresOn: /^\d+$/.test(expOpt) ? addDays(v || TODAY, Number(expOpt)) : p.expiresOn }))} />
                                    </Field>
                                    <Field label="Expiration" required error={errors.expiresOn}>
                                        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
                                            {EXP_OPTIONS.map((o) => (
                                                <Radio key={o.value} name="exp" label={o.label} checked={expOpt === o.value} onChange={() => pickExpiry(o.value)} />
                                            ))}
                                        </div>
                                        {expOpt === "custom" && (
                                            <div className="mt-3">
                                                <DatePicker value={f.expiresOn} minDate={f.availableFrom || TODAY} placeholder="Select date" onChange={(v) => set("expiresOn", v)} />
                                            </div>
                                        )}
                                        {/^\d+$/.test(expOpt) && f.expiresOn && (
                                            <p className="mt-2 text-xs text-muted">Expires on {f.expiresOn}</p>
                                        )}
                                    </Field>
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {step === 5 && (

                    <Section n={6} title="Preview" subtitle="Review everything before submitting." action={topActions} >
                        <div className="flex flex-col gap-5">
                            <div className="max-w-sm overflow-hidden rounded-xl border border-line">
                                <div className="grid h-40 place-items-center" style={{ background: isHex(f.imageBg) ? f.imageBg : "#eef2fa" }}>
                                    {shownImg ? <img src={shownImg} alt="Product" className="h-full w-full object-contain" /> : <span className="text-xs text-muted">No image uploaded</span>}
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

            </div>
            {bottomActions}
        </div>
    );
}

export default function CatalogProductsManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [data, setData] = useState<{ rec?: ProductRec; cats: { id: string; name: string }[]; opts: BundleOpt[] } | null>(null);
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
                setData({ rec, cats: c, opts: bs.rows.map((b) => ({ id: b.id, label: b.shortCode ? `${b.name} (${b.shortCode})` : b.name, type: b.pricingType })) });
            })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!data || (id && data.rec?.id !== id)) return <LoadingBox />;
    return <ProductForm key={id ?? "new"} initial={data.rec} categories={data.cats} bundleOpts={data.opts} />;
}