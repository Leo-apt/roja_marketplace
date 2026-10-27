import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import Drawer from "@/components/shared/Drawer";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { Alert } from "@/components/auth/AuthShell";
import RichTextEditor from "./RichTextEditor";
import { useApp } from "@/hooks/useApp";
import { useBackGuard } from "@/hooks/useBackGuard";
import { bundlesService } from "@/services/bundles.service";
import { btn, ColorField, Field, FileInput, HexNote, MoneyInput, PhoneField, Radio, TextArea, TextInput, Toggle } from "./FormBits";
import type { Bundle, Status } from "@/data/catalog";
import { discountTypeFormOptions, isHex, num, sellingPrice, statusFormOptions, usd, type DiscountType } from "@/utils/catalog";

interface Form {
    name: string; shortCode: string; iconFamily: string; appIcon: string; webIcon: string; bgColor: string;
    pricingType: "addon" | "bundle"; status: Status; price: string;
    discountOn: boolean; discountWhen: "" | "forever" | "first"; discountType: DiscountType; discountValue: string;
    longDescription: string; benefits: string[]; phone: string; portalUrl: string; promoCode: string; promoNote: string;
    disclosure: string; disclaimer: string; additionalInfo: string; insuranceInstructions: string;
    title: string; shortDescription: string; bgImage: File | null; tIconFamily: string; tAppIcon: string; tWebIcon: string;
    cardBg: string; iconBg: string;
}
type Errors = Record<string, string>;

const empty: Form = {
    name: "", shortCode: "", iconFamily: "", appIcon: "", webIcon: "", bgColor: "",
    pricingType: "bundle", status: "Active", price: "", discountOn: false, discountWhen: "", discountType: "fixed", discountValue: "",
    longDescription: "", benefits: [""], phone: "", portalUrl: "", promoCode: "", promoNote: "",
    disclosure: "", disclaimer: "", additionalInfo: "", insuranceInstructions: "",
    title: "", shortDescription: "", bgImage: null, tIconFamily: "", tAppIcon: "", tWebIcon: "", cardBg: "", iconBg: "",
};

const H = ({ children }: { children: string }) => (
    <h3 className="border-b border-line pb-2 text-sm font-bold text-ink">{children}</h3>
);

export default function BundleCreateDrawer({ onCreated }: { onCreated: (b: Bundle) => void }) {
    const { closeLayers, toast } = useApp();
    const [f, setF] = useState<Form>(empty);
    const [errors, setErrors] = useState<Errors>({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [tick, setTick] = useState(0);
    const bodyRef = useRef<HTMLDivElement>(null);
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

    const dirty = JSON.stringify({ ...f, bgImage: f.bgImage?.name ?? null }) !== JSON.stringify(empty);
    useBackGuard(dirty, () => { if (dirty) setConfirm(true); else closeLayers(); });
    useEffect(() => {
        if (!dirty) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", h);
        return () => window.removeEventListener("beforeunload", h);
    }, [dirty]);

    // scroll to the first error after validation fails
    useEffect(() => {
        if (!tick) return;
        bodyRef.current?.querySelector('p[role="alert"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [tick]);

    const priceNum = num(f.price);
    const discNum = num(f.discountValue);
    const showSelling = f.pricingType === "addon" && f.discountOn && !!f.discountWhen && discNum > 0 && priceNum > 0;
    const selling = sellingPrice(priceNum, f.discountType, discNum);

    const validate = (): Errors => {
        const e: Errors = {};
        const req = (k: keyof Form, m: string) => { if (!String(f[k]).trim()) e[k] = m; };
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
        req("longDescription", "Long description is required");
        if (f.portalUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(f.portalUrl.trim())) e.portalUrl = "Enter a valid URL, e.g. https://example.com";
        req("title", "Title is required");
        req("shortDescription", "Short description is required");
        req("tIconFamily", "Icon family is required");
        req("tAppIcon", "App icon is required");
        if (f.bgImage && !["image/jpeg", "image/png", "image/webp"].includes(f.bgImage.type)) e.bgImage = "Use a JPEG, PNG or WebP image";
        else if (f.bgImage && f.bgImage.size > 2 * 1024 * 1024) e.bgImage = "Image must be less than 2 MB";
        if (f.cardBg && !isHex(f.cardBg)) e.cardBg = "Enter a valid HEX code";
        if (f.iconBg && !isHex(f.iconBg)) e.iconBg = "Enter a valid HEX code";
        return e;
    };

    const save = async (close: () => void) => {
        const e = validate();
        setErrors(e);
        setApiError("");
        if (Object.keys(e).length) { setTick((t) => t + 1); return; }
        setSaving(true);
        try {
            const rec = await bundlesService.create(f);
            onCreated(rec);
            toast("Bundle created");
            close();
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const setBenefit = (i: number, v: string) => set("benefits", f.benefits.map((b, idx) => (idx === i ? v : b)));
    const dropdown = (name: string, value: string, options: { value: string; label: string }[], on: (v: string) => void) => (
        <Dropdownbox name={name} value={value} options={options} rounded="rounded-md" compact onChange={(e) => on(e.target.value)} />
    );

    return (
        <Drawer
            title="Create Bundle"
            kicker="Pricing & Bundle"
            width="min(1000px, calc(100vw - 20px))"
            onBeforeClose={() => { if (!dirty) return true; setConfirm(true); return false; }}
            footer={(close, tryClose) => (
                <>
                    <button className={btn.cancel} onClick={tryClose} disabled={saving}>Cancel</button>
                    <button className={btn.primary} disabled={saving} onClick={() => void save(close)}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </>
            )}
        >
            <div ref={bodyRef} className="flex flex-col gap-5">
                {apiError && <Alert kind="error">{apiError}</Alert>}

                <H>Basic Info</H>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Product Feature Name" required error={errors.name}>
                        <TextInput value={f.name} placeholder='e.g. "FinancialConnect"' onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="Short Code" required error={errors.shortCode}>
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
                <div className="grid gap-5 md:grid-cols-3">
                    <Field label="Background Color" note={HexNote} error={errors.bgColor}>
                        <ColorField value={f.bgColor} onChange={(v) => set("bgColor", v)} />
                    </Field>
                    <Field label="Pricing Type" required>
                        <div className="flex gap-6 pt-2">
                            <Radio name="cpt" label="Add On" checked={f.pricingType === "addon"} onChange={() => set("pricingType", "addon")} />
                            <Radio name="cpt" label="Bundle" checked={f.pricingType === "bundle"} onChange={() => set("pricingType", "bundle")} />
                        </div>
                    </Field>
                    <Field label="Status" required>
                        {dropdown("cstatus", f.status, statusFormOptions, (v) => set("status", v as Status))}
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
                                <Toggle label="Discount" on={f.discountOn}
                                    onChange={(v) => setF((p) => ({ ...p, discountOn: v, discountWhen: v ? p.discountWhen : "", discountValue: v ? p.discountValue : "" }))} />
                            </div>
                            {f.discountOn && (
                                <>
                                    <p className="mt-2 text-sm text-muted">When should this discount apply?</p>
                                    <div className="mt-3 flex gap-6">
                                        <Radio name="cdw" label="Forever" checked={f.discountWhen === "forever"} onChange={() => set("discountWhen", "forever")} />
                                        <Radio name="cdw" label="First-Time Purchase" checked={f.discountWhen === "first"} onChange={() => set("discountWhen", "first")} />
                                    </div>
                                    {errors.discountWhen && <p className="mt-1 text-xs text-bad" role="alert">{errors.discountWhen}</p>}
                                </>
                            )}
                        </div>
                        {f.discountOn && f.discountWhen && (
                            <div className="self-end">
                                <div className="grid grid-cols-2 gap-2">
                                    {dropdown("cdtype", f.discountType, discountTypeFormOptions, (v) => set("discountType", v as DiscountType))}
                                    <MoneyInput prefix={f.discountType === "percent" ? "%" : "$"} value={f.discountValue}
                                        placeholder={f.discountType === "percent" ? "e.g. 10" : "e.g. 20.00"} onChange={(v) => set("discountValue", v)} />
                                </div>
                                {errors.discountValue && <p className="mt-1 text-xs text-bad" role="alert">{errors.discountValue}</p>}
                            </div>
                        )}
                        {showSelling && (
                            <Field label="Selling Price" className="md:max-w-[50%]" note={`Regular price ${usd(priceNum)}`}>
                                <MoneyInput value={selling.toFixed(2)} readOnly />
                            </Field>
                        )}
                    </div>
                )}

                <H>Content</H>
                <Field label="Long Description" required error={errors.longDescription}>
                    <RichTextEditor value={f.longDescription} onChange={(v) => set("longDescription", v)} />
                </Field>
                <Field label="Benefits List">
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
                    <Field label="Exclusive Promo Code">
                        <TextInput value={f.promoCode} placeholder="e.g. SWANFAM" onChange={(e) => set("promoCode", e.target.value)} />
                    </Field>
                    <Field label="Promo Code Usage Note">
                        <TextInput value={f.promoNote} onChange={(e) => set("promoNote", e.target.value)} />
                    </Field>
                    <Field label="Disclosure"><TextArea rows={3} placeholder="Optional" value={f.disclosure} onChange={(e) => set("disclosure", e.target.value)} /></Field>
                    <Field label="Disclaimer"><TextArea rows={3} placeholder="Optional" value={f.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} /></Field>
                    <Field label="Additional Information"><TextArea rows={3} placeholder="Optional" value={f.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} /></Field>
                    <Field label="Insurance Instructions"><TextArea rows={3} placeholder="Optional" value={f.insuranceInstructions} onChange={(e) => set("insuranceInstructions", e.target.value)} /></Field>
                </div>

                <H>Bundle Template Information</H>
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Title" required error={errors.title}>
                        <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} />
                    </Field>
                    <Field label="Short Description" required error={errors.shortDescription}>
                        <TextArea rows={3} placeholder="1-2 lines shown on the marketplace card" value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
                    </Field>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                    <Field label="Background Image" note="JPEG, PNG or WEBP, under 2 MB." error={errors.bgImage}>
                        <FileInput accept="image/png,image/jpeg,image/webp" file={f.bgImage} onChange={(file) => set("bgImage", file)} />
                    </Field>
                    <Field label="Icon Family" required error={errors.tIconFamily}>
                        <TextInput value={f.tIconFamily} onChange={(e) => set("tIconFamily", e.target.value)} />
                    </Field>
                    <Field label="App Icon" required error={errors.tAppIcon}>
                        <TextInput value={f.tAppIcon} onChange={(e) => set("tAppIcon", e.target.value)} />
                    </Field>
                    <Field label="Web Icon"><TextInput value={f.tWebIcon} onChange={(e) => set("tWebIcon", e.target.value)} /></Field>
                    <Field label="Card Background Color" note={HexNote} error={errors.cardBg}>
                        <ColorField value={f.cardBg} onChange={(v) => set("cardBg", v)} />
                    </Field>
                    <Field label="Icon Background" note={HexNote} error={errors.iconBg}>
                        <ColorField value={f.iconBg} onChange={(v) => set("iconBg", v)} />
                    </Field>
                </div>
            </div>

            <ConfirmDialog isOpen={confirm} type="warning" title="Discard changes?"
                message="You have unsaved changes. If you leave now, they will be lost."
                confirmText="Discard" cancelText="Keep editing"
                onClose={() => setConfirm(false)}
                onConfirm={() => { setConfirm(false); closeLayers(); }} />
        </Drawer>
    );
}