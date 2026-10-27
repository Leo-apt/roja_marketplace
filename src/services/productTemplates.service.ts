import { apiCall, ApiError } from "@/services/auth.service";
import { who } from "@/services/categories.service";
import type { Status } from "@/data/catalog";

const BASE = "/product-templates";

export type ColorKey = "cardBg" | "buttonBg" | "buttonText" | "textPrimary" | "textSecondary";
export const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
    { key: "cardBg", label: "Card Background Color" },
    { key: "buttonBg", label: "Button Background" },
    { key: "buttonText", label: "Button Text color" },
    { key: "textPrimary", label: "Text Primary" },
    { key: "textSecondary", label: "Text Secondary" },
];

export interface TemplateRec extends Record<ColorKey, string> {
    id: string; name: string; status: Status; bgImageUrl: string; frontImageUrl: string;
    createdBy: string; createdAt: string; updatedBy: string; updatedAt: string;
}

export interface TemplateInput extends Record<ColorKey, string> {
    name: string; status: Status | ""; bgImage: File | null; frontImage: File | null;
}

/** Error tied to one form field so the form can focus it. */
export class TemplateError extends Error {
    field: string;
    constructor(field: string, message: string) { super(message); this.field = field; }
}

interface ApiTemplate extends Partial<Record<ColorKey, string>> {
    id: string; name: string; status: "active" | "inactive"; bgImage?: string; frontImage?: string;
    createdAt?: string; updatedAt?: string; createdBy?: unknown; updatedBy?: unknown;
}
type ApiPage = ApiTemplate[] | { data: ApiTemplate[]; total: number };

const toUi = (a: ApiTemplate): TemplateRec => ({
    id: a.id, name: a.name, status: (a.status === "active" ? "Active" : "Inactive") as Status,
    bgImageUrl: a.bgImage ?? "", frontImageUrl: a.frontImage ?? "",
    cardBg: a.cardBg ?? "", buttonBg: a.buttonBg ?? "", buttonText: a.buttonText ?? "",
    textPrimary: a.textPrimary ?? "", textSecondary: a.textSecondary ?? "",
    createdBy: who(a.createdBy), createdAt: a.createdAt ?? "", updatedBy: who(a.updatedBy), updatedAt: a.updatedAt ?? "",
});

const toForm = (i: TemplateInput) => {
    const f = new FormData();
    f.append("name", i.name.trim());
    f.append("status", String(i.status).toLowerCase());
    for (const c of COLOR_FIELDS) f.append(c.key, i[c.key].trim()); // empty = clears the colour
    if (i.bgImage) f.append("bgImage", i.bgImage);
    if (i.frontImage) f.append("frontImage", i.frontImage);
    return f;
};

// a duplicate name (409) is shown under the Template Name field
const fieldError = (e: unknown) => (e instanceof ApiError && e.status === 409 ? new TemplateError("name", e.message) : e);

export const productTemplatesService = {
    async listPage(page = 1, limit = 10, search = "") {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) qs.set("search", search);
        const r = await apiCall<ApiPage>(`${BASE}/get-all-product-templates?${qs}`);
        const d = r.data;
        const items = Array.isArray(d) ? d : d.data;
        const total = Array.isArray(d) ? (r.meta?.total ?? d.length) : d.total;
        return { rows: items.map(toUi), total };
    },
    get: (id: string) => apiCall<ApiTemplate>(`${BASE}/${id}/get-product-template`).then((r) => toUi(r.data)),
    setStatus: (id: string, active: boolean) => {
        const f = new FormData();
        f.append("status", active ? "active" : "inactive");
        return apiCall<ApiTemplate>(`${BASE}/${id}/update-product-template`, { method: "PATCH", body: f });
    },
    create: (i: TemplateInput) =>
        apiCall<ApiTemplate>(`${BASE}/create-product-template`, { method: "POST", body: toForm(i) })
            .then((r) => toUi(r.data)).catch((e) => { throw fieldError(e); }),
    update: (id: string, i: TemplateInput) =>
        apiCall<ApiTemplate>(`${BASE}/${id}/update-product-template`, { method: "PATCH", body: toForm(i) })
            .then((r) => toUi(r.data)).catch((e) => { throw fieldError(e); }),
};