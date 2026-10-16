import { apiCall } from "./auth.service";
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
    wholesalePrice?: number | null; markupType?: "flat" | "percent" | null; markupValue?: number | null;
    markupAmount?: number | null; markupPercent?: number | null; buyRate?: number | null; marginVsRetail?: number | null;
    bundled?: (Ref | string)[]; audienceType?: string; configurationId?: Ref | string | null; placements?: string[]; perUserFrequencyCap?: number | null;
    publishMode?: string; scheduledAt?: string | null; expiresAt?: string | null;
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface ProductRec {
    id: string; name: string; categoryId: string; categoryName: string; providerId: string; status: ProductStatus;
    termsUrl: string; imageUrl: string; imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    retail: number | null; discountType: DiscountType | ""; discountValue: number | null; sellingPrice: number | null;
    wholesale: number | null; markupType: "flat" | "percent"; markupValue: number | null;
    markupAmount: number | null; markupPercent: number | null; buyRate: number | null; marginVsRetail: number | null;
    bundles: { id: string; name: string; shortCode: string }[];
    audience: "everyone" | "provider"; configurationId: string; configurationName: string; placements: string[]; freqCap: number | null;
    publish: "now" | "later"; availableFrom: string; expiresOn: string;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}

export interface ProductInput {
    name: string; categoryId: string; providerId: string;
    imageBg: string; shortDescription: string; longDescription: string; pricingContent: string;
    template: string; dashTitle: string; cta: string; featureTitle: string; dashShort: string;
    retail: string; discountType: DiscountType; discountValue: string; bundleIds: string[];
    wholesale: string; markupType: "flat" | "percent"; markupValue: string;
    audience: "everyone" | "provider"; productConfig: string; placements: string[]; freqCap: string;
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
    const cfg = ref(a.configurationId ?? undefined);
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
        wholesale: a.wholesalePrice ?? null,
        markupType: a.markupType ?? "flat",
        markupValue: a.markupValue ?? null,
        markupAmount: a.markupAmount ?? null,
        markupPercent: a.markupPercent ?? null,
        buyRate: a.buyRate ?? null,
        marginVsRetail: a.marginVsRetail ?? null,
        bundles: (a.bundled ?? []).map(ref).filter((b): b is NonNullable<typeof b> => !!b),
        audience: a.audienceType === "providerRules" ? "provider" : "everyone",
        configurationId: cfg?.id ?? "", configurationName: cfg?.name ?? "",
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
        wholesalePrice: i.wholesale.trim() ? num(i.wholesale) : clear,
        markupType: i.markupType,
        markupValue: i.markupValue.trim() ? num(i.markupValue) : clear,
        bundled: i.bundleIds,
        audienceType: i.audience === "provider" ? "providerRules" : "everyone",
        configurationId: i.audience === "provider" ? opt(i.productConfig) : clear,
        placements: i.placements,
        perUserFrequencyCap: i.freqCap.trim() ? Math.floor(num(i.freqCap)) : clear,
        publishMode: later ? "scheduled" : "immediate",
        scheduledAt: later && i.availableFrom ? atDate(i.availableFrom) : clear,
        expiresAt: later && i.expires && i.expiresOn ? atDate(i.expiresOn, true) : clear,
    });
}

// Same helper the bundles and categories services use: returns the wrapped response ({ data }) and throws when success is false
const call = <T>(path: string, init?: RequestInit) => apiCall<T>(path, init);

export const productsService = {
    /** Pulls every page (100 per request) so the list can filter and paginate on the client. */
    async list(): Promise<ProductRec[]> {
        const out: ApiProduct[] = [];
        let page = 1;
        for (; ;) {
            const r = await call<ApiProduct[]>(`/products/get-all-products?page=${page}&limit=100`);
            out.push(...r.data);
            if (r.data.length < 100) break; // last page
            page++;
        }
        return out.map(toUi);
    },
    /** One server page, for the list screen. status is the API value: active | inactive | draft | scheduled. */
    listPage: (page = 1, limit = 8, search = "", status = "") => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) qs.set("search", search);
        if (status) qs.set("status", status);
        return call<ApiProduct[]>(`/products/get-all-products?${qs}`)
            .then((r) => ({ rows: r.data.map(toUi), total: r.meta?.total ?? r.data.length }));
    },
    /** Total records for a status (or all), used by the stat cards. */
    count: (status = "") => {
        const qs = new URLSearchParams({ page: "1", limit: "1" });
        if (status) qs.set("status", status);
        return call<ApiProduct[]>(`/products/get-all-products?${qs}`).then((r) => r.meta?.total ?? r.data.length);
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