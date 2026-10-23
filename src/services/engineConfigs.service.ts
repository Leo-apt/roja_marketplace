import { apiCall, type Wrapped } from "./auth.service";
import { fmt, who } from "./categories.service";
import type { Status } from "@/data/catalog";
import { newUid, type EngineConfig, type Signal, type WeightType } from "@/data/engine";
import { num } from "@/utils/catalog";

const BASE = "/product-engine-configs";

interface ApiSignal {
    signalId: string; label?: string; minCount?: number;
    match?: { topCategory?: string[]; code?: string[]; mcc?: string[]; keywords?: string[]; flags?: string[]; sameAs?: string; contextField?: string };
    weightType: string; weightValue?: number;
    cap?: number; divisor?: number; multiplier?: number; reference?: number; trigger?: number;
}
interface ApiConfig {
    _id: string; providerId: string; name: string; category?: string; baseScore?: number;
    thresholds: { show: number; review: number; hide?: number };
    signals?: ApiSignal[]; status: boolean | "active" | "inactive";
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface EngineConfigInput {
    providerId: string; name: string; category: string; baseScore: string;
    show: string; review: string; hide: string; status: Status; signals: Signal[];
}

const str = (n?: number | null) => (n == null ? "" : String(n));
const list = (a?: string[]) => (a ?? []).join(", ");        // ["5995","0742"] -> "5995, 0742"
const optNum = (s: string) => (s.trim() ? num(s) : undefined);

const toSignal = (s: ApiSignal): Signal => ({
    uid: newUid(), preset: "", signalId: s.signalId, label: s.label ?? "", minCount: str(s.minCount),
    topCategory: list(s.match?.topCategory), code: list(s.match?.code), mcc: list(s.match?.mcc),
    keywords: list(s.match?.keywords), flags: list(s.match?.flags),
    sameAs: s.match?.sameAs ?? "", contextField: s.match?.contextField ?? "",
    weightType: s.weightType as WeightType, value: str(s.weightValue),
    cap: str(s.cap), divisor: str(s.divisor), multiplier: str(s.multiplier),
    reference: str(s.reference), trigger: str(s.trigger),
});

const toUi = (a: ApiConfig): EngineConfig => ({
    id: a._id, name: a.name, providerId: a.providerId, category: a.category ?? "",
    baseScore: str(a.baseScore), show: str(a.thresholds?.show), review: str(a.thresholds?.review), hide: str(a.thresholds?.hide),
    status: a.status === false || a.status === "inactive" ? "Inactive" : "Active",
    signals: (a.signals ?? []).map(toSignal),
    createdBy: who(a.createdBy), updatedBy: who(a.updatedBy), createdOn: fmt(a.createdAt), updatedOn: fmt(a.updatedAt),
});

const toSignalPayload = (s: Signal) => ({
    signalId: s.signalId.trim(),
    label: s.label.trim() || undefined,
    minCount: s.minCount.trim() ? Math.trunc(num(s.minCount)) : undefined,
    match: {
        topCategory: s.topCategory, code: s.code, mcc: s.mcc, keywords: s.keywords, flags: s.flags, // backend splits "a, b" itself
        sameAs: s.sameAs.trim() || undefined, contextField: s.contextField.trim() || undefined,
    },
    weightType: s.weightType,
    weightValue: optNum(s.value),
    // not in backend yet: sent anyway, backend ignores them for now
    cap: optNum(s.cap), divisor: optNum(s.divisor), multiplier: optNum(s.multiplier),
    reference: optNum(s.reference), trigger: optNum(s.trigger),
});

const toConfigPayload = (i: EngineConfigInput) => ({
    providerId: i.providerId, name: i.name.trim(), category: i.category.trim(),
    baseScore: num(i.baseScore),
    thresholds: { show: num(i.show), review: num(i.review), hide: num(i.hide) },
    status: i.status === "Active",
});

type ConfigPage = ApiConfig[] | { data: ApiConfig[]; total: number };

// the list comes back as { data, total, ... } inside the wrapper's data; a plain array (with meta) also works
const unpack = (r: Wrapped<ConfigPage>) => {
    const d = r.data;
    return Array.isArray(d)
        ? { items: d, total: r.meta?.total ?? d.length }
        : { items: d.data, total: d.total };
};

export const engineConfigsService = {
    // every page (100 per request)
    list: async () => {
        const out: ApiConfig[] = [];
        for (let page = 1; ; page++) {
            const { items } = unpack(await apiCall<ConfigPage>(`${BASE}/get-all-configs?page=${page}&limit=100`));
            out.push(...items);
            if (items.length < 100) break; // last page
        }
        return out.map(toUi);
    },
    // one page, with the backend search (name, provider id)
    listPage: (page: number, limit: number, search = "") => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) qs.set("search", search);
        return apiCall<ConfigPage>(`${BASE}/get-all-configs?${qs}`)
            .then((r) => { const p = unpack(r); return { rows: p.items.map(toUi), total: p.total }; });
    },
    get: (id: string) => apiCall<ApiConfig>(`${BASE}/${id}/get-config`).then((r) => toUi(r.data)),
    create: (i: EngineConfigInput) =>
        apiCall<ApiConfig>(`${BASE}/create-config`, {
            method: "POST", body: JSON.stringify({ ...toConfigPayload(i), signals: i.signals.map(toSignalPayload) }),
        }).then((r) => toUi(r.data)),
    // backend update DTO has no signals, so edit = 2 calls
    update: async (id: string, i: EngineConfigInput) => {
        await apiCall<ApiConfig>(`${BASE}/${id}/update-config`, { method: "PATCH", body: JSON.stringify(toConfigPayload(i)) });
        const r = await apiCall<ApiConfig>(`${BASE}/${id}/save-signals`, {
            method: "PUT", body: JSON.stringify({ signals: i.signals.map(toSignalPayload) }),
        });
        return toUi(r.data);
    },
    setStatus: (id: string, active: boolean) =>
        apiCall<ApiConfig>(`${BASE}/${id}/update-config`, { method: "PATCH", body: JSON.stringify({ status: active }) }),
    remove: (id: string) => apiCall<{ deleted: boolean }>(`${BASE}/${id}/remove-config`, { method: "DELETE" }).then((r) => r.data),
};