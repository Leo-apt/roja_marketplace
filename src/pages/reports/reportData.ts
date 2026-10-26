import type { DataMode } from "@/env/EnvContext";

export type TxnStatus = "success" | "failed" | "refunded";
export interface Txn {
    id: string; at: string; customer: string; amount: number; fee: number; // amount and fee in cents
    status: TxnStatus; method: string; reference: string;
}
export interface ReportRow { client: string; env: string; product: string; margin: number; txns: Txn[] } // margin = your cents per successful sale

const NAMES = ["Asha", "Ravi", "Meena", "John", "Priya", "Kumar", "Sara", "Dev"];
const METHODS = ["Visa ••4242", "Mastercard ••5100", "ACH ••6789"];
const pad = (n: number) => String(n).padStart(2, "0");

// sample transactions; replace with the API response later
const make = (prefix: string, n: number, base: number): Txn[] =>
    Array.from({ length: n }, (_, i) => {
        const amount = base + (i % 5) * 250;
        return {
            id: `${prefix}-${1000 + i}`,
            at: `2026-10-${pad(1 + ((i * 2) % 25))}T${pad(8 + (i % 10))}:${pad((i * 7) % 60)}:00Z`,
            customer: NAMES[i % NAMES.length],
            amount,
            fee: Math.round(amount * 0.029) + 30,
            status: i % 6 === 5 ? "failed" : i % 9 === 8 ? "refunded" : "success",
            method: METHODS[i % 3],
            reference: `pi_${prefix.toLowerCase()}${i}`,
        };
    });

export const REPORT_DATA: Record<DataMode, ReportRow[]> = {
    sandbox: [
        { client: "Roja Main", env: "Web App", product: "Financial +", margin: 200, txns: make("SB-FIN", 14, 1999) },
        { client: "Roja Main", env: "Web App", product: "Wellness Plus", margin: 300, txns: make("SB-WEL", 9, 2999) },
        { client: "Roja Main", env: "Mobile App", product: "Financial +", margin: 200, txns: make("SB-MFN", 6, 1999) },
        { client: "Acme Corp", env: "Portal", product: "Telehealth Basic", margin: 150, txns: make("SB-TEL", 11, 1499) },
        { client: "Acme Corp", env: "Portal", product: "Financial +", margin: 200, txns: make("SB-AFN", 4, 1999) },
    ],
    live: [
        { client: "Roja Main", env: "Web App", product: "Financial +", margin: 200, txns: make("LV-FIN", 38, 1999) },
        { client: "Roja Main", env: "Web App", product: "Wellness Plus", margin: 300, txns: make("LV-WEL", 25, 2999) },
        { client: "Roja Main", env: "Mobile App", product: "Financial +", margin: 200, txns: make("LV-MFN", 19, 1999) },
        { client: "Acme Corp", env: "Portal", product: "Telehealth Basic", margin: 150, txns: make("LV-TEL", 31, 1499) },
    ],
};

export const marginOf = (r: ReportRow) => r.margin * summarize(r.txns).ok;

export const summarize = (t: Txn[]) => {
    let sales = 0, fees = 0, refunds = 0, ok = 0, failed = 0, refunded = 0;
    for (const x of t) {
        if (x.status === "failed") { failed++; continue; }
        sales += x.amount;
        fees += x.fee;
        if (x.status === "refunded") { refunded++; refunds += x.amount; } else ok++;
    }
    return { sales, fees, refunds, ok, failed, refunded, count: t.length, payable: sales - fees - refunds };
};