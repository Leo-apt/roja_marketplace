import { apiFetch } from "./auth.service";
import { fmt, who } from "./categories.service";
import { num, type DiscountType } from "@/utils/catalog";

// Assumption: matches the bundles enum. Change here if common/enums/discount-type.enum.ts differs.
const API_PERCENT = "percentage";
const API_FIXED = "fixed";

export type ProductStatus = "Active" | "Inactive" | "Draft" | "Scheduled";

export const PLACEMENT_OPTIONS = [
    { value: "marketplace", label: "Marketplace" },
    { value: "dashboardRecommendation", label: "Dashboard recommendation" },
    { value: "offerCarousel", label: "Offer carousel" },
    { value: "postAdvanceScreen", label: "Post-advance screen" },
];

interface Ref { _id: string; name?: string; shortCode?: string }
interface ApiProduct {
    _id: string; name: string; category: Ref | string; providerId?: string | null; status: boolean | string;
    marketplace?: { termsUrl?: string; imageUrl?: string; imageBackgroundColor?: string; shortDescription?: string; longDescription?: string; pricingRenewalContent?: string };
    dashboard?: { template?: string; title?: string; callToAction?: string; featureTitle?: string; shortDescription?: string };
    retailPrice?: number | null; discountType?: string | null; discountValue?: number | null; sellingPrice?: number;
    bundled?: (Ref | string)[]; audienceType?: string; placements?: string[]; perUserFrequencyCap?: number | null;
    publishMode?: string; scheduledAt?: string | null; expiresAt?: string | null;
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface ProductRec {
    id: string; name: string; categoryId: string; categoryName: string; providerId: string; status: ProductStatus;
    termsUrl: string; imageUrl: string; imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    retail: number | null; discountType: DiscountType | ""; discountValue: number | null; sellingPrice: number | null;
    bundles: { id: string; name: string; shortCode: string }[];
    audience: "everyone" | "provider"; placements: string[]; freqCap: number | null;
    publish: "now" | "later"; availableFrom: string; expiresOn: string;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}

export interface ProductInput {
    name: string; categoryId: string; providerId: string;
    imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    retail: string; discountType: DiscountType; discountValue: string; bundleIds: string[];
    audience: "everyone" | "provider"; placements: string[]; freqCap: string;
    publish: "now" | "later"; availableFrom: string; expires: boolean; expiresOn: string;
}

/** Accepts boolean (true/false) or the string enum (active/inactive/draft/scheduled). */
const toStatus = (v: unknown): ProductStatus => {
    if (v === true || v === "active") return "Active";
    if (v === false || v === "inactive") return "Inactive";
    if (v === "scheduled") return "Scheduled";
    return "Draft";
};

export const ymd = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const atDate = (s: string, endOfDay = false) => {
    const [y, m, d] = s.split("-").map(Number);
    return (endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d)).toISOString();
};

const ref = (v: Ref | string | undefined) =>
    typeof v === "string" ? { id: v, name: "", shortCode: "" } : v ? { id: v._id, name: v.name ?? "", shortCode: v.shortCode ?? "" } : null;

const toUi = (a: ApiProduct): ProductRec => {
    const cat = ref(a.category);
    const m = a.marketplace ?? {};
    const d = a.dashboard ?? {};
    return {
        id: a._id, name: a.name, categoryId: cat?.id ?? "", categoryName: cat?.name || "-",
        providerId: a.providerId ?? "", status: toStatus(a.status),
        termsUrl: m.termsUrl ?? "", imageUrl: m.imageUrl ?? "", imageBg: m.imageBackgroundColor ?? "",
        shortDescription: m.shortDescription ?? "", longDescription: m.longDescription ?? "", pricingContent: m.pricingRenewalContent ?? "",
        template: d.template ?? "", dashTitle: d.title ?? "", cta: d.callToAction ?? "", featureTitle: d.featureTitle ?? "", dashShort: d.shortDescription ?? "",
        retail: a.retailPrice ?? null,
        discountType: a.discountType === API_PERCENT ? "percent" : a.discountType === API_FIXED ? "fixed" : "",
        discountValue: a.discountValue ?? null,
        sellingPrice: a.sellingPrice ?? a.retailPrice ?? null,
        bundles: (a.bundled ?? []).map(ref).filter((b): b is NonNullable<typeof b> => !!b),
        audience: a.audienceType === "providerRules" ? "provider" : "everyone",
        placements: a.placements ?? [], freqCap: a.perUserFrequencyCap ?? null,
        publish: a.publishMode === "scheduled" ? "later" : "now",
        availableFrom: ymd(a.scheduledAt), expiresOn: ymd(a.expiresAt),
        createdBy: who(a.createdBy), createdOn: fmt(a.createdAt), updatedBy: who(a.updatedBy), updatedOn: fmt(a.updatedAt),
    };
};

// Blank optional fields are omitted on create and sent as null on edit so they clear.
function toPayload(i: ProductInput, isEdit: boolean) {
    const clear = isEdit ? null : undefined;
    const opt = (s: string) => { const t = s.trim(); return t ? t : clear; };
    const later = i.publish === "later";
    const dv = num(i.discountValue);
    const hasDisc = dv > 0;
    return JSON.stringify({
        name: i.name.trim(),
        category: i.categoryId,
        providerId: opt(i.providerId),
        marketplace: {
            imageBackgroundColor: opt(i.imageBg),
            shortDescription: opt(i.shortDescription),
            longDescription: opt(i.longDescription),
            pricingRenewalContent: opt(i.pricingContent),
        },
        dashboard: {
            template: opt(i.template),
            title: opt(i.dashTitle),
            callToAction: opt(i.cta),
            featureTitle: opt(i.featureTitle),
            shortDescription: opt(i.dashShort),
        },
        retailPrice: i.retail.trim() ? num(i.retail) : clear,
        discountType: hasDisc ? (i.discountType === "percent" ? API_PERCENT : API_FIXED) : clear,
        discountValue: hasDisc ? dv : clear,
        bundled: i.bundleIds,
        audienceType: i.audience === "provider" ? "providerRules" : "everyone",
        placements: i.placements,
        perUserFrequencyCap: i.freqCap.trim() ? Math.floor(num(i.freqCap)) : clear,
        publishMode: later ? "scheduled" : "immediate",
        scheduledAt: later && i.availableFrom ? atDate(i.availableFrom) : clear,
        expiresAt: later && i.expires && i.expiresOn ? atDate(i.expiresOn, true) : clear,
    });
}

interface Wrapped<T> {
    success: boolean;
    message?: string;
    data: T;
    meta?: { total: number; page: number; limit: number; totalPages: number };
}

// success true -> return the response; success false -> throw so the page shows the message
async function call<T>(path: string, init?: RequestInit): Promise<Wrapped<T>> {
    const r = await apiFetch<Wrapped<T>>(path, init);
    if (!r.success) throw new Error(r.message || "Request failed");
    return r;
}

export const productsService = {
    /** Pulls every page (100 per request) so the list can filter and paginate on the client. */
    async list(): Promise<ProductRec[]> {
        const out: ApiProduct[] = [];
        let page = 1;
        for (; ;) {
            const r = await call<ApiProduct[]>(`/products/get-all-products?page=${page}&limit=100`);
            out.push(...r.data);
            if (!r.data.length || page >= (r.meta?.totalPages ?? 1)) break;
            page++;
        }
        return out.map(toUi);
    },
    get: (id: string) => call<ApiProduct>(`/products/${id}/get-product`).then((r) => toUi(r.data)),
    create: (i: ProductInput) =>
        call<ApiProduct>("/products/create-product", { method: "POST", body: toPayload(i, false) }).then((r) => toUi(r.data)),
    update: (id: string, i: ProductInput) =>
        call<ApiProduct>(`/products/${id}/update-product`, { method: "PATCH", body: toPayload(i, true) }).then((r) => toUi(r.data)),
    publish: (id: string) =>
        call<ApiProduct>(`/products/${id}/publish-product`, { method: "POST", body: "{}" }).then((r) => toUi(r.data)),
    remove: (id: string) =>
        call<{ deleted: boolean }>(`/products/${id}/remove-product`, { method: "DELETE" }).then((r) => r.data),
};