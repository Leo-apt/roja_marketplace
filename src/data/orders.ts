import type { Order, OrderLine } from "@/types";
import { sum } from "@/utils/money";
import { getProduct } from "./products";

function line(id: string, qty = 1, extra: Partial<OrderLine> = {}): OrderLine {
    const p = getProduct(id);
    return {
        productId: id, sku: p.sku, name: p.name, provider: p.provider,
        qty, unit: p.price, cost: p.cost * qty,
        discount: 0, refund: 0, credit: 0, chargeback: 0,
        version: p.version, fulfillment: "Active",
        ...extra,
    };
}

type OrderExtra = Partial<Order>;

function order(id: string, name: string, stage: string, date: string, items: OrderLine[], extra: OrderExtra = {}): Order {
    const o = {
        id: "ORD-" + id,
        customer: name,
        customerId: "CUS-" + id,
        email: name.toLowerCase().replace(/ /g, ".") + "@example.com",
        stage, currentStage: stage, date, captureDate: date,
        items,
        channel: "iOS",
        payment: "Captured",
        fulfillment: "Active",
        funds: "Cleared",
        shipping: 0, tax: 0, refundTax: 0, refundShipping: 0,
        refundDate: null, creditDate: null, disputeDate: null,
        disputeFee: 0, refundFee: 0,
        settlement: "Ready",
        hold: "",
        subscriptionId: null,
        type: getProduct(items[0].productId).type,
        ...extra,
    } as Order;

    o.subtotal = sum(items, (l) => l.unit * l.qty);
    o.discount = sum(items, "discount");
    o.productAmount = o.subtotal - o.discount;
    o.total = o.productAmount + o.tax + o.shipping;
    o.captured = o.payment === "Captured" ? o.total : 0;
    o.fee = o.captured ? Math.round(o.captured * 0.029) + 30 : 0;
    o.refunded = sum(items, "refund") + o.refundTax + o.refundShipping;
    o.chargeback = sum(items, "chargeback");

    if (o.type === "Trial") {
        o.total = 0; o.captured = 0; o.fee = 0; o.productAmount = 0; o.subtotal = 0;
        o.items.forEach((l) => { l.unit = 0; l.cost = 0; });
    }
    if (o.payment !== "Captured") o.items.forEach((l) => { l.cost = 0; });
    return o;
}

export const orders: Order[] = [
    order("1001", "Jordan Williams", "4", "2026-10-01", [line("PRD-003", 2, { discount: 480, fulfillment: "Delivered" })], { shipping: 499, tax: 346, fulfillment: "Delivered", channel: "Web" }),
    order("1002", "Emma Carter", "1", "2026-10-02", [line("PRD-002")], { subscriptionId: "SUB-2002" }),
    order("1003", "Mateo Lopez", "4", "2026-10-03", [line("PRD-004", 1, { fulfillment: "Partially fulfilled" })], { fulfillment: "Partially fulfilled", settlement: "Held", hold: "Bundle component activation failed", subscriptionId: "SUB-2003" }),
    order("1004", "Sophia Brown", "2A", "2026-10-04", [line("PRD-005", 1, { fulfillment: "Failed" })], { fulfillment: "Failed", settlement: "Held", hold: "Activation failed; support review" }),
    order("1005", "Noah Miller", "4", "2026-10-05", [line("PRD-001")], { funds: "Pending", settlement: "Awaiting funds", hold: "Gateway deposit not cleared", subscriptionId: "SUB-2005", renewal: true }),
    order("1006", "Olivia Davis", "3", "2026-10-02", [line("PRD-003", 1, { refund: 2400, credit: 1400, fulfillment: "Returned" })], { shipping: 499, tax: 192, refundTax: 192, refundShipping: 499, refundDate: "2026-10-06", creditDate: "2026-10-07", fulfillment: "Returned", settlement: "Recovered", hold: "Full supplier credit confirmed" }),
    order("1007", "Liam Wilson", "4", "2026-10-02", [line("PRD-002", 1, { refund: 1999, fulfillment: "Cancellation pending" })], { refundDate: "2026-10-06", fulfillment: "Cancellation pending", settlement: "Held", hold: "Supplier credit not confirmed", subscriptionId: "SUB-2007" }),
    order("1008", "Ava Moore", "1", "2026-10-03", [line("PRD-001", 1, { chargeback: 1499, fulfillment: "Suspended" })], { disputeDate: "2026-10-06", disputeFee: 1500, fulfillment: "Suspended", settlement: "Held", hold: "Open chargeback", subscriptionId: "SUB-2008" }),
    order("1009", "Ethan Taylor", "4", "2026-10-05", [line("PRD-004")], { payment: "Failed", captureDate: null, fulfillment: "Not started", settlement: "Not eligible", hold: "Payment declined" }),
    order("1010", "Mia Anderson", "2B", "2026-10-07", [line("PRD-002")], { type: "Trial", payment: "No charge", captureDate: null, fulfillment: "Trial active", settlement: "Not eligible", subscriptionId: "SUB-2010" }),
    order("1011", "Lucas Thomas", "4", "2026-10-04", [line("PRD-005", 1, { discount: 200 }), line("PRD-003", 1, { discount: 100, fulfillment: "Delivered" })], { shipping: 499, tax: 184, fulfillment: "Completed", channel: "Android", type: "One-time" }),
    order("1012", "Isabella Jackson", "2A", "2026-10-06", [line("PRD-003")], { shipping: 499, tax: 192, payment: "Authorized", captureDate: null, fulfillment: "Not started", settlement: "Not eligible" }),
    order("1013", "James White", "4", "2026-09-10", [line("PRD-001", 1, { cost: 800, version: "P2 / C1" })], { settlement: "Paid", subscriptionId: "SUB-2013", renewal: true }),
    order("1014", "Charlotte Harris", "4", "2026-09-12", [line("PRD-002")], { settlement: "Paid", subscriptionId: "SUB-2014", renewal: true }),
    order("1015", "Amelia Martin", "1", "2026-10-01", [line("PRD-003", 2, { refund: 2400, credit: 1400, fulfillment: "Delivered" })], { shipping: 499, tax: 384, refundTax: 192, refundDate: "2026-10-06", creditDate: "2026-10-07", fulfillment: "Delivered", channel: "Web" }),
    order("1016", "Henry Thompson", "3", "2026-10-06", [line("PRD-005")], { settlement: "Held", hold: "Gateway reconciliation mismatch", gatewayVariance: -100 }),
    order("1017", "Grace Garcia", "4", "2026-10-03", [line("PRD-008", 1, { fulfillment: "Delivered" })], { shipping: 0, tax: 336, fulfillment: "Delivered" }),
    order("1018", "Daniel Martinez", "4", "2026-10-07", [line("PRD-002")], { payment: "Failed", captureDate: null, fulfillment: "Grace period", settlement: "Not eligible", subscriptionId: "SUB-2018", renewal: true }),
    order("1019", "Freddie Clark", "4", "2026-09-05", [line("PRD-002", 1, { refund: 1999, credit: 1200, fulfillment: "Cancelled" })], { refundDate: "2026-10-04", creditDate: "2026-10-06", fulfillment: "Cancelled", settlement: "Paid", subscriptionId: "SUB-2019", currentStage: "1" }),
];

export const getOrder = (id: string): Order | undefined => orders.find((o) => o.id === id);