import { apiCall, ApiError } from "@/services/auth.service";
import type { Status } from "@/data/catalog";

const API = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

export interface ProviderRec {
    id: string; providerId: string; name: string; email: string; phone: string; logoUrl: string; status: Status;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export interface ProviderInput { name: string; email: string; phone: string; logoFile: File | null }

export interface ProviderCreds {
    mode: "live" | "sandbox"; apiUrl: string; tokenUrl: string; clientId: string;
    clientSecret: string; refreshToken: string; instanceUrl: string;
}
export interface CredsView { creds: ProviderCreds; hasSecret: boolean; hasRefresh: boolean }

interface ApiProvider { id: string; providerId?: string; name: string; phone?: string; email?: string; logo?: string; isActive: boolean }
interface ApiCred {
    mode: "live" | "sandbox"; apiUrl?: string; tokenUrl?: string; clientId?: string;
    hasClientSecret: boolean; hasRefreshToken: boolean; instanceUrl?: string;
}

const toUi = (a: ApiProvider): ProviderRec => ({
    id: a.id, providerId: a.providerId ?? "", name: a.name, email: a.email ?? "", phone: a.phone ?? "",
    logoUrl: a.logo ? `${API}${a.logo}` : "", status: a.isActive ? "Active" : "Inactive",
    createdBy: "N/A", createdOn: "N/A", updatedBy: "N/A", updatedOn: "N/A",
});

const toForm = (i: ProviderInput) => {
    const f = new FormData();
    f.append("name", i.name.trim());
    f.append("email", i.email.trim());
    f.append("phone", i.phone);
    if (i.logoFile) f.append("logo", i.logoFile);
    return f;
};

const FIELDS = ["apiUrl", "tokenUrl", "clientId", "clientSecret", "refreshToken", "instanceUrl"] as const;

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

    // 404 means no credentials saved yet for this mode
    getCreds: async (id: string, mode: ProviderCreds["mode"]): Promise<CredsView | null> => {
        try {
            const r = (await apiCall<ApiCred>(`/providers/${id}/credentials/${mode}/update-provider-credential`)).data;
            return {
                creds: {
                    mode, apiUrl: r.apiUrl ?? "", tokenUrl: r.tokenUrl ?? "", clientId: r.clientId ?? "",
                    clientSecret: "", refreshToken: "", instanceUrl: r.instanceUrl ?? "",
                },
                hasSecret: r.hasClientSecret, hasRefresh: r.hasRefreshToken,
            };
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) return null;
            throw e;
        }
    },
    // first save = PUT, later saves = PATCH (empty fields are not sent, so saved secrets stay)
    saveCreds: async (id: string, c: ProviderCreds, exists: boolean) => {
        const body: Record<string, string> = {};
        for (const k of FIELDS) { const v = c[k].trim(); if (v) body[k] = v; }
        await apiCall(`/providers/${id}/credentials/${c.mode}`, { method: exists ? "PATCH" : "PUT", body: JSON.stringify(body) });
    },
};