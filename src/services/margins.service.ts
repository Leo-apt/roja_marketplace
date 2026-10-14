import { apiCall } from "./auth.service";
import { fmt, who } from "./categories.service";
import { productsService, type ProductRec, type ProductStatus } from "./products.service";
import { calcMargin, num } from "@/utils/catalog";

interface ApiMargin {
    _id: string;
    product: { _id: string; name?: string; retailPrice?: number | null } | string | null;
    wholesalePrice: number; retailPrice: number;
    markupType: "flat" | "percent"; markupValue: number;
    markupAmount: number; markupPercent: number; buyRate: number; marginVsRetail: number | null;
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface MarginRec {
    id: string; productId: string; product: string;
    wholesale: number; retail: number; markupType: "flat" | "percent"; markupValue: number;
    markupAmount: number; markupPercent: number; buyRate: number; marginVsRetail: number | null;
    features: string[]; status: ProductStatus | null; // features and status come from the linked product
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}

export interface MarginInput {
    productId: string; wholesale: string; retail: string; markupType: "flat" | "percent"; markup: string;
}

const productIdOf = (a: ApiMargin) => (typeof a.product === "string" ? a.product : a.product?._id ?? "");

const toUi = (a: ApiMargin, prod?: ProductRec): MarginRec => ({
    id: a._id,
    productId: productIdOf(a),
    product: a.product && typeof a.product === "object" && a.product.name ? a.product.name : prod?.name ?? "-",
    wholesale: a.wholesalePrice, retail: a.retailPrice, markupType: a.markupType, markupValue: a.markupValue,
    markupAmount: a.markupAmount, markupPercent: a.markupPercent, buyRate: a.buyRate, marginVsRetail: a.marginVsRetail ?? null,
    features: prod?.bundles.map((b) => b.name || b.shortCode) ?? [],
    status: prod?.status ?? null,
    createdBy: who(a.createdBy), createdOn: fmt(a.createdAt), updatedBy: who(a.updatedBy), updatedOn: fmt(a.updatedAt),
});

// marginVsRetail = retail - (wholesale + markup), same formula as the backend's buyRate
const marginOf = (i: MarginInput) => calcMargin(num(i.wholesale), num(i.retail), num(i.markup), i.markupType).margin;

const createBody = (i: MarginInput) =>
    JSON.stringify({
        product: i.productId,
        wholesalePrice: num(i.wholesale),
        retailPrice: num(i.retail),
        markupType: i.markupType,
        markupValue: num(i.markup),
        marginVsRetail: marginOf(i),
    });

// UpdateMarginDto has no product; the backend also ignores retailPrice on update
const updateBody = (i: MarginInput) =>
    JSON.stringify({ wholesalePrice: num(i.wholesale), markupType: i.markupType, markupValue: num(i.markup), marginVsRetail: marginOf(i) });

export const marginsService = {
    async list(): Promise<MarginRec[]> {
        const [ms, ps] = await Promise.all([
            apiCall<ApiMargin[]>("/margins/get-all-margins"),
            productsService.list().catch(() => [] as ProductRec[]), // features/status are optional extras
        ]);
        const byId = new Map(ps.map((p) => [p.id, p]));
        return ms.data.map((a) => toUi(a, byId.get(productIdOf(a))));
    },
    async get(id: string): Promise<MarginRec> {
        const a = (await apiCall<ApiMargin>(`/margins/${id}/get-margin`)).data;
        const pid = productIdOf(a);
        const prod = pid ? await productsService.get(pid).catch(() => undefined) : undefined;
        return toUi(a, prod);
    },
    /** Product ids that already have a margin (one margin per product). */
    usedProductIds: () => apiCall<ApiMargin[]>("/margins/get-all-margins").then((r) => r.data.map(productIdOf)),
    create: (i: MarginInput) =>
        apiCall<ApiMargin>("/margins/create-margin", { method: "POST", body: createBody(i) }).then((r) => toUi(r.data)),
    update: (id: string, i: MarginInput) =>
        apiCall<ApiMargin>(`/margins/${id}/update-margin`, { method: "PATCH", body: updateBody(i) }).then((r) => toUi(r.data)),
    remove: (id: string) =>
        apiCall<{ deleted: boolean }>(`/margins/${id}/remove-margin`, { method: "DELETE" }).then((r) => r.data),
};