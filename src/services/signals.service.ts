import { apiCall, ApiError, type Wrapped } from "./auth.service";
import { who } from "./categories.service";

// values are the backend WeightType enum
export const WEIGHT_TYPES = [
    { value: "flat", label: "Flat" },
    { value: "saturating", label: "Saturating" },
    { value: "ratio", label: "Ratio of spend" },
    { value: "balance", label: "Balance strain" },
];

export type NumKey = "weightValue" | "cap" | "divisor" | "multiplier" | "reference" | "trigger";
export const NUM_KEYS: NumKey[] = ["weightValue", "cap", "divisor", "multiplier", "reference", "trigger"];

const CAP = { key: "cap" as NumKey, label: "Cap", note: "Maximum score this weight can contribute.", min: 0.01 };
const MULTIPLIER = { key: "multiplier" as NumKey, label: "Multiplier", note: "Scales the calculated score.", min: 0.01 };

// fields shown for each weight type, in display order (all required by the backend)
export const WEIGHT_FIELDS: Record<string, { key: NumKey; label: string; note: string; min: number }[]> = {
    flat: [{ key: "weightValue", label: "Value", note: "Fixed score added when this signal matches.", min: 0.01 }],
    saturating: [CAP, { key: "divisor", label: "Divisor", note: "Larger values reduce the score increase.", min: 0.01 }],
    ratio: [CAP, MULTIPLIER],
    balance: [
        { key: "reference", label: "Reference", note: "Reference value used for comparison.", min: 0 },
        CAP,
        MULTIPLIER,
        { key: "trigger", label: "Trigger Above", note: "Rule applies only when the calculated value exceeds this threshold.", min: 0 },
    ],
};

export interface SignalRec extends Record<NumKey, number | null> {
    id: string; signalId: string; label: string; minCount: number | null;
    topCategory: string[]; code: string[]; mcc: string[]; keywords: string[];
    sameAs: string; weightType: string;
    createdBy: string; createdAt: string; updatedBy: string; updatedAt: string;
}

export interface SignalInput extends Record<NumKey, string> {
    signalId: string; label: string; minCount: string;
    topCategory: string; code: string; mcc: string; keywords: string; // comma separated text
    sameAs: string; weightType: string;
}

export const toNumStrings = (r: Record<NumKey, number | null>) =>
    Object.fromEntries(NUM_KEYS.map((k) => [k, r[k] == null ? "" : String(r[k])])) as Record<NumKey, string>;

/** Error tied to one form field so the form can focus it. */
export class SignalError extends Error {
    field: string;
    constructor(field: string, message: string) { super(message); this.field = field; }
}

// "08/14/2026 07:48 AM (EDT)"
export const fmtDate = (iso: string) =>
    new Date(iso)
        .toLocaleString("en-US", {
            timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true, timeZoneName: "short",
        })
        .replace(",", "")
        .replace(/ (\w+)$/, " ($1)");

interface ApiSignal {
    _id: string; signalId: string; label: string; minCount?: number | null;
    match?: { topCategory?: string[]; code?: string[]; mcc?: string[]; keywords?: string[]; sameAs?: string };
    weightType: string;
    weightValue?: number | null; cap?: number | null; divisor?: number | null;
    multiplier?: number | null; reference?: number | null; trigger?: number | null;
    createdBy: unknown; updatedBy: unknown; createdAt: string; updatedAt: string;
}

const toUi = (a: ApiSignal): SignalRec => {
    const m = a.match ?? {};
    return {
        id: a._id, signalId: a.signalId, label: a.label, minCount: a.minCount ?? null,
        topCategory: m.topCategory ?? [], code: m.code ?? [], mcc: m.mcc ?? [], keywords: m.keywords ?? [],
        sameAs: m.sameAs ?? "", weightType: a.weightType,
        weightValue: a.weightValue ?? null, cap: a.cap ?? null, divisor: a.divisor ?? null,
        multiplier: a.multiplier ?? null, reference: a.reference ?? null, trigger: a.trigger ?? null,
        createdBy: who(a.createdBy), createdAt: a.createdAt, updatedBy: who(a.updatedBy), updatedAt: a.updatedAt,
    };
};

// list comes back as { items, total, page, limit } inside the wrapper's data; a plain array (with meta) also works
type SignalPage = ApiSignal[] | { items?: ApiSignal[]; data?: ApiSignal[]; total?: number };
const unpack = (r: Wrapped<SignalPage>) => {
    const d = r.data;
    if (Array.isArray(d)) return { items: d, total: r.meta?.total ?? d.length };
    const items = d.items ?? d.data ?? [];
    return { items, total: d.total ?? r.meta?.total ?? items.length };
};

// Blank optional fields are omitted on create and cleared on edit. signalId can't change, so it is only sent on create.
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function payload(i: SignalInput, isEdit: boolean) {
    const sameAs = i.sameAs.trim();
    const body: Record<string, unknown> = {
        label: i.label.trim(),
        minCount: i.minCount.trim() ? Number(i.minCount) : isEdit ? null : undefined,
        match: {
            topCategory: list(i.topCategory), code: list(i.code), mcc: list(i.mcc), keywords: list(i.keywords),
            sameAs: sameAs ? sameAs : isEdit ? "" : undefined,
        },
        weightType: i.weightType,
    };
    if (!isEdit) body.signalId = i.signalId.trim();
    for (const f of WEIGHT_FIELDS[i.weightType] ?? []) body[f.key] = Number(i[f.key]); // other weight fields are cleared by the backend
    return JSON.stringify(body);
}

// ties backend messages to a form field so the form can focus it
const mapError = (e: unknown): never => {
    if (e instanceof ApiError) {
        if (/already exists/i.test(e.message)) throw new SignalError("signalId", e.message);
        if (/sameAs/i.test(e.message)) throw new SignalError("sameAs", e.message);
    }
    throw e;
};

export const signalsService = {
    listPage: (page = 1, limit = 10, search = "") => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) qs.set("search", search);
        return apiCall<SignalPage>(`/signals/get-all-signals?${qs}`)
            .then((r) => { const p = unpack(r); return { rows: p.items.map(toUi), total: p.total }; });
    },
    get: (id: string) => apiCall<ApiSignal>(`/signals/${id}/get-signal`).then((r) => toUi(r.data)),
    create: (i: SignalInput) =>
        apiCall<ApiSignal>("/signals/create-signal", { method: "POST", body: payload(i, false) })
            .then((r) => toUi(r.data)).catch(mapError),
    update: (id: string, i: SignalInput) =>
        apiCall<ApiSignal>(`/signals/${id}/update-signal`, { method: "PATCH", body: payload(i, true) })
            .then((r) => toUi(r.data)).catch(mapError),
};