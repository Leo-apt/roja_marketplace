import { apiCall } from "@/services/auth.service";
import type { Status } from "@/data/catalog";
import type { Instance } from "@/data/instances";

interface ApiEntity {
    _id?: string; id?: string; name: string;
    description?: string; imageUrl?: string; isActive?: boolean;
    subEntities?: { id: string; name: string }[];
}

const toUi = (x: ApiEntity): Instance => ({
    id: x._id ?? x.id ?? "",
    name: x.name,
    description: x.description ?? "",
    imageUrl: x.imageUrl ?? "",
    status: x.isActive === false ? "Inactive" : "Active",
    products: [], // backend has no products yet
    environments: (x.subEntities ?? []).map((s) => s.name),
});

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

    update: (id: string, p: { name?: string; description?: string; imageUrl?: string; status?: Status }) => {
        const { status, ...rest } = p;
        return apiCall<ApiEntity>(`/entities/${id}/update-entity`, {
            method: "PATCH",
            body: JSON.stringify({ ...rest, ...(status ? { isActive: status === "Active" } : {}) }),
        }).then((r) => toUi(r.data));
    },
};