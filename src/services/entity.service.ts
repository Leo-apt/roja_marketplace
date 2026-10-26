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

    // the image goes as a file (multipart), not as base64 text
    create: (d: { name: string; description: string; file?: File | null }) => {
        const fd = new FormData();
        fd.append("name", d.name);
        if (d.description) fd.append("description", d.description);
        if (d.file) fd.append("file", d.file);
        return apiCall<ApiEntity>("/entities/create-entity", { method: "POST", body: fd })
            .then((r) => toUi(r.data));
    },

    update: (id: string, p: { name?: string; description?: string; file?: File | null; status?: Status }) => {
        const { status, file, ...rest } = p;
        let body: BodyInit;
        if (file) {
            // new image: multipart (name, description, file)
            const fd = new FormData();
            if (rest.name !== undefined) fd.append("name", rest.name);
            if (rest.description !== undefined) fd.append("description", rest.description);
            fd.append("file", file);
            body = fd;
        } else {
            // no new image: plain JSON as before (used by the status toggle too)
            body = JSON.stringify({ ...rest, ...(status ? { isActive: status === "Active" } : {}) });
        }
        return apiCall<ApiEntity>(`/entities/${id}/update-entity`, { method: "PATCH", body })
            .then((r) => toUi(r.data));
    },
};