import { apiCall } from "./auth.service";
import type { Status } from "@/data/catalog";

interface ApiCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    backgroundColor?: string;
    status: boolean;
    createdBy: unknown;
    updatedBy: unknown;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryRec {
    id: string; name: string; slug: string; description: string; bgColor: string; status: Status;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export interface CategoryInput { name: string; slug: string; description: string; bgColor: string; status: Status }

// createdBy/updatedBy arrive as raw ids today; if the backend populates them, the name is used.
export const who = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name);
    return "N/A";
};
export const fmt = (iso?: string) =>
    iso
        ? new Date(iso).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", "")
        : "N/A";

const toUi = (a: ApiCategory): CategoryRec => ({
    id: a._id,
    name: a.name,
    slug: a.slug,
    description: a.description ?? "",
    bgColor: a.backgroundColor ?? "",
    status: a.status ? "Active" : "Inactive",
    createdBy: who(a.createdBy),
    createdOn: fmt(a.createdAt),
    updatedBy: who(a.updatedBy),
    updatedOn: fmt(a.updatedAt),
});

// Blank color is omitted on create and sent as null on edit so it clears.
const payload = (i: CategoryInput, isEdit: boolean) => {
    const bg = i.bgColor.trim();
    return JSON.stringify({
        name: i.name.trim(),
        slug: i.slug.trim(),
        description: i.description.trim(),
        backgroundColor: bg ? bg : isEdit ? null : undefined,
        status: i.status === "Active",
    });
};

let listInflight: Promise<CategoryRec[]> | null = null; // shares one request between overlapping calls

export const categoriesService = {
    list: () =>
    (listInflight ??= apiCall<ApiCategory[]>("/categories/get-all-categories")
        .then((r) => r.data.map(toUi))
        .finally(() => { listInflight = null; })),
    get: (id: string) => apiCall<ApiCategory>(`/categories/${id}/get-categories`).then((r) => toUi(r.data)),
    create: (i: CategoryInput) =>
        apiCall<ApiCategory>("/categories/create-categories", { method: "POST", body: payload(i, false) }).then((r) => toUi(r.data)),
    update: (id: string, i: CategoryInput) =>
        apiCall<ApiCategory>(`/categories/${id}/update-categories`, { method: "PATCH", body: payload(i, true) }).then((r) => toUi(r.data)),
    remove: (id: string) =>
        apiCall<{ deleted: boolean }>(`/categories/${id}/remove-categories`, { method: "DELETE" }).then((r) => r.data),
};