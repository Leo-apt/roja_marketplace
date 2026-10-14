import type { Order, OrderLine } from "@/types";

export function lifetimeFinance(o: Order) {
    const total = o.fee + o.disputeFee + o.refundFee;
    const w = (x: OrderLine) =>
        o.productAmount ? (x.unit * x.qty - x.discount) / o.productAmount : 1 / o.items.length;

    return o.items.map((l, i) => {
        const netSales = (o.captured ? l.unit * l.qty - l.discount : 0) - l.refund - l.chargeback;
        const netCost = l.cost - l.credit;
        const fees =
            i === o.items.length - 1
                ? total - o.items.slice(0, -1).reduce((s, x) => s + Math.round(total * w(x)), 0)
                : Math.round(total * w(l));
        return { l, netSales, netCost, gross: netSales - netCost, fees };
    });
}