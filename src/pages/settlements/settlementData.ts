// Provider payables, client receivables and payout batches, built from the sample purchases. Replace with the API later.
import type { DataMode } from "@/env/EnvContext";
import { PURCHASE_DATA, type Purchase } from "@/pages/purchases/purchasesData";

export type PayableStatus = "Ready" | "Held" | "Awaiting client payment" | "Awaiting merchant deposit";
export interface Payable { id: string; date: string; orderId: string; client: string; env: string; provider: string; product: string; amount: number; status: PayableStatus; hold: string }
export interface Receivable { id: string; date: string; client: string; env: string; billed: number; paid: number; balance: number; status: "Paid" | "Awaiting client payment"; reference: string }
export type BatchStatus = "Draft" | "Pending approval" | "Approved" | "Payment submitted" | "Paid" | "Voided";
export interface Batch { id: string; date: string; client: string; env: string; provider: string; amount: number; entries: number; status: BatchStatus; preparedBy: string; approvedBy: string; reference: string }

export const ME = "Taylor"; // sample signed-in approver

export const payableState = (p: Purchase): PayableStatus =>
    p.hold || !["Active", "Delivered"].includes(p.fulfillment) ? "Held"
        : p.receipt !== "Paid" ? "Awaiting client payment"
            : p.gatewayFunds !== "Cleared" ? "Awaiting merchant deposit" : "Ready";

const holdText = (s: PayableStatus, p: Purchase) =>
    s === "Held" ? p.hold || "Fulfillment not complete" : s === "Awaiting client payment" ? "Client receivable not settled" : s === "Awaiting merchant deposit" ? "Merchant clearing not verified" : "";

const captured = (mode: DataMode) => PURCHASE_DATA[mode].filter((p) => p.payment === "Captured");

export const payables = (mode: DataMode): Payable[] =>
    captured(mode).map((p) => {
        const status = payableState(p);
        return { id: `${p.id}-C`, date: p.date, orderId: p.id, client: p.client, env: p.env, provider: p.provider, product: p.product, amount: p.cost, status, hold: holdText(status, p) };
    });

export const receivables = (mode: DataMode): Receivable[] =>
    captured(mode).map((p) => {
        const paid = p.receipt === "Paid" ? p.wholesale : 0;
        return {
            id: p.id, date: p.date, client: p.client, env: p.env, billed: p.wholesale, paid, balance: p.wholesale - paid,
            status: paid ? "Paid" : "Awaiting client payment", reference: paid ? `RECEIPT-DEMO-${p.id}` : ""
        };
    });

export const batches = (mode: DataMode): Batch[] => {
    const x = mode === "live" ? "LV" : "SB";
    const b = (n: string, date: string, client: string, env: string, provider: string, amount: number, entries: number, status: BatchStatus, preparedBy: string, approvedBy: string, reference: string): Batch =>
        ({ id: `PAY-${x}-${n}`, date, client, env, provider, amount, entries, status, preparedBy, approvedBy, reference });
    return [
        b("001", "2026-10-05", "Roja Main", "Web App", "ARS", 1000, 1, "Paid", "Jamie", "Taylor", "BANK-DEMO-001"),
        b("002", "2026-10-20", "Acme Corp", "Portal", "Provider B · Care", 2700, 3, "Draft", "Alex", "", ""),
        b("003", "2026-10-22", "Roja Main", "Mobile App", "ARS", 3000, 3, "Pending approval", "Jamie", "", ""),
        b("004", "2026-10-24", "Roja Main", "Web App", "Provider C · Wellness", 5400, 3, "Approved", "Jamie", "Taylor", ""),
        b("005", "2026-10-25", "Acme Corp", "Portal", "ARS", 2000, 2, "Payment submitted", "Alex", "Taylor", ""),
    ];
};