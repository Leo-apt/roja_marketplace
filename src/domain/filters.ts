import { ASOF } from "@/utils/constants";

export interface Filters {
    q: string;
    from: string;
    to: string;
    provider: string; // "all" or payee name
    type: string;     // "all" | "One-time" | "Subscription" | "Trial"
    status: string;
    tab: string;
    stage: string;
    channel: string;
    negative: boolean;
}

export const defaultFilters: Filters = {
    q: "",
    from: "2026-09-08",
    to: ASOF,
    provider: "all",
    type: "all",
    status: "all",
    tab: "all",
    stage: "all",
    channel: "all",
    negative: false,
};

export const within = (d: string | null | undefined, f: Filters): boolean =>
    !!d && d >= f.from && d <= f.to;

export const searchMatch = (x: unknown, f: Filters): boolean =>
    JSON.stringify(x).toLowerCase().includes(f.q.trim().toLowerCase());