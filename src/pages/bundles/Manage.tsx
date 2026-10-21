import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { Alert } from "@/components/auth/AuthShell";
import { AdminNotice, ErrorBox, LoadingBox, useIsAdmin } from "@/components/catalog/PageState";
import { bundlesService, compressImage } from "@/services/bundles.service";
import RichTextEditor from "@/components/catalog/RichTextEditor";
import {
    btn, ColorField, Field, FileInput, HexNote, MoneyInput, PhoneField, Radio, Section, TextArea, TextInput, Toggle,
} from "@/components/catalog/FormBits";
import type { Bundle } from "@/data/catalog";
import { discountTypeFormOptions, isHex, num, sellingPrice, usd, type DiscountType } from "@/utils/catalog";

const BASE = "/catalog/bundles";

interface Form {
    name: string; shortCode: string; iconFamily: string; appIcon: string; webIcon: string; bgColor: string;
    pricingType: "addon" | "bundle"; price: string;
    discountOn: boolean; discountWhen: "" | "forever" | "first"; discountType: DiscountType; discountValue: string;
    longDescription: string; benefits: string[]; phone: string; portalUrl: string; promoCode: string; promoNote: string;
    disclosure: string; disclaimer: string; additionalInfo: string; insuranceInstructions: string;
    title: string; shortDescription: string; bgImage: File | null; tIconFamily: string; tAppIcon: string; tWebIcon: string;
    cardBg: string; iconBg: string;
}
type Errors = Record<string, string>;

const empty: Form = {
    name: "", shortCode: "", iconFamily: "", appIcon: "", webIcon: "", bgColor: "",
    pricingType: "bundle", price: "", discountOn: false, discountWhen: "", discountType: "fixed", discountValue: "",
    longDescription: "", benefits: [""], phone: "", portalUrl: "", promoCode: "", promoNote: "",
    disclosure: "", disclaimer: "", additionalInfo: "", insuranceInstructions: "",
    title: "", shortDescription: "", bgImage: null, tIconFamily: "", tAppIcon: "", tWebIcon: "", cardBg: "", iconBg: "",
};

const fromBundle = (b: Bundle): Form => ({
    name: b.name, shortCode: b.shortCode, iconFamily: b.iconFamily, appIcon: b.appIcon, webIcon: b.webIcon, bgColor: b.bgColor,
    pricingType: b.pricingType === "Bundle" ? "bundle" : "addon",
    price: b.price == null ? "" : String(b.price), discountOn: b.discountOn, discountWhen: b.discountOn ? "forever" : "", // UI-only: no backend fields for this
    discountType: b.discountType, discountValue: b.discountValue == null ? "" : String(b.discountValue),
    longDescription: b.longDescription, benefits: b.benefits.length ? b.benefits : [""],
    phone: b.phone, portalUrl: b.portalUrl, promoCode: b.promoCode, promoNote: b.promoNote,
    disclosure: b.disclosure, disclaimer: b.disclaimer, additionalInfo: b.additionalInfo, insuranceInstructions: b.insuranceInstructions,
    title: b.title, shortDescription: b.shortDescription, bgImage: null,
    tIconFamily: b.tIconFamily, tAppIcon: b.tAppIcon, tWebIcon: b.tWebIcon, cardBg: b.cardBg, iconBg: b.iconBg,
});

// scrolls to the first field that shows an error and focuses its input
const focusFirstError = () => {
    setTimeout(() => {
        const box = document.querySelector<HTMLElement>('[data-error="true"]');
        if (!box) return;
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        box.querySelector<HTMLElement>("input, textarea, [contenteditable='true']")?.focus({ preventScroll: true });
    }, 0);
};

function BundleForm({ initial }: { initial?: Bundle }) {
    const nav = useNavigate();
    const { toast } = useApp();
    const isEdit = !!initial;
    const [f, setF] = useState<Form>(initial ? fromBundle(initial) : empty);
    const [errors, setErrors] = useState<Errors>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

    const priceNum = num(f.price);
    const discNum = num(f.discountValue);
    // Selling Price shows only after the user has entered the price, chosen "when", and typed a discount value
    const showSelling = f.pricingType === "addon" && f.discountOn && !!f.discountWhen && discNum > 0 && priceNum > 0;
    const selling = sellingPrice(priceNum, f.discountType, discNum);

    const validate = (s: number): Errors => {
        const e: Errors = {};
        const req = (k: keyof Form, m: string) => { if (!String(f[k]).trim()) e[k] = m; };
        if (s === 0) {
            req("name", "Product feature name is required");
            req("shortCode", "Short code is required");
            req("iconFamily", "Icon family is required");
            req("appIcon", "App icon is required");
            if (f.bgColor && !isHex(f.bgColor)) e.bgColor = "Enter a valid HEX code";
            if (f.pricingType === "addon") {
                req("price", "Price is required");
                if (f.discountOn) {
                    if (!f.discountWhen) e.discountWhen = "Choose when the discount applies";
                    else req("discountValue", "Discount value is required");
                    if (f.discountType === "percent" && num(f.discountValue) > 100) e.discountValue = "Percentage cannot exceed 100";
                    if (f.discountType === "fixed" && num(f.discountValue) > num(f.price)) e.discountValue = "Discount cannot be more than the price";
                }
            }
        }
        if (s === 1) {
            req("longDescription", "Long description is required");
            if (f.portalUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(f.portalUrl.trim())) e.portalUrl = "Enter a valid URL, e.g. https://example.com";
        }
        if (s === 2) {
            req("title", "Title is required");
            req("shortDescription", "Short description is required");
            req("tIconFamily", "Icon family is required");
            req("tAppIcon", "App icon is required");
            if (f.bgImage && f.bgImage.size > 2 * 1024 * 1024) e.bgImage = "Image must be less than 2 MB";
            if (f.cardBg && !isHex(f.cardBg)) e.cardBg = "Enter a valid HEX code";
            if (f.iconBg && !isHex(f.iconBg)) e.iconBg = "Enter a valid HEX code";
        }
        return e;
    };
    const submit = async () => {
        const e = { ...validate(0), ...validate(1), ...validate(2) };
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) { focusFirstError(); return; }
        setSaving(true);
        try {
            const bgImageBase64 = f.bgImage ? await compressImage(f.bgImage) : undefined;
            const input = { ...f, bgImageBase64 };
            if (initial) await bundlesService.update(initial.id, input);
            else await bundlesService.create(input);
            toast(isEdit ? "Bundle updated" : "Bundle created");
            nav(BASE);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
            setSaving(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const setBenefit = (i: number, v: string) => set("benefits", f.benefits.map((b, idx) => (idx === i ? v : b)));
    const dropdown = (name: string, value: string, options: { value: string; label: string }[], on: (v: string) => void) => (
        <Dropdownbox name={name} value={value} options={options} rounded="rounded-md" compact onChange={(e) => on(e.target.value)} />
    );

    return (
        <div className="flex flex-col gap-4">
            {apiError && <Alert kind="error">{apiError}</Alert>}
            <Section n={1} title="Basic Info" subtitle="Internal identity of this feature: its name, icon, and how it's priced. None of this copy is customer-facing wording.">
                <div className="flex flex-col gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Product Feature Name" required error={errors.name}>
                            <TextInput value={f.name} placeholder='e.g. "FinancialConnect"' onChange={(e) => set("name", e.target.value)} />
                        </Field>
                        <Field label="Short Code" required error={errors.shortCode} note='e.g. Financial ("Finance")'>
                            <TextInput value={f.shortCode} placeholder='e.g. "Finance"' onChange={(e) => set("shortCode", e.target.value)} />
                        </Field>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Icon Family" required error={errors.iconFamily}>
                            <TextInput value={f.iconFamily} placeholder="Icon Family" onChange={(e) => set("iconFamily", e.target.value)} />
                        </Field>
                        <Field label="App Icon" required error={errors.appIcon}>
                            <TextInput value={f.appIcon} placeholder="App Icon" onChange={(e) => set("appIcon", e.target.value)} />
                        </Field>
                        <Field label="Web Icon">
                            <TextInput value={f.webIcon} placeholder="Web Icon" onChange={(e) => set("webIcon", e.target.value)} />
                        </Field>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Background Color" note={HexNote} error={errors.bgColor}>
                            <ColorField value={f.bgColor} onChange={(v) => set("bgColor", v)} />
                        </Field>
                        <Field label="Pricing Type" required>
                            <div className="flex gap-6 pt-2">
                                <Radio name="pt" label="Add On" checked={f.pricingType === "addon"} onChange={() => set("pricingType", "addon")} />
                                <Radio name="pt" label="Bundle" checked={f.pricingType === "bundle"} onChange={() => set("pricingType", "bundle")} />
                            </div>
                        </Field>
                    </div>

                    {f.pricingType === "addon" && (
                        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                            <Field label="Price" required error={errors.price}>
                                <MoneyInput value={f.price} onChange={(v) => set("price", v)} />
                            </Field>
                            <div className="hidden md:block" />

                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-ink">Discount</span>
                                    <Toggle label="Discount" on={f.discountOn} onChange={(v) => setF((p) => ({ ...p, discountOn: v, discountWhen: v ? p.discountWhen : "", discountValue: v ? p.discountValue : "" }))} />
                                </div>
                                {f.discountOn && (
                                    <>
                                        <p className="mt-2 text-sm text-muted">When should this discount apply?</p>
                                        <div className="mt-3 flex gap-6">
                                            <Radio name="dw" label="Forever" checked={f.discountWhen === "forever"} onChange={() => set("discountWhen", "forever")} />
                                            <Radio name="dw" label="First-Time Purchase" checked={f.discountWhen === "first"} onChange={() => set("discountWhen", "first")} />
                                        </div>
                                        {errors.discountWhen && <p className="mt-1 text-xs text-bad">{errors.discountWhen}</p>}
                                    </>
                                )}
                            </div>
                            {f.discountOn && f.discountWhen && (
                                <div className="self-end">
                                    <div className="grid grid-cols-2 gap-2">
                                        {dropdown("dtype", f.discountType, discountTypeFormOptions, (v) => set("discountType", v as DiscountType))}
                                        <MoneyInput prefix={f.discountType === "percent" ? "%" : "$"} value={f.discountValue}
                                            placeholder={f.discountType === "percent" ? "e.g. 10" : "e.g. 20.00"} onChange={(v) => set("discountValue", v)} />
                                    </div>
                                    {errors.discountValue && <p className="mt-1 text-xs text-bad">{errors.discountValue}</p>}
                                </div>
                            )}
                            {showSelling && (
                                <div className="md:col-span-2">
                                    <p className="mb-2 text-sm text-good">
                                        <span>{f.discountWhen === "first" ? "First-time price" : "Discounted price"}: </span>
                                        <b>{usd(selling)}</b>
                                        <span className="ml-1 text-muted">(regular {usd(priceNum)})</span>
                                    </p>
                                    <Field label="Selling Price" required className="md:max-w-[50%]">
                                        <MoneyInput value={selling.toFixed(2)} readOnly />
                                    </Field>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Section>

            <Section n={2} title="Content" subtitle="Narrative copy, benefits, contact details and post-purchase information.">
                <div className="flex flex-col gap-5">
                    <Field label="Long Description" required error={errors.longDescription} note="General narrative copy only. Use the Sample Savings table below for pricing comparisons instead of building a table here — it renders more reliably.">
                        <RichTextEditor value={f.longDescription} onChange={(v) => set("longDescription", v)} />
                    </Field>

                    <Field label="Benefits List" note={undefined}>
                        <p className="-mt-1 mb-2 text-xs text-brand">List of discussion topics / covered issues</p>
                        <div className="flex flex-col gap-2">
                            {f.benefits.map((b, i) => (
                                <div key={i} className="flex">
                                    <input className="min-h-10 w-full rounded-l-md border border-line px-3 text-sm focus:border-brand focus:outline-none"
                                        value={b} placeholder={`Benefit ${i + 1}`} onChange={(e) => setBenefit(i, e.target.value)} />
                                    <button type="button" aria-label="Remove benefit"
                                        onClick={() => set("benefits", f.benefits.length > 1 ? f.benefits.filter((_, x) => x !== i) : [""])}
                                        className="grid w-11 shrink-0 place-items-center rounded-r-md border border-l-0 border-btn-danger text-btn-danger hover:bg-danger-soft">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => set("benefits", [...f.benefits, ""])}
                            className="mt-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gray-200">+ Add Benefit</button>
                    </Field>

                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Support Phone Number"><PhoneField value={f.phone} onChange={(v) => set("phone", v)} /></Field>
                        <Field label="Website / Member Portal URL" error={errors.portalUrl}>
                            <TextInput value={f.portalUrl} placeholder="https://example.com" onChange={(e) => set("portalUrl", e.target.value)} />
                        </Field>
                        <Field label="Exclusive Promo Code" note="Leave blank if this feature has no promo code — the code block simply won't render.">
                            <TextInput value={f.promoCode} placeholder="e.g. SWANFAM" onChange={(e) => set("promoCode", e.target.value)} />
                        </Field>
                        <Field label="Promo Code Usage Note">
                            <TextInput value={f.promoNote} placeholder='e.g. "Use this code at checkout for discounts"' onChange={(e) => set("promoNote", e.target.value)} />
                        </Field>
                        <Field label="Disclosure"><TextArea rows={3} placeholder="Optional" value={f.disclosure} onChange={(e) => set("disclosure", e.target.value)} /></Field>
                        <Field label="Disclaimer"><TextArea rows={3} placeholder="Optional" value={f.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} /></Field>
                        <Field label="Additional Information"><TextArea rows={3} placeholder="Optional" value={f.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} /></Field>
                        <Field label="Insurance Instructions">
                            <TextArea rows={3} placeholder="Instructions for insurance coverage — shown only after purchase" value={f.insuranceInstructions}
                                onChange={(e) => set("insuranceInstructions", e.target.value)} />
                        </Field>
                    </div>
                </div>
            </Section>

            <Section n={3} title="Bundle Template Information" subtitle="Internal identity of this feature: its name, icon, and how it's priced. None of this copy is customer-facing wording.">
                <div className="flex flex-col gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Title" required error={errors.title}>
                            <TextInput value={f.title} placeholder='e.g. "FinancialConnect"' onChange={(e) => set("title", e.target.value)} />
                        </Field>
                        <Field label="Short Description" required error={errors.shortDescription}>
                            <TextArea rows={3} placeholder="1-2 lines shown on the marketplace card" value={f.shortDescription}
                                onChange={(e) => set("shortDescription", e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Background Image" note="Upload a JPEG or PNG image that is less than 2 MB." error={errors.bgImage}>
                            <FileInput accept="image/png,image/jpeg" file={f.bgImage} onChange={(file) => set("bgImage", file)} />
                        </Field>
                        <Field label="Icon Family" required error={errors.tIconFamily}>
                            <TextInput value={f.tIconFamily} placeholder="Icon Family" onChange={(e) => set("tIconFamily", e.target.value)} />
                        </Field>
                        <Field label="App Icon" required error={errors.tAppIcon}>
                            <TextInput value={f.tAppIcon} placeholder="App Icon" onChange={(e) => set("tAppIcon", e.target.value)} />
                        </Field>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Web Icon"><TextInput value={f.tWebIcon} placeholder="Web Icon" onChange={(e) => set("tWebIcon", e.target.value)} /></Field>
                        <Field label="Card Background Color" note={HexNote} error={errors.cardBg}>
                            <ColorField value={f.cardBg} onChange={(v) => set("cardBg", v)} />
                        </Field>
                        <Field label="Icon Background" note={HexNote} error={errors.iconBg}>
                            <ColorField value={f.iconBg} onChange={(v) => set("iconBg", v)} />
                        </Field>
                    </div>
                </div>
            </Section>

            <div className="flex justify-end gap-2">
                <button className={btn.cancel} onClick={() => nav(BASE)} disabled={saving}>Cancel</button>
                <button className={btn.primary} onClick={submit} disabled={saving}>{saving ? "Saving…" : "Submit"}</button>
            </div>
        </div>
    );
}

export default function BundlesManage() {
    const { id } = useParams();
    const isAdmin = useIsAdmin();
    const [rec, setRec] = useState<Bundle | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id || !isAdmin) return;
        let live = true;
        bundlesService.get(id)
            .then((r) => { if (live) setRec(r); })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load"); });
        return () => { live = false; };
    }, [id, isAdmin]);

    if (!isAdmin) return <AdminNotice />;
    if (!id) return <BundleForm />;
    if (error) return <ErrorBox message={error} backTo={BASE} />;
    if (!rec || rec.id !== id) return <LoadingBox />;
    return <BundleForm initial={rec} />;
}