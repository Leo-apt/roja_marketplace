import { apiCall } from "@/services/auth.service";
import { fmt, who } from "@/services/categories.service";
import type { Status } from "@/data/catalog";

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type Method = (typeof METHODS)[number];

export interface DocHeader { field: string; type: string; details: string }
export interface DocParam { field: string; type: string; required: boolean; details: string }
export interface DocResponse { code: string; subject: string; details: string }

export interface DocRec {
    id: string; name: string; service: string; method: Method; url: string; description: string;
    providerId: string; providerName: string;
    headers: DocHeader[]; body: DocParam[]; responses: DocResponse[];
    requestExample: string; responseExample: string;
    status: Status; isActive: boolean;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export interface DocInput {
    name: string; service: string; method: Method; url: string; description: string; providerId: string | null;
    headers: DocHeader[]; body: DocParam[]; responses: DocResponse[];
    requestExample: string; responseExample: string; isActive: boolean;
}

interface ApiDocRow {
    id: string; name: string; service?: string; method: Method; url: string; description?: string;
    providerId?: string | null; providerName?: string | null;
    headers?: DocHeader[]; body?: DocParam[]; responses?: DocResponse[];
    requestExample?: string; responseExample?: string; isActive: boolean;
    createdAt?: string; updatedAt?: string; createdBy?: unknown; updatedBy?: unknown;
}

const toUi = (a: ApiDocRow): DocRec => ({
    id: a.id, name: a.name, service: a.service ?? "", method: a.method, url: a.url, description: a.description ?? "",
    providerId: a.providerId ?? "", providerName: a.providerName ?? "",
    headers: a.headers ?? [], body: a.body ?? [], responses: a.responses ?? [],
    requestExample: a.requestExample ?? "", responseExample: a.responseExample ?? "",
    status: a.isActive ? "Active" : "Inactive", isActive: a.isActive,
    createdBy: who(a.createdBy), createdOn: fmt(a.createdAt), updatedBy: who(a.updatedBy), updatedOn: fmt(a.updatedAt),
});

export const docsService = {
    // the Documents page uses this (all docs, grouped by provider there)
    all: () => apiCall<ApiDocRow[]>("/api-docs").then((r) => r.data.map(toUi)),

    // the backend has no paging or search, so both are done here (same as providers)
    listPage: async (page: number, limit: number, search = "", method = "all", status = "all") => {
        const all = await docsService.all();
        const t = search.trim().toLowerCase();
        const rows = all.filter((d) =>
            (!t || [d.name, d.url, d.method, d.providerName].some((x) => x.toLowerCase().includes(t))) &&
            (method === "all" || d.method === method) &&
            (status === "all" || d.status === status));
        return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length };
    },
    get: (id: string) => apiCall<ApiDocRow>(`/api-docs/${id}`).then((r) => toUi(r.data)),
    create: (i: DocInput) =>
        apiCall<ApiDocRow>("/api-docs", { method: "POST", body: JSON.stringify(i) }).then((r) => toUi(r.data)),
    update: (id: string, i: DocInput) =>
        apiCall<ApiDocRow>(`/api-docs/${id}`, { method: "PATCH", body: JSON.stringify(i) }).then((r) => toUi(r.data)),
    setStatus: (id: string, isActive: boolean) =>
        apiCall(`/api-docs/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    remove: (id: string) => apiCall(`/api-docs/${id}`, { method: "DELETE" }),
};