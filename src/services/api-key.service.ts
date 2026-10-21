import { apiCall } from "@/services/auth.service";

interface ApiKeyRow { _id?: string; id?: string; note?: string; prefix: string; expiresAt?: string | null; isActive: boolean; createdAt?: string; type?: string }
interface Issued { id: string; note?: string; prefix: string; expiresAt?: string | null; key: string }

export type Env = "sandbox" | "live";
export interface TokenRec { id: string; notes: string; created: string; expires: string; expiresAt: string | null; prefix: string }

const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

const fromRow = (x: ApiKeyRow): TokenRec => ({
    id: x._id ?? x.id ?? "", notes: x.note ?? "", created: fmt(x.createdAt),
    expires: fmt(x.expiresAt), expiresAt: x.expiresAt ?? null, prefix: x.prefix,
});
const fromIssued = (x: Issued): TokenRec => ({
    id: String(x.id), notes: x.note ?? "", created: fmt(new Date().toISOString()),
    expires: fmt(x.expiresAt), expiresAt: x.expiresAt ?? null, prefix: x.prefix,
});

type Body = { note: string; expiresInDays?: number };

// existing key id per "subEntityId:env" (also revoked ones), so Generate after Delete uses regenerate
const keyOf: Record<string, string> = {};

const regenerate = (keyId: string, b: Body) =>
    apiCall<Issued>(`/api/regenerate-api-key/${keyId}`, { method: "PATCH", body: JSON.stringify(b) })
        .then((r) => ({ key: r.data.key, rec: fromIssued(r.data) }));

export const apiKeyService = {
    // newest first from the backend, so the first active one is the current token
    active: (subEntityId: string) =>
        apiCall<ApiKeyRow[]>(`/api/${subEntityId}/api-keys`).then((r) => {
            const pick = (env: Env) => {
                const row = r.data.find((k) => k.type === env);
                if (row) keyOf[`${subEntityId}:${env}`] = row._id ?? row.id ?? "";
                return row && row.isActive ? fromRow(row) : null;
            };
            return { sandbox: pick("sandbox"), live: pick("live") } as Record<Env, TokenRec | null>;
        }),

    create: async (subEntityId: string, env: Env, b: Body): Promise<{ key: string; rec: TokenRec }> => {
        const k = `${subEntityId}:${env}`;
        if (!keyOf[k]) {
            try {
                const r = await apiCall<Issued>(`/api/${subEntityId}/create-api-keys`, { method: "POST", body: JSON.stringify({ ...b, type: env }) });
                keyOf[k] = String(r.data.id);
                return { key: r.data.key, rec: fromIssued(r.data) };
            } catch (e) {
                console.log("create failed:", e);
                const conflict = (e as { status?: number }).status === 409 || /already exists/i.test(String((e as Error)?.message));
                if (!conflict) throw e;
                await apiKeyService.active(subEntityId); // loads the existing key id into keyOf
                if (!keyOf[k]) throw new Error("Existing key not found in the list response");
            }
        }
        return regenerate(keyOf[k], b);
    },

    regenerate,

    revoke: (keyId: string) => apiCall<{ revoked: boolean }>(`/api/keys/${keyId}`, { method: "DELETE" }),
};