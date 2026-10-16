import { apiCall } from "@/services/auth.service";

interface ApiKeyRow { _id?: string; id?: string; note?: string; prefix: string; expiresAt?: string | null; isActive: boolean; createdAt?: string; environment?: string }
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

export const apiKeyService = {
    // newest first from the backend, so the first active one is the current token
    active: (subEntityId: string) =>
        apiCall<ApiKeyRow[]>(`/api/${subEntityId}/api-keys`).then((r) => {
            const pick = (env: Env) => {
                const a = r.data.find((k) => k.isActive && k.environment === env);
                return a ? fromRow(a) : null;
            };
            return { sandbox: pick("sandbox"), live: pick("live") } as Record<Env, TokenRec | null>;
        }),

    create: (subEntityId: string, env: Env, b: Body) =>
        apiCall<Issued>(`/api/${subEntityId}/create-api-keys`, { method: "POST", body: JSON.stringify({ ...b, environment: env }) })
            .then((r) => ({ key: r.data.key, rec: fromIssued(r.data) })),

    regenerate: (keyId: string, b: Body) =>
        apiCall<Issued>(`/api/regenerate-api-key/${keyId}`, { method: "PATCH", body: JSON.stringify(b) })
            .then((r) => ({ key: r.data.key, rec: fromIssued(r.data) })),

    revoke: (keyId: string) => apiCall<{ revoked: boolean }>(`/api/keys/${keyId}`, { method: "DELETE" }),
};