import { apiCall } from "@/services/auth.service";
import type { Status } from "@/data/catalog";
import type { Instance } from "@/data/instances";

interface ApiEntity {
    _id?: string; id?: string; name: string;
    description?: string; imageUrl?: string; status: "active" | "inactive";
}

const toUi = (x: ApiEntity): Instance => ({
    id: x._id ?? x.id ?? "",
    name: x.name,
    description: x.description ?? "",
    imageUrl: x.imageUrl ?? "",
    status: x.status === "active" ? "Active" : "Inactive",
    products: [], // backend has no products yet
});
const toApiStatus = (s: Status) => (s === "Active" ? "active" : "inactive");

export const entityService = {
    list: () => apiCall<ApiEntity[]>("/entities/get-all-entities").then((r) => r.data.map(toUi)),

    get: (id: string) => apiCall<ApiEntity>(`/entities/${id}/get-entity`).then((r) => toUi(r.data)),

    create: (d: { name: string; description: string; imageUrl: string }) =>
        apiCall<ApiEntity>("/entities/create-entity", {
            method: "POST",
            body: JSON.stringify({
                name: d.name,
                description: d.description,
                ...(d.imageUrl ? { imageUrl: d.imageUrl } : {}),
            }),
        }).then((r) => toUi(r.data)),

    update: (id: string, p: { name?: string; description?: string; imageUrl?: string; status?: Status }) =>
        apiCall<ApiEntity>(`/entities/${id}/update-entity`, {
            method: "PATCH",
            body: JSON.stringify({ ...p, ...(p.status ? { status: toApiStatus(p.status) } : {}) }),
        }).then((r) => toUi(r.data)),
};