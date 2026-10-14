import { apiCall } from "./auth.service";
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
    _id: string; providerId: string; offerType: string; name: string; category?: string; baseScore?: number;
    thresholds: { show: number; review: number; hide?: number };
    signals?: ApiSignal[]; status: "active" | "inactive";
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

export interface EngineConfigInput {
    providerId: string; offerType: string; name: string; category: string; baseScore: string;
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
    id: a._id, name: a.name, providerId: a.providerId, offerType: a.offerType, category: a.category ?? "",
    baseScore: str(a.baseScore), show: str(a.thresholds?.show), review: str(a.thresholds?.review), hide: str(a.thresholds?.hide),
    status: a.status === "inactive" ? "Inactive" : "Active",
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
    providerId: i.providerId, offerType: i.offerType, name: i.name.trim(), category: i.category.trim(),
    baseScore: num(i.baseScore),
    thresholds: { show: num(i.show), review: num(i.review), hide: num(i.hide) },
    status: i.status === "Active" ? "active" : "inactive",
});

export const engineConfigsService = {
    list: () => apiCall<ApiConfig[]>(`${BASE}/get-all-configs?limit=100`).then((r) => r.data.map(toUi)),
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
    remove: (id: string) => apiCall<{ deleted: boolean }>(`${BASE}/${id}/remove-config`, { method: "DELETE" }).then((r) => r.data),
};