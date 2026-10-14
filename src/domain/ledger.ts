import type { Batch } from "@/types";
import { getOrder, orders } from "@/data/orders";
import { type Filters, within, searchMatch } from "./filters";

export interface LedgerEntry {
    id: string;
    orderId: string;
    product: string;
    provider: string;
    date: string | null;
    amount: number;
    cost: number;
    credit: number;
    funds: string;
    fulfillment: string;
    hold: string;
    invoice: string;
    state: string;
    batch: string;
    allocated: boolean;
}

const findBatch = (batches: Batch[], key: string) =>
    batches.find((b) => b.status !== "Voided" && b.entries.includes(key));

export function ledger(batches: Batch[]): LedgerEntry[] {
    return orders
        .filter((o) => o.captured > 0)
        .flatMap((o) =>
            o.items.flatMap((l, i) => {
                const key = `${o.id}-${i}`;
                const paid = o.settlement === "Paid";
                const net = l.cost - (paid ? 0 : l.credit);
                const base: LedgerEntry = {
                    id: key,
                    orderId: o.id,
                    product: l.name,
                    provider: l.provider,
                    date: o.captureDate,
                    amount: net,
                    cost: l.cost,
                    credit: paid ? 0 : l.credit,
                    funds: o.funds,
                    fulfillment: l.fulfillment,
                    hold: o.hold,
                    invoice: "INV-DEMO-" + o.id.slice(-4),
                    state: o.settlement,
                    batch: "",
                    allocated: false,
                };
                const rows: LedgerEntry[] = net
                    ? [base]
                    : [{ ...base, state: "Recovered", hold: "Supplier cost fully credited" }];

                if (paid && l.credit) {
                    rows.push({
                        ...base,
                        id: key + "-CREDIT",
                        amount: -l.credit,
                        cost: 0,
                        credit: l.credit,
                        date: o.creditDate,
                        state: "Ready",
                        batch: "",
                        allocated: false,
                        hold: "Confirmed credit on a previously paid purchase",
                        invoice: "CN-DEMO-" + o.id.slice(-4),
                    });
                }

                return rows.map((r) => {
                    const b = findBatch(batches, r.id);
                    return b ? { ...r, state: b.status, batch: b.id, allocated: true } : r;
                });
            }),
        );
}

export function payableRows(f: Filters, batches: Batch[]): LedgerEntry[] {
    return ledger(batches).filter(
        (r) =>
            within(r.date, f) &&
            (f.provider === "all" || r.provider === f.provider) &&
            (f.type === "all" || getOrder(r.orderId)?.type === f.type) &&
            searchMatch(r, f) &&
            (f.status === "all" || r.state === f.status) &&
            (f.tab === "all" ||
                (f.tab === "ready" && r.state === "Ready") ||
                (f.tab === "held" && /Held|Awaiting funds/.test(r.state)) ||
                (f.tab === "credits" && r.amount < 0)),
    );
}