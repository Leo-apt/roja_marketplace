import type { Subscription } from "@/types";
import { orders } from "./orders";
import { getProduct } from "./products";

function nextMonth(d: string): string {
    const [y, m, day] = d.split("-").map(Number);
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last))).toISOString().slice(0, 10);
}

function statusFor(orderId: string): string {
    if (orderId === "ORD-1018") return "Past due";
    if (orderId === "ORD-1010") return "Trialing";
    if (orderId === "ORD-1007" || orderId === "ORD-1019") return "Cancelled";
    if (orderId === "ORD-1008") return "Suspended";
    return "Active";
}

export const subscriptions: Subscription[] = orders
    .filter((o) => o.subscriptionId)
    .map((o) => {
        const item = o.items[0];
        const p = getProduct(item.productId);
        return {
            id: o.subscriptionId as string,
            order: o.id,
            customer: o.customer,
            product: item.name,
            productId: item.productId,
            provider: item.provider,
            stage: o.currentStage,
            amount: p.price,
            status: statusFor(o.id),
            start: o.date,
            next: o.id === "ORD-1010" ? "2026-10-21" : o.id === "ORD-1018" ? "2026-10-09" : nextMonth(o.date),
            termEnd: o.id === "ORD-1010" ? "2026-10-21" : o.id === "ORD-1018" ? "2026-10-07" : nextMonth(o.date),
            attempts: o.id === "ORD-1018" ? 2 : 0,
            version: item.version,
        };
    });

export const getSubscriptionByOrder = (orderId: string) =>
    subscriptions.find((s) => s.order === orderId);