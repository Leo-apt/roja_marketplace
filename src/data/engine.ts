import type { Status } from "@/data/catalog";

export type WeightType = "flat" | "saturating" | "ratio" | "balance";
export type WeightKey = "value" | "cap" | "divisor" | "multiplier" | "reference" | "trigger";

export const weightTypes: { value: WeightType; label: string }[] = [
    { value: "flat", label: "Flat" },
    { value: "saturating", label: "Saturating" },
    { value: "ratio", label: "Ratio of Spend" },
    { value: "balance", label: "Balance Strain" },
];

// Fields shown for each weight type, in display order
export const weightFields: Record<WeightType, { key: WeightKey; label: string }[]> = {
    flat: [{ key: "value", label: "Value" }],
    saturating: [{ key: "cap", label: "Cap" }, { key: "divisor", label: "Divisor" }],
    ratio: [
        { key: "multiplier", label: "Multiplier" }, { key: "reference", label: "Reference" },
        { key: "divisor", label: "Divisor" }, { key: "cap", label: "Cap" },
    ],
    balance: [
        { key: "reference", label: "Reference" }, { key: "cap", label: "Cap" },
        { key: "multiplier", label: "Multiplier" }, { key: "trigger", label: "Trigger Above" },
    ],
};

export interface Signal {
    uid: string;
    preset: string;
    signalId: string; label: string; minCount: string;
    topCategory: string; code: string; mcc: string; keywords: string; sameAs: string; flags: string; contextField: string;
    weightType: WeightType;
    value: string; cap: string; divisor: string; multiplier: string; reference: string; trigger: string;
}

export interface EngineConfig {
    id: string; name: string; providerId: string; category: string; baseScore: string;
    show: string; review: string; hide: string; status: Status; signals: Signal[];
    createdBy: string; createdOn: string; updatedBy: string; updatedOn: string;
}

export const providers = [
    { value: "prv-1001", label: "Provider 1001" },
    { value: "prv-1002", label: "Provider 1002" },
    { value: "prv-1003", label: "Provider 1003" },
];

export const offerTypes: { value: string; label: string }[] = [];

export const signalPresets = [
    { value: "", label: "None" },
    { value: "fuel_spend", label: "Fuel spend" },
    { value: "low_balance", label: "Low balance" },
    { value: "grocery_visits", label: "Grocery visits" },
];

let n = 0;
export const newUid = () => `sg-${Date.now()}-${n++}`;
export const blankSignal = (): Signal => ({
    uid: newUid(), preset: "", signalId: "", label: "", minCount: "",
    topCategory: "", code: "", mcc: "", keywords: "", sameAs: "", flags: "", contextField: "",
    weightType: "flat", value: "", cap: "", divisor: "", multiplier: "", reference: "", trigger: "",
});

const sig = (p: Partial<Signal>): Signal => ({ ...blankSignal(), ...p });
const BY = "Herberts Mccarthy";

export const engineConfigs: EngineConfig[] = [
    {
        id: "e1", name: "Fuel discount scoring", providerId: "prv-1001", category: "Auto", baseScore: "40",
        show: "70", review: "50", hide: "30", status: "Active",
        signals: [
            sig({
                signalId: "fuel_spend", label: "Fuel spend", minCount: "3", topCategory: "Gas", mcc: "5541, 5542", keywords: "fuel, gas",
                weightType: "ratio", multiplier: "2", reference: "100", divisor: "10", cap: "30"
            }),
            sig({ signalId: "low_balance", label: "Low balance", minCount: "1", weightType: "balance", reference: "50", cap: "20", multiplier: "1.5", trigger: "5" }),
        ],
        createdBy: BY, createdOn: "07/16/2026 11:48 AM", updatedBy: "N/A", updatedOn: "07/16/2026 11:48 AM",
    },
    {
        id: "e2", name: "Grocery cashback scoring", providerId: "prv-1002", category: "Shopping", baseScore: "35",
        show: "65", review: "45", hide: "25", status: "Active",
        signals: [sig({ signalId: "grocery_visits", label: "Grocery visits", minCount: "4", weightType: "saturating", cap: "25", divisor: "5" })],
        createdBy: BY, createdOn: "07/17/2026 10:10 AM", updatedBy: BY, updatedOn: "07/18/2026 09:30 AM",
    },
    {
        id: "e3", name: "Roadside assistance scoring", providerId: "prv-1003", category: "Auto", baseScore: "20",
        show: "60", review: "40", hide: "20", status: "Inactive",
        signals: [sig({ signalId: "vehicle_age", label: "Vehicle age", weightType: "flat", value: "15" })],
        createdBy: BY, createdOn: "07/19/2026 02:05 PM", updatedBy: "N/A", updatedOn: "07/19/2026 02:05 PM",
    },
];