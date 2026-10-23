// History API: clients, environments, call list and one call's details.
import { apiCall } from "@/services/auth.service";

export interface Paid { currency: string; amount: number }
export interface Stats { calls: number; failed: number; lastAt: string | null; paid: Paid[] }
export interface HistoryClient { id: string; name: string; isActive: boolean; environmentsCount: number; sandbox: Stats; live: Stats }
export interface HistoryEnv { id: string; name: string; isActive: boolean; sandbox: Stats; live: Stats }
export interface HistoryRow {
    _id: string; entityId: string; subEntityId: string; keyId: string; environment: "sandbox" | "live";
    action: string; entityType?: string; stripeObjectId?: string; customerId?: string;
    status: "success" | "failed"; statusCode?: number; errorMessage?: string;
    amount?: number | null; currency?: string; createdAt: string;
}
export interface HistoryDetail extends HistoryRow { requestBody: unknown; responseBody: unknown }
export interface HistoryQuery {
    subEntityId: string; env: "sandbox" | "live"; action?: string; status?: string; from?: string; to?: string;
    page: number; limit: number;
}

export const historyService = {
    clients: () => apiCall<HistoryClient[]>("/history/clients").then((r) => r.data),
    environments: (entityId: string) =>
        apiCall<HistoryEnv[]>(`/history/clients/${entityId}/environments`).then((r) => r.data),
    list: (q: HistoryQuery) => {
        const qs = new URLSearchParams({ subEntityId: q.subEntityId, env: q.env, page: String(q.page), limit: String(q.limit) });
        if (q.action) qs.set("action", q.action);
        if (q.status) qs.set("status", q.status);
        if (q.from) qs.set("from", q.from);
        if (q.to) qs.set("to", q.to);
        return apiCall<HistoryRow[]>(`/history?${qs}`).then((r) => ({ rows: r.data, total: r.meta?.total ?? r.data.length }));
    },
    get: (id: string) => apiCall<HistoryDetail>(`/history/${id}`).then((r) => r.data),
};