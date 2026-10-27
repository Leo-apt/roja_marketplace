import { apiCall } from "@/services/auth.service";
import { fmt, who } from "@/services/categories.service";
import type { Status } from "@/data/catalog";

export interface ProviderRec {
    id: string; providerId: string; name: string; email: string; phone: string; logoUrl: string; status: Status; isActive: boolean;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export interface ProviderInput { name: string; email: string; phone: string; logoFile: File | null; credentials?: ProviderCreds[] }

export interface ProviderCreds {
    mode: "live" | "sandbox"; apiUrl: string; tokenUrl: string; clientId: string;
    clientSecret: string; refreshToken: string; instanceUrl: string;
}
export interface CredsView { creds: ProviderCreds; hasSecret: boolean; hasRefresh: boolean }

interface ApiProvider {
    id: string; providerId?: string; name: string; phone?: string; email?: string; logo?: string; isActive: boolean;
    createdAt?: string; updatedAt?: string; createdBy?: unknown; updatedBy?: unknown;
}
interface ApiCredView {
    mode: "live" | "sandbox"; apiUrl?: string; tokenUrl?: string; clientId?: string;
    instanceUrl?: string; clientSecret?: string; refreshToken?: string;
    hasClientSecret?: boolean; hasRefreshToken?: boolean;
}

const toUi = (a: ApiProvider): ProviderRec => ({
    id: a.id, providerId: a.providerId ?? "", name: a.name, email: a.email ?? "", phone: a.phone ?? "",
    logoUrl: a.logo ?? "", status: a.isActive ? "Active" : "Inactive", isActive: a.isActive,
    createdBy: who(a.createdBy), createdOn: fmt(a.createdAt), updatedBy: who(a.updatedBy), updatedOn: fmt(a.updatedAt),
});

const toForm = (i: ProviderInput) => {
    const f = new FormData();
    f.append("name", i.name.trim());
    f.append("email", i.email.trim());
    f.append("phone", i.phone);
    if (i.logoFile) f.append("logo", i.logoFile);
    if (i.credentials) {
        // multipart can only carry text, so the sandbox + live list goes as one JSON string
        f.append("credentials", JSON.stringify(i.credentials.map((c) => ({
            mode: c.mode, apiUrl: c.apiUrl.trim(), tokenUrl: c.tokenUrl.trim(), clientId: c.clientId.trim(),
            clientSecret: c.clientSecret.trim(), refreshToken: c.refreshToken.trim(), instanceUrl: c.instanceUrl.trim(),
        }))));
    }
    return f;
};

const FIELDS = ["apiUrl", "tokenUrl", "clientId", "clientSecret", "refreshToken", "instanceUrl"] as const;

const toCredsView = (c: ApiCredView | undefined): CredsView | null => {
    if (!c) return null;
    return {
        creds: {
            mode: c.mode, apiUrl: c.apiUrl ?? "", tokenUrl: c.tokenUrl ?? "", clientId: c.clientId ?? "",
            clientSecret: c.clientSecret ?? "", refreshToken: c.refreshToken ?? "", instanceUrl: c.instanceUrl ?? "",
        },
        hasSecret: !!c.clientSecret, hasRefresh: !!c.refreshToken,
    };
};

export const providersService = {
    // the backend has no paging or search, so both are done here
    listPage: async (page: number, limit: number, search = "") => {
        const r = await apiCall<ApiProvider[]>("/providers/get-all-providers");
        const t = search.trim().toLowerCase();
        const all = r.data.map(toUi).filter((p) => !t || [p.name, p.email, p.providerId, p.phone].some((x) => x.toLowerCase().includes(t)));
        return { rows: all.slice((page - 1) * limit, page * limit), total: all.length };
    },
    get: (id: string) => apiCall<ApiProvider>(`/providers/${id}/get-providers`).then((r) => toUi(r.data)),
    create: (i: ProviderInput) =>
        apiCall<ApiProvider>("/providers/create-providers", { method: "POST", body: toForm(i) }).then((r) => toUi(r.data)),
    update: (id: string, i: ProviderInput) =>
        apiCall<ApiProvider>(`/providers/${id}/update-providers`, { method: "PATCH", body: toForm(i) }).then((r) => toUi(r.data)),

    setStatus: (id: string, isActive: boolean) =>
        apiCall<ApiProvider>(`/providers/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),

    // ONE call: the provider plus the saved credentials of both modes
    getWithCreds: async (id: string) => {
        const r = await apiCall<ApiProvider & { credentials?: ApiCredView[] }>(`/providers/${id}/get-providers`);
        const find = (m: ProviderCreds["mode"]) => toCredsView(r.data.credentials?.find((x) => x.mode === m));
        return { rec: toUi(r.data), sandbox: find("sandbox"), live: find("live") };
    },

    // first save = PUT, later saves = PATCH (empty fields are not sent, so saved secrets stay)
    saveCreds: async (id: string, c: ProviderCreds, exists: boolean) => {
        const body: Record<string, string> = {};
        for (const k of FIELDS) { const v = c[k].trim(); if (v) body[k] = v; }
        await apiCall(`/providers/${id}/credentials/${c.mode}`, { method: exists ? "PATCH" : "PUT", body: JSON.stringify(body) });
    },
};