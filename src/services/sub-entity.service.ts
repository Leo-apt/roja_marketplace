import { apiCall } from "@/services/auth.service";

interface ApiSub {
    _id?: string; id?: string; name: string; description?: string;
    products?: (string | { _id?: string; id?: string })[];
    providerIds?: (string | { _id?: string; id?: string })[];
}
export interface SubEntityUi { id: string; name: string; description: string; productIds: string[]; providerIds: string[] }

const toUi = (x: ApiSub): SubEntityUi => ({
    id: x._id ?? x.id ?? "",
    name: x.name,
    description: x.description ?? "",
    providerIds: (x.providerIds ?? []).map((p) => (typeof p === "string" ? p : p._id ?? p.id ?? "")).filter(Boolean),
    productIds: (x.products ?? []).map((p) => (typeof p === "string" ? p : p._id ?? p.id ?? "")).filter(Boolean),
});

export const subEntityService = {
    list: (entityId: string) =>
        apiCall<ApiSub[]>(`/sub-entities/${entityId}/get-all-sub-entities`).then((r) => r.data.map(toUi).reverse()),

    create: (entityId: string, p: { name: string; description: string; providerIds: string[] }) =>
        apiCall<ApiSub>(`/sub-entities/${entityId}/create-sub-entity`, {
            method: "POST", body: JSON.stringify(p),
        }).then((r) => toUi(r.data)),

    saveProducts: (id: string, productIds: string[]) =>
        apiCall<ApiSub>(`/sub-entities/${id}/save-products`, {
            method: "PUT", body: JSON.stringify({ productIds }),
        }).then((r) => toUi(r.data)),

    update: (id: string, p: { name: string; description: string; providerIds: string[] }) =>
        apiCall<ApiSub>(`/sub-entities/${id}/update-sub-entity`, {
            method: "PATCH", body: JSON.stringify(p),
        }).then((r) => toUi(r.data)),
};