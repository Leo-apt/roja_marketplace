import type { Status } from "@/data/catalog";

export type ColorKey = "cardBg" | "buttonBg" | "buttonText" | "textPrimary" | "textSecondary";
export const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
    { key: "cardBg", label: "Card Background Color" },
    { key: "buttonBg", label: "Button Background" },
    { key: "buttonText", label: "Button Text color" },
    { key: "textPrimary", label: "Text Primary" },
    { key: "textSecondary", label: "Text Secondary" },
];

export interface TemplateRec extends Record<ColorKey, string> {
    id: string; name: string; status: Status; bgImageUrl: string; frontImageUrl: string;
    createdBy: string; createdAt: string; updatedBy: string; updatedAt: string;
}

export interface TemplateInput extends Record<ColorKey, string> {
    name: string; status: Status | ""; bgImage: File | null; frontImage: File | null;
}

/** Error tied to one form field so the form can focus it. */
export class TemplateError extends Error {
    field: string;
    constructor(field: string, message: string) { super(message); this.field = field; }
}

const ACTOR = "Marketplace Admin";
const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

const seed = (n: number, name: string, status: Status, at: string, c: Partial<Record<ColorKey, string>>): TemplateRec => ({
    id: `tpl_${n}`, name, status, bgImageUrl: "", frontImageUrl: "",
    cardBg: "", buttonBg: "", buttonText: "", textPrimary: "", textSecondary: "", ...c,
    createdBy: ACTOR, createdAt: at, updatedBy: ACTOR, updatedAt: at,
});

let db: TemplateRec[] = [
    seed(1, "FinancialConnect", "Active", "2026-10-18T10:20:00Z", { cardBg: "#EEF2FA", buttonBg: "#3B2BD9", buttonText: "#FFFFFF", textPrimary: "#101828", textSecondary: "#667085" }),
    seed(2, "Quick Loans", "Active", "2026-10-17T08:05:00Z", { cardBg: "#FFF7E6", buttonBg: "#D97706", buttonText: "#FFFFFF", textPrimary: "#1F2937", textSecondary: "#6B7280" }),
    seed(3, "Savings Boost", "Inactive", "2026-10-15T14:40:00Z", { cardBg: "#ECFDF3", buttonBg: "#047857", buttonText: "#FFFFFF" }),
];

const check = (i: TemplateInput, excludeId?: string) => {
    if (db.some((t) => t.id !== excludeId && t.name.toLowerCase() === i.name.trim().toLowerCase()))
        throw new TemplateError("name", "Template name already exists");
};

const colors = (i: TemplateInput) =>
    Object.fromEntries(COLOR_FIELDS.map((c) => [c.key, i[c.key].trim()])) as Record<ColorKey, string>;

// TODO: replace the bodies below with apiCall(...) once the backend is ready; keep the signatures.
export const productTemplatesService = {
    async listPage(page = 1, limit = 10, search = "") {
        await delay();
        const q = search.trim().toLowerCase();
        const all = db
            .filter((t) => !q || t.name.toLowerCase().includes(q))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return { rows: all.slice((page - 1) * limit, page * limit), total: all.length };
    },
    async get(id: string) {
        await delay(300);
        const r = db.find((t) => t.id === id);
        if (!r) throw new Error("Template not found");
        return r;
    },
    async create(i: TemplateInput) {
        await delay();
        check(i);
        const now = new Date().toISOString();
        const rec: TemplateRec = {
            id: `tpl_${Date.now()}`, name: i.name.trim(), status: i.status as Status,
            bgImageUrl: i.bgImage ? URL.createObjectURL(i.bgImage) : "",
            frontImageUrl: i.frontImage ? URL.createObjectURL(i.frontImage) : "",
            ...colors(i), createdBy: ACTOR, createdAt: now, updatedBy: ACTOR, updatedAt: now,
        };
        db = [rec, ...db];
        return rec;
    },
    async update(id: string, i: TemplateInput) {
        await delay();
        check(i, id);
        const old = db.find((t) => t.id === id);
        if (!old) throw new Error("Template not found");
        const rec: TemplateRec = {
            ...old, name: i.name.trim(), status: i.status as Status,
            bgImageUrl: i.bgImage ? URL.createObjectURL(i.bgImage) : old.bgImageUrl, // no new file: keep the old image
            frontImageUrl: i.frontImage ? URL.createObjectURL(i.frontImage) : old.frontImageUrl,
            ...colors(i), updatedBy: ACTOR, updatedAt: new Date().toISOString(),
        };
        db = db.map((t) => (t.id === id ? rec : t));
        return rec;
    },
};