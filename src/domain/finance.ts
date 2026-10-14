import type { Order, OrderLine } from "@/types";
import { orders } from "@/data/orders";
import { sum } from "@/utils/money";
import { type Filters, within, searchMatch } from "./filters";

export function commonOrder(o: Order, f: Filters): boolean {
    return (
        (f.provider === "all" || o.items.some((l) => l.provider === f.provider)) &&
        (f.type === "all" || o.type === f.type) &&
        (f.stage === "all" || o.currentStage === f.stage) &&
        (f.channel === "all" || o.channel === f.channel) &&
        searchMatch(o, f)
    );
}

export interface FinanceRow {
    id: string;
    orderId: string;
    productId: string;
    product: string;
    provider: string;
    customer: string;
    units: number;
    capturedSales: number;
    discount: number;
    refund: number;
    chargeback: number;
    cost: number;
    credit: number;
    fees: number;
    version: string;
    sales: number;
    netCost: number;
    gross: number;
    contribution: number;
    unrecovered: boolean;
    o: Order;
    l: OrderLine;
}

export interface Totals {
    sales: number;
    capturedSales: number;
    refund: number;
    chargeback: number;
    cost: number;
    credit: number;
    netCost: number;
    gross: number;
    fees: number;
    contribution: number;
}

const lineAmount = (l: OrderLine) => l.unit * l.qty - l.discount;
const weightOf = (o: Order, l: OrderLine) =>
    o.productAmount ? lineAmount(l) / o.productAmount : 1 / o.items.length;

/** Split an order-level fee across lines; last line absorbs rounding. */
function feeShare(o: Order, i: number, total: number): number {
    if (i === o.items.length - 1) {
        const prior = o.items
            .slice(0, -1)
            .reduce((s, x) => s + Math.round(total * weightOf(o, x)), 0);
        return total - prior;
    }
    return Math.round(total * weightOf(o, o.items[i]));
}

export function financeRows(f: Filters): FinanceRow[] {
    const out: FinanceRow[] = [];
    for (const o of orders) {
        if (!commonOrder(o, f)) continue;
        o.items.forEach((l, i) => {
            if (f.provider !== "all" && l.provider !== f.provider) return;

            const captured = within(o.captureDate, f);
            const refunded = within(o.refundDate, f);
            const credited = within(o.creditDate, f);
            const disputed = within(o.disputeDate, f);
            const w = weightOf(o, l);

            const fees =
                (captured ? feeShare(o, i, o.fee) : 0) +
                (refunded ? Math.round(o.refundFee * w) : 0) +
                (disputed ? Math.round(o.disputeFee * w) : 0);

            const hasCapture = captured && o.captured > 0;
            const capturedSales = hasCapture ? lineAmount(l) : 0;
            const refund = refunded ? l.refund : 0;
            const chargeback = disputed ? l.chargeback : 0;
            const cost = hasCapture ? l.cost : 0;
            const credit = credited ? l.credit : 0;

            const sales = capturedSales - refund - chargeback;
            const netCost = cost - credit;
            const gross = sales - netCost;
            const contribution = gross - fees;

            if (!capturedSales && !refund && !chargeback && !cost && !credit && !fees) return;

            const row: FinanceRow = {
                id: `${o.id}-${i}`,
                orderId: o.id,
                productId: l.productId,
                product: l.name,
                provider: l.provider,
                customer: o.customer,
                units: hasCapture ? l.qty : 0,
                capturedSales,
                discount: hasCapture ? l.discount : 0,
                refund,
                chargeback,
                cost,
                credit,
                fees,
                version: l.version,
                sales,
                netCost,
                gross,
                contribution,
                unrecovered: l.refund > 0 && l.cost > l.credit,
                o,
                l,
            };

            if ((f.negative || f.status === "Negative contribution") && row.contribution >= 0) return;
            if (f.status === "Unrecovered cost" && !row.unrecovered) return;
            out.push(row);
        });
    }
    return out;
}

export function totals(rs: FinanceRow[]): Totals {
    return {
        sales: sum(rs, "sales"),
        capturedSales: sum(rs, "capturedSales"),
        refund: sum(rs, "refund"),
        chargeback: sum(rs, "chargeback"),
        cost: sum(rs, "cost"),
        credit: sum(rs, "credit"),
        netCost: sum(rs, "netCost"),
        gross: sum(rs, "gross"),
        fees: sum(rs, "fees"),
        contribution: sum(rs, "contribution"),
    };
}

export interface GroupRow extends Totals {
    id: string;
    productId: string;
    label: string;
    provider: string;
    orderCount: number;
    units: number;
}

export function groupFinance(rs: FinanceRow[], by: "product" | "provider"): GroupRow[] {
    const groups = new Map<string, FinanceRow[]>();
    for (const r of rs) {
        const k = by === "provider" ? r.provider : r.productId;
        groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    return [...groups.entries()].map(([id, rows]) => ({
        id,
        productId: rows[0].productId,
        label: by === "provider" ? rows[0].provider : rows[0].product,
        provider: rows[0].provider,
        orderCount: new Set(rows.map((r) => r.orderId)).size,
        units: sum(rows, "units"),
        ...totals(rows),
    }));
}