import type { DataMode } from "@/env/EnvContext";

export type PayStatus = "Captured" | "Failed" | "No charge";
export type FulfillStatus = "Active" | "Delivered" | "Partially fulfilled" | "Not started";
export type ReceiptStatus = "Paid" | "Awaiting client payment" | "N/A";
export type PurchaseType = "Subscription" | "One-time" | "Trial";

export interface Purchase {
    id: string; date: string; client: string; env: string; customer: string; product: string;
    provider: string; merchant: string; type: PurchaseType;
    amount: number; refund: number; fee: number; // cents
    wholesale: number; cost: number; // cents: Master price billed to the client (W) and provider cost (C)
    subscriptionId: string; nextCharge: string; gatewayFunds: "Cleared" | "Pending" | "N/A";
    payment: PayStatus; fulfillment: FulfillStatus; receipt: ReceiptStatus;
    hold: string; reference: string;
}

export const needsAttention = (r: Purchase) => !!r.hold || r.payment === "Failed" || r.receipt === "Awaiting client payment";

const PRODUCTS: { name: string; provider: string; price: number; wholesale: number; cost: number; kind: "Subscription" | "One-time" }[] = [
    { name: "Financial +", provider: "ARS", price: 1999, wholesale: 1450, cost: 1000, kind: "Subscription" },
    { name: "Wellness Plus", provider: "Provider C · Wellness", price: 2999, wholesale: 2300, cost: 1800, kind: "One-time" },
    { name: "Telehealth Basic", provider: "Provider B · Care", price: 1499, wholesale: 1100, cost: 900, kind: "Subscription" },
];
const nextMonth = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m, Math.min(day, 28))).toISOString().slice(0, 10);
};
const SCOPES = [
    { client: "Roja Main", env: "Web App" },
    { client: "Roja Main", env: "Mobile App" },
    { client: "Acme Corp", env: "Portal" },
];
const NAMES = ["Asha", "Ravi", "Meena", "John", "Priya", "Kumar", "Sara", "Dev"];
const pad = (n: number) => String(n).padStart(2, "0");

export const CLIENTS = [...new Set(SCOPES.map((s) => s.client))];
export const ENVS = [...new Set(SCOPES.map((s) => s.env))];
export const PROVIDERS = PRODUCTS.map((p) => p.provider);

// sample data; replace with the API response later
const make = (prefix: string, n: number): Purchase[] =>
    Array.from({ length: n }, (_, i) => {
        const p = PRODUCTS[(i + Math.floor(i / 3)) % 3];
        const s = SCOPES[i % SCOPES.length];
        const trial = p.kind === "Subscription" && i % 11 === 10;
        const failed = !trial && i % 7 === 6;
        const payment: PayStatus = trial ? "No charge" : failed ? "Failed" : "Captured";
        const captured = payment === "Captured";
        const amount = trial ? 0 : p.price + (i % 3) * 100;
        const refund = captured && i % 9 === 8 ? amount : 0;
        const partial = captured && i % 8 === 5;
        const receipt: ReceiptStatus = captured ? (i % 5 === 3 ? "Awaiting client payment" : "Paid") : "N/A";
        return {
            id: `ORD-${prefix}-${1000 + i}`,
            date: `2026-10-${pad(1 + ((i * 3) % 27))}`,
            client: s.client,
            env: s.env,
            customer: NAMES[i % NAMES.length],
            product: p.name,
            provider: p.provider,
            merchant: `MERCHANT-${s.client.toUpperCase().replace(/\s+/g, "-")}-${s.env.toUpperCase().replace(/\s+/g, "-")}`,
            type: trial ? "Trial" : p.kind,
            amount,
            refund,
            fee: captured ? Math.round(amount * 0.029) + 30 : 0,
            wholesale: captured ? p.wholesale : 0,
            cost: captured ? p.cost : 0,
            subscriptionId: p.kind === "Subscription" ? `SUB-${prefix}-${1000 + i}` : "",
            nextCharge: p.kind !== "Subscription" || failed || refund ? "" : trial ? "2026-11-05" : nextMonth(`2026-10-${pad(1 + ((i * 3) % 27))}`),
            gatewayFunds: captured ? (i % 6 === 2 ? "Pending" : "Cleared") : "N/A",
            payment,
            fulfillment: failed ? "Not started" : partial ? "Partially fulfilled" : p.kind === "One-time" ? "Delivered" : "Active",
            receipt,
            hold: partial ? "One provider component activation failed" : refund ? "Supplier credit not confirmed" : "",
            reference: `pi_demo_${prefix.toLowerCase()}${i}`,
        };
    });

export const PURCHASE_DATA: Record<DataMode, Purchase[]> = {
    sandbox: make("SB", 18),
    live: make("LV", 26),
};