// Margin rows are built from the sample purchases (one row per captured order). Replace with the API later.
import type { DataMode } from "@/env/EnvContext";
import { PURCHASE_DATA } from "@/pages/purchases/purchasesData";

// R customer price, W Master price billed to the client, C provider cost, F gateway fees (all cents)
export interface MarginRow {
    id: string; label: string; count: number; date: string; orderId: string;
    client: string; env: string; provider: string; product: string;
    R: number; refund: number; W: number; clientCredit: number; C: number; supplierCredit: number; fees: number;
    sales: number; masterBilling: number; cost: number; platform: number; clientMargin: number; combined: number; contribution: number;
}
type Base = Omit<MarginRow, "sales" | "masterBilling" | "cost" | "platform" | "clientMargin" | "combined" | "contribution">;

export const ADD = ["R", "refund", "W", "clientCredit", "C", "supplierCredit", "fees"] as const;

export const finish = (b: Base): MarginRow => {
    const sales = b.R - b.refund;
    const masterBilling = b.W - b.clientCredit;
    const cost = b.C - b.supplierCredit;
    const combined = sales - cost;
    return { ...b, sales, masterBilling, cost, platform: masterBilling - cost, clientMargin: sales - masterBilling, combined, contribution: combined - b.fees };
};

const build = (mode: DataMode): MarginRow[] =>
    PURCHASE_DATA[mode].filter((p) => p.payment === "Captured").map((p) => {
        const n = Number(p.id.slice(-4));
        const refunded = p.refund > 0;
        return finish({
            id: p.id, label: p.id, count: 1, date: p.date, orderId: p.id,
            client: p.client, env: p.env, provider: p.provider, product: p.product,
            R: p.amount, refund: p.refund, W: p.wholesale, C: p.cost, fees: p.fee,
            clientCredit: refunded && n % 2 === 0 ? p.wholesale : 0, // sample: credits are separate confirmed events
            supplierCredit: refunded && n % 3 === 0 ? p.cost : 0,
        });
    });

export const MARGIN_DATA: Record<DataMode, MarginRow[]> = { sandbox: build("sandbox"), live: build("live") };
export const MARGIN_PRODUCTS = [...new Set(PURCHASE_DATA.live.map((p) => p.product))];