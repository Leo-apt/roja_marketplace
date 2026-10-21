import { apiCall, type Wrapped } from "./auth.service";
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
export interface CategoryInput { name: string; slug: string; description: string; bgColor: string }

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
    });
};

let listInflight: Promise<CategoryRec[]> | null = null; // shares one request between overlapping calls

// pulls every page (100 per request), same approach as the products list
type CategoryPage = ApiCategory[] | { data: ApiCategory[]; total: number };

// the list comes back as { data, total, ... } inside the wrapper's data; a plain array (with meta) also works
const unpack = (r: Wrapped<CategoryPage>) => {
    const d = r.data;
    return Array.isArray(d)
        ? { items: d, total: r.meta?.total ?? d.length }
        : { items: d.data, total: d.total };
};

async function fetchAll(): Promise<CategoryRec[]> {
    const out: ApiCategory[] = [];
    for (let page = 1; ; page++) {
        const { items } = unpack(await apiCall<CategoryPage>(`/categories/get-all-categories?page=${page}&limit=100`));
        out.push(...items);
        if (items.length < 100) break; // last page
    }
    return out.map(toUi);
}

export const categoriesService = {
    list: () => (listInflight ??= fetchAll().finally(() => { listInflight = null; })),
    // one page at a time, with the backend search (name, description, hex code)
    listPage: (page: number, limit: number, search = "") =>
        apiCall<CategoryPage>(`/categories/get-all-categories?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`)
            .then((r) => { const p = unpack(r); return { rows: p.items.map(toUi), total: p.total }; }),
    get: (id: string) => apiCall<ApiCategory>(`/categories/${id}/get-categories`).then((r) => toUi(r.data)),
    create: (i: CategoryInput) =>
        apiCall<ApiCategory>("/categories/create-categories", { method: "POST", body: payload(i, false) }).then((r) => toUi(r.data)),
    update: (id: string, i: CategoryInput) =>
        apiCall<ApiCategory>(`/categories/${id}/update-categories`, { method: "PATCH", body: payload(i, true) }).then((r) => toUi(r.data)),
    remove: (id: string) =>
        apiCall<{ deleted: boolean }>(`/categories/${id}/remove-categories`, { method: "DELETE" }).then((r) => r.data),
};