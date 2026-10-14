import { useState, type ReactNode } from "react";
import { getOrder } from "@/data/orders";
import { getProduct } from "@/data/products";
import { subscriptions } from "@/data/subscriptions";
import { ledger } from "@/domain/ledger";
import { lifetimeFinance } from "@/domain/orderFinance";
import { useApp } from "@/hooks/useApp";
import type { Order } from "@/types";
import Drawer from "@/components/shared/Drawer";
import Tag from "@/components/shared/Tag";
import { DetailTable, Kv, MoneyRows } from "@/components/shared/Kv";
import { BatchLink } from "@/components/shared/Links";
import { INSTANCE } from "@/utils/constants";
import { money, sum } from "@/utils/money";
import SubscriptionBody from "./SubscriptionBody";

const tabs: [string, string][] = [
    ["summary", "Summary"], ["items", "Items"], ["payments", "Payments"], ["fulfillment", "Fulfillment"],
    ["subscription", "Subscription"], ["margin", "Margin"], ["settlement", "Settlement"], ["timeline", "Timeline"],
];

export default function OrderDrawer({ id }: { id: string }) {
    const { batches } = useApp();
    const [tab, setTab] = useState("summary");
    const o = getOrder(id);
    if (!o) return null;

    const last4 = o.id.slice(-4);
    let body: ReactNode = null;

    if (tab === "summary") body = <Summary o={o} />;
    if (tab === "items") body = <Items o={o} />;
    if (tab === "payments") body = <Payments o={o} last4={last4} />;
    if (tab === "fulfillment") body = <Fulfillment o={o} last4={last4} />;
    if (tab === "subscription") {
        const s = subscriptions.find((x) => x.order === o.id);
        body = s ? (
            <SubscriptionBody s={s} />
        ) : (
            <div className="px-5 py-12 text-center text-muted">
                <strong className="block">One-time purchase</strong>
                <p>No marketplace subscription is attached to this order.</p>
            </div>
        );
    }
    if (tab === "margin") body = <MarginTab o={o} />;
    if (tab === "settlement") {
        const ls = ledger(batches).filter((r) => r.orderId === o.id);
        body = ls.length ? (
            <>
                <DetailTable
                    head={["Entry", "Supplier", "Net payable", "State", "Batch / hold"]}
                    rows={ls.map((r) => [
                        r.id,
                        r.provider,
                        money(r.amount),
                        <Tag s={r.state} />,
                        r.batch ? <BatchLink id={r.batch}>{r.batch}</BatchLink> : r.hold || "Eligible",
                    ])}
                />
                <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">
                    Original paid liabilities remain in their batch. Later confirmed credits are separate carry-forward adjustments; historical payouts are never rewritten.
                </div>
            </>
        ) : (
            <div className="px-5 py-12 text-center text-muted">
                <p>No captured-payment supplier liability is eligible for this purchase.</p>
            </div>
        );
    }
    if (tab === "timeline") body = <Timeline o={o} />;

    return (
        <Drawer title={o.id} kicker={`${o.customer} · ${o.customerId}`} tabs={tabs} tab={tab} onTab={setTab}>
            {body}
        </Drawer>
    );
}

function Summary({ o }: { o: Order }) {
    return (
        <>
            <div className="flex flex-wrap items-center gap-2.5"><Tag s={o.payment} /><Tag s={o.fulfillment} /><Tag s={o.settlement} /></div>
            {o.hold && <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">{o.hold}. Payment, fulfillment and provider deactivation are independently tracked.</div>}
            <Kv
                items={[
                    ["Customer", <>{o.customer}<div className="text-xs font-normal text-muted">{o.email}</div></>],
                    ["ROJA instance", INSTANCE],
                    ["Created / channel", `${o.date} · ${o.channel}`],
                    ["EWA stage at purchase / current", `${o.stage} / ${o.currentStage}`],
                    ["Purchase type", o.type + (o.renewal ? " · Renewal" : "")],
                    ["Original checkout", "Compatible " + (o.items.length > 1 ? "one-time cart" : "Buy Now")],
                ]}
            />
            <div className="grid grid-cols-2 gap-4 max-[1180px]:grid-cols-1">
                <div>
                    <h3 className="mb-2.5 text-sm font-semibold">Order value</h3>
                    <MoneyRows rows={[["Product subtotal", o.subtotal], ["Product discount", -o.discount], ["Shipping charged", o.shipping], ["Tax collected", o.tax], ["Order total", o.total]]} />
                </div>
                <div>
                    <h3 className="mb-2.5 text-sm font-semibold">Payment outcome</h3>
                    <MoneyRows rows={[["Captured customer payment", o.captured], ["Customer refunds (all components)", -o.refunded], ["Principal chargeback", -o.chargeback], ["Net customer cash before fees", o.captured - o.refunded - o.chargeback]]} />
                </div>
            </div>
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">Stage changes do not erase purchases. Marketplace entitlement is separate from EWA membership and must follow the approved product policy.</div>
        </>
    );
}

function Items({ o }: { o: Order }) {
    return (
        <>
            <DetailTable
                head={["Product / snapshot", "Qty", "Unit sell price", "Discount", "Supplier cost", "Delivery / enrollment"]}
                rows={o.items.map((l) => [
                    <div className="flex flex-col gap-[3px]">
                        <strong className="font-semibold text-ink">{l.name}</strong>
                        <small className="text-xs text-muted font-mono">{l.sku}</small>
                        <small className="text-xs text-muted">Version {l.version}</small>
                    </div>,
                    l.qty,
                    money(l.unit),
                    money(l.discount),
                    money(l.cost),
                    <Tag s={l.fulfillment} />,
                ])}
            />
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">Bundle components and allocations are frozen when purchased; parent and components must not both be counted as sales.</div>
            {o.items
                .filter((l) => getProduct(l.productId).components.length)
                .map((l) => {
                    const p = getProduct(l.productId);
                    return (
                        <div key={l.productId} className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                            <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]"><h3 className="text-sm font-semibold">{l.name} · component snapshot</h3></div>
                            <DetailTable
                                head={["Component", "Allocated sale", "Allocated cost", "Status"]}
                                rows={p.components.map((c, i) => [
                                    c[0],
                                    money(c[1]),
                                    money(c[2]),
                                    <Tag s={o.id === "ORD-1003" && i === 1 ? "Failed" : /physical/i.test(p.category) ? "Delivered" : "Active"} />,
                                ])}
                            />
                        </div>
                    );
                })}
        </>
    );
}

function Payments({ o, last4 }: { o: Order; last4: string }) {
    return (
        <>
            <Kv
                items={[
                    ["Merchant context", "ROJA marketplace · gateway adapter"],
                    ["Card reference", o.captured ? "Visa ••4242 (sample)" : "No reusable payment reference shown"],
                    ["Provider transaction", o.captured ? "PG-DEMO-" + last4 : "—"],
                    ["Gateway funds / deposit", <Tag s={o.funds} />],
                    ["Recurring billing consent", o.subscriptionId ? "Version 2 · recorded at checkout" : "Not applicable"],
                    ["Idempotency correlation", "CHECKOUT-DEMO-" + last4],
                ]}
            />
            <DetailTable
                head={["Attempt / event", "Date", "Amount", "Status"]}
                rows={[
                    [o.renewal ? "Renewal capture" : "Checkout payment", o.date, money(o.captured || o.total), <Tag s={o.payment} />],
                    ...(o.refunded ? [["Refund REF-DEMO-" + last4, o.refundDate ?? "", money(o.refunded), <Tag s="Refund confirmed" c="good" />]] : []),
                    ...(o.chargeback ? [["Chargeback DSP-DEMO-" + last4, o.disputeDate ?? "", money(o.chargeback), <Tag s="Disputed" c="bad" />]] : []),
                ]}
            />
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">No PAN, CVV, full bank account, secret key, or payment token is exposed. Failed attempts are not sales or supplier payables.</div>
        </>
    );
}

function Fulfillment({ o, last4 }: { o: Order; last4: string }) {
    return (
        <>
            <DetailTable
                head={["Product", "Provider reference", "Fulfillment / entitlement", "Required action"]}
                rows={o.items.map((l, i) => [
                    l.name,
                    o.captured || o.type === "Trial" ? `ENR-DEMO-${last4}-${i}` : "—",
                    <Tag s={l.fulfillment} />,
                    o.hold || "No action required",
                ])}
            />
            <Kv
                items={[
                    ["Shipment tracking", o.items.some((l) => /WEL/.test(l.sku)) && o.captured ? `SHIP-DEMO-${last4} (sample)` : "Not applicable"],
                    ["Provider status source", "ARS / supplier adapter · capability pending confirmation"],
                    ["Customer delivery", "Service card / access instructions or shipment tracking"],
                    ["Provider portal access", "Display trusted, allowlisted access links; no secrets in URL"],
                ]}
            />
            <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">
                A paid but failed activation must enter the support queue. Retry requires a status lookup or stable idempotency reference, never another customer charge.
            </div>
        </>
    );
}

function MarginTab({ o }: { o: Order }) {
    const ls = lifetimeFinance(o);
    const sales = sum(ls, "netSales");
    const cost = sum(ls, "netCost");
    const gross = sum(ls, "gross");
    const fees = sum(ls, "fees");
    const unrecovered = o.refunded > 0 && sum(o.items, "cost") > sum(o.items, "credit");
    return (
        <>
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">Order lifetime view through 7 Oct, independent of the report date filter. This is collected product sales, not accounting revenue recognition.</div>
            <MoneyRows
                rows={[
                    ["Net product sales", sales],
                    ["Net supplier cost", cost],
                    ["Gross margin", gross],
                    ["Payment / dispute fees", fees],
                    ["Contribution after payment fees", gross - fees],
                ]}
            />
            <DetailTable
                head={["Line / historical version", "Net sales", "Net cost", "Gross margin", "Payment fees"]}
                rows={ls.map((r) => [
                    <>{r.l.name}<div className="text-xs text-muted">{r.l.version}</div></>,
                    money(r.netSales),
                    money(r.netCost),
                    money(r.gross),
                    money(r.fees),
                ])}
            />
            <div className={`rounded-[9px] border px-4 py-3 text-xs ${unrecovered ? "border-[#f0d8ab] bg-[#fff9ef] text-[#77501b]" : "border-[#cbdcf9] bg-[#f1f6ff] text-[#415d83]"}`}>
                Customer refunds and supplier credits are separate events. A refund can leave ROJA with unrecovered supplier cost.
            </div>
        </>
    );
}

function Timeline({ o }: { o: Order }) {
    const ev: [string, string, string][] = [
        [o.date, "Order created", `${o.channel} · ${o.type}`],
        [o.date, "Payment " + o.payment, "Gateway correlation CHECKOUT-DEMO-" + o.id.slice(-4)],
        [o.date, "Fulfillment " + o.fulfillment, "Independent provider state"],
    ];
    if (o.refundDate) ev.push([o.refundDate, "Customer refund confirmed", money(o.refunded)]);
    if (o.creditDate) ev.push([o.creditDate, "Supplier credit confirmed", money(sum(o.items, "credit"))]);
    if (o.disputeDate) ev.push([o.disputeDate, "Chargeback received", `${money(o.chargeback)} principal + ${money(o.disputeFee)} fee`]);
    ev.sort((a, b) => a[0].localeCompare(b[0]));
    return (
        <ol className="m-0 list-none p-0">
            {ev.map(([d, l, t], i) => (
                <li
                    key={i}
                    className="relative flex gap-3 pb-5 before:mt-[7px] before:size-[7px] before:shrink-0 before:rounded-full before:bg-[#5f91e5] after:absolute after:left-[3px] after:top-[18px] after:h-[calc(100%-12px)] after:w-px after:bg-line last:after:hidden"
                >
                    <div>
                        <strong className="text-xs">{l}</strong>
                        <small className="block text-xs text-muted">{d} UTC · {t}</small>
                    </div>
                </li>
            ))}
        </ol>
    );
}