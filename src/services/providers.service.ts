import { fmt } from "./categories.service";
import type { Status } from "@/data/catalog";

export interface ProviderRec {
    id: string; providerId: string; name: string; email: string; phone: string; logoUrl: string; status: Status;
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}
export interface ProviderInput { name: string; email: string; phone: string; logoFile: File | null }

export interface ProviderCreds {
    mode: "live" | "sandbox"; apiUrl: string; tokenUrl: string; clientId: string;
    clientSecret: string; refreshToken: string; instanceUrl: string;
}
const credsDb: Record<string, ProviderCreds> = {};

// MOCK DATA: replace the body of each method with apiCall(...) when the API exists
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 300));
let db: ProviderRec[] = [{
    id: "1", providerId: "PROV_ID0000001", name: "Alternative Revenue Solutions", email: "tech@roja.one",
    phone: "+12124567890", logoUrl: "", status: "Active",
    createdBy: "Super Admin", createdOn: fmt("2026-04-08T08:13:00Z"), updatedBy: "N/A", updatedOn: fmt("2026-04-08T08:13:00Z"),
}];

export const providersService = {
    listPage: (page: number, limit: number, search = "") => {
        const t = search.trim().toLowerCase();
        const all = t ? db.filter((p) => [p.name, p.email, p.providerId, p.phone].some((x) => x.toLowerCase().includes(t))) : db;
        return wait({ rows: all.slice((page - 1) * limit, page * limit), total: all.length });
    },
    get: (id: string) => {
        const r = db.find((p) => p.id === id);
        return r ? wait(r) : Promise.reject(new Error("Provider not found"));
    },
    create: (i: ProviderInput) => {
        const n = db.length + 1;
        const rec: ProviderRec = {
            id: String(Date.now()), providerId: `PROV_ID${String(n).padStart(7, "0")}`, name: i.name.trim(), email: i.email.trim(),
            phone: i.phone, logoUrl: i.logoFile ? URL.createObjectURL(i.logoFile) : "", status: "Active",
            createdBy: "Super Admin", createdOn: fmt(new Date().toISOString()), updatedBy: "N/A", updatedOn: fmt(new Date().toISOString()),
        };
        db = [rec, ...db];
        return wait(rec);
    },
    update: (id: string, i: ProviderInput) => {
        db = db.map((p) => p.id !== id ? p : {
            ...p, name: i.name.trim(), email: i.email.trim(), phone: i.phone,
            logoUrl: i.logoFile ? URL.createObjectURL(i.logoFile) : p.logoUrl,
            updatedBy: "Super Admin", updatedOn: fmt(new Date().toISOString()),
        });
        return wait(db.find((p) => p.id === id)!);
    },
    getCreds: (id: string) => wait(credsDb[id] ?? null),
    saveCreds: (id: string, c: ProviderCreds) => { credsDb[id] = c; return wait(c); },
};