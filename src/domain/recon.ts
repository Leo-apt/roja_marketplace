import type { Order } from "@/types";
import { orders } from "@/data/orders";
import { sum } from "@/utils/money";
import { commonOrder } from "./finance";
import { type Filters, within } from "./filters";

export interface ReconRow {
    id: string;
    customer: string;
    gateway: number;
    expected: number;
    variance: number;
    status: string;
    o: Order;
}

export function reconRows(f: Filters): ReconRow[] {
    return orders
        .filter((o) => within(o.date, f) && commonOrder(o, f))
        .map((o) => {
            const expected = o.captured - o.fee - o.refunded - o.chargeback - o.disputeFee;
            const gateway = expected + (o.gatewayVariance ?? 0);
            const variance = gateway - expected;
            const unrecoveredCost = o.refunded && sum(o.items, "cost") > sum(o.items, "credit");

            let status = "Matched";
            if (variance) status = "Mismatch";
            else if (o.funds === "Pending" && o.captured) status = "Awaiting deposit";
            else if (
                o.payment === "Failed" ||
                /Failed|Partially|Cancellation pending/.test(o.fulfillment) ||
                o.chargeback ||
                unrecoveredCost
            )
                status = "Action required";

            return { id: o.id, customer: o.customer, gateway, expected, variance, status, o };
        })
        .filter((r) => f.status === "all" || r.status === f.status);
}