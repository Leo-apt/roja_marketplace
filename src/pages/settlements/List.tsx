// Marketplace > Receivables & settlements: provider payables, client receivables and payout batches (sample data for now).
import { useState } from "react";
import { Banknote, Eye, HandCoins, Hourglass, Landmark, ReceiptText } from "lucide-react";
import ListShell, { type Col } from "@/components/catalog/ListShell";
import { btn } from "@/components/catalog/FormBits";
import type { FilterField } from "@/components/catalog/ListDrawers";
import type { Stat } from "@/components/catalog/StatCards";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import { useApp } from "@/hooks/useApp";
import { useEnv } from "@/env/EnvContext";
import { money } from "@/pages/history/format";
import { CLIENTS, ENVS, PROVIDERS, PURCHASE_DATA } from "@/pages/purchases/purchasesData";
import PurchaseDrawer, { Pill } from "@/pages/purchases/PurchaseDrawer";
import { batches, ME, payables, receivables, type Batch, type Payable, type Receivable } from "./settlementData";

type Ledger = "payables" | "receivables" | "batches";
const opts = (all: string, xs: string[]) => [{ value: "all", label: all }, ...xs.map((x) => ({ value: x, label: x }))];
const dateFields: FilterField[] = [
    { key: "from", label: "Date · from", type: "date", options: [] },
    { key: "to", label: "Date · to", type: "date", options: [] },
];
const base = [
    { key: "client", label: "Client", options: opts("All clients", CLIENTS) },
    { key: "env", label: "Environment", options: opts("All environments", ENVS) },
];
const payFields: FilterField[] = [...base, { key: "provider", label: "Provider", options: opts("All providers", PROVIDERS) },
{ key: "status", label: "Settlement eligibility", options: opts("All", ["Ready", "Held", "Awaiting client payment", "Awaiting merchant deposit"]) }, ...dateFields];
const recvFields: FilterField[] = [...base, { key: "status", label: "Client settlement", options: opts("All", ["Paid", "Awaiting client payment"]) }, ...dateFields];
const batchFields: FilterField[] = [...base, { key: "provider", label: "Provider", options: opts("All providers", PROVIDERS) },
{ key: "status", label: "Approval / payment", options: opts("All", ["Draft", "Pending approval", "Approved", "Payment submitted", "Paid", "Voided"]) }, ...dateFields];

const inScope = (r: { client: string; env: string; date: string }, f: Record<string, string>) =>
    (f.client === "all" || r.client === f.client) && (f.env === "all" || r.env === f.env) &&
    (f.from === "all" || r.date >= f.from) && (f.to === "all" || r.date <= f.to);
const dollars = (c: number) => (c / 100).toFixed(2);
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + f(x), 0);

const Box = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-line bg-card p-5">{children}</div>;
const KV = ({ rows }: { rows: [string, React.ReactNode][] }) => (
    <Box><dl className="grid gap-4 text-xs sm:grid-cols-2">{rows.map(([k, v]) => <div key={k}><dt className="font-semibold text-muted">{k}</dt><dd className="mt-0.5 break-all text-ink">{v}</dd></div>)}</dl></Box>
);
const Note = ({ children, warn }: { children: React.ReactNode; warn?: boolean }) => (
    <div className={`rounded-lg px-4 py-3 text-xs ${warn ? "border border-note-warn-border bg-note-warn-bg font-semibold text-note-warn-text" : "border border-note-info-border bg-note-info-bg text-note-info-text"}`}>{children}</div>
);
const inputCls = "h-10 w-full rounded-md border border-field-border bg-field-bg px-3 text-xs outline-none hover:border-field-border-hover focus-visible:ring-2 focus-visible:ring-brand/30";

function ReceiptDrawer({ row, onSave }: { row: Receivable; onSave: (ref: string) => void }) {
    const [ref, setRef] = useState("");
    const [amt, setAmt] = useState(dollars(row.balance));
    const [ok, setOk] = useState(false);
    const [done, setDone] = useState(row.balance <= 0);
    const valid = !!ref.trim() && ok && Math.round(Number(amt) * 100) === row.balance;
    return (
        <Drawer title={`Client receipt · ${row.id}`} kicker={`${row.client} · ${row.env}`} width="min(480px, calc(100vw - 20px))"
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={close}>Close</button>
                    {!done && <button className={`${btn.primary} disabled:opacity-50`} disabled={!valid} onClick={() => { onSave(ref.trim()); setDone(true); }}>Record confirmed receipt</button>}
                </>
            )}>
            <KV rows={[["Master invoice", money(row.billed)], ["Outstanding", money(done ? 0 : row.balance)]]} />
            {done ? <Note>This receivable is settled.</Note> : (
                <>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">External receipt reference
                        <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="DEMO-RECEIPT-…" /></label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">Confirmed amount (USD)
                        <input className={inputCls} value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> The client payment is confirmed, not pending.</label>
                    <Note warn>Sample receipt only. The amount must match the outstanding invoice.</Note>
                </>
            )}
        </Drawer>
    );
}

function BatchDrawer({ row, onPatch }: { row: Batch; onPatch: (id: string, p: Partial<Batch>) => void }) {
    const [b, setB] = useState(row);
    const [ref, setRef] = useState("");
    const [ok, setOk] = useState(false);
    const act = (p: Partial<Batch>) => { setB((x) => ({ ...x, ...p })); onPatch(row.id, p); };
    const self = b.preparedBy === ME;
    return (
        <Drawer title={b.id} kicker={`${b.client} · ${b.env} · ${b.provider}`}
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={close}>Close</button>
                    {b.status === "Draft" && <button className={btn.secondary} onClick={() => act({ status: "Voided" })}>Void draft</button>}
                    {b.status === "Draft" && <button className={btn.primary} onClick={() => act({ status: "Pending approval" })}>Submit for approval</button>}
                    {b.status === "Pending approval" && <button className={`${btn.primary} disabled:opacity-50`} disabled={self} onClick={() => act({ status: "Approved", approvedBy: ME })}>Approve payout</button>}
                    {b.status === "Approved" && <button className={btn.primary} onClick={() => act({ status: "Payment submitted" })}>Record submission</button>}
                    {b.status === "Payment submitted" && <button className={`${btn.primary} disabled:opacity-50`} disabled={!ref.trim() || !ok} onClick={() => act({ status: "Paid", reference: ref.trim() })}>Record confirmed payment</button>}
                </>
            )}>
            <div className="flex flex-wrap gap-2"><Pill text={b.status} /></div>
            <KV rows={[["Provider payee", b.provider], ["Approved amount", money(b.amount)], ["Source entries", String(b.entries)], ["Prepared by", b.preparedBy],
            ["Independent approver", b.approvedBy || "Awaiting approval"], ["Payment reference", b.reference || "Not confirmed"]]} />
            {b.status === "Pending approval" && self && <Note warn>You prepared this batch, so a different person must approve it.</Note>}
            {b.status === "Payment submitted" && (
                <>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">External payment reference
                        <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="BANK-DEMO-…" /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I verified the bank payment is confirmed, not pending.</label>
                </>
            )}
            <Note warn>Sample workflow. No money is sent, and a submitted payment is not Paid until confirmed.</Note>
        </Drawer>
    );
}

export default function SettlementsList() {
    const { openDrawer } = useApp();
    const { mode } = useEnv();
    const [ledger, setLedger] = useState<Ledger>("payables");
    const [receipts, setReceipts] = useState<Record<string, string>>({});
    const [patches, setPatches] = useState<Record<string, Partial<Batch>>>({});
    const viewOrder = (id: string) => { const p = PURCHASE_DATA[mode].find((x) => x.id === id); if (p) openDrawer(<PurchaseDrawer row={p} mode={mode} initial="settlement" />); };

    const toolbar = (
        <div className="w-56">
            <Dropdownbox name="ledger" label="Show" value={ledger} rounded="rounded-lg" compact
                options={[{ value: "payables", label: "Provider payables" }, { value: "receivables", label: "Client receivables" }, { value: "batches", label: "Payout batches" }]}
                onChange={(e) => setLedger(e.target.value as Ledger)} />
        </div>
    );
    const notice = <Note warn>Provider payouts and client receipts are separate ledgers. One payout batch belongs to one client, environment, provider and currency. Never combine sandbox with live.</Note>;
    const common = { createLabel: "", hideView: true, hideEdit: true, hideCreate: true, toolbar, notice, basePath: "/marketplace/settlements" };

    if (ledger === "payables") {
        const rows = payables(mode);
        const cols: Col<Payable>[] = [
            { key: "orderId", label: "Order", sticky: 140, render: (r) => <button type="button" onClick={() => viewOrder(r.orderId)} className="text-left font-semibold text-link hover:underline">{r.orderId}</button> },
            { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
            { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
            { key: "date", label: "Source date", render: (r) => r.date },
            { key: "provider", label: "Provider payee", render: (r) => r.provider },
            { key: "product", label: "Product", render: (r) => r.product },
            { key: "amount", label: "Net payable", align: "right", render: (r) => money(r.amount), exportValue: (r) => dollars(r.amount) },
            { key: "status", label: "Eligibility", render: (r) => <Pill text={r.status} /> },
            { key: "hold", label: "Hold reason", render: (r) => r.hold || "Eligible" },
        ];
        const cards = (rs: Payable[]): Stat[] => [
            { label: "Ready net payable", value: money(sum(rs.filter((r) => r.status === "Ready"), (r) => r.amount)), note: "Credits offset payables in the same scope", icon: Banknote },
            { label: "Held payable", value: money(sum(rs.filter((r) => r.status === "Held"), (r) => r.amount)), note: "Provider fulfillment gate", icon: Hourglass },
            { label: "Awaiting client / deposit", value: money(sum(rs.filter((r) => r.status.startsWith("Awaiting")), (r) => r.amount)), note: "Cash clearing gates", icon: Landmark },
            { label: "Payable entries", value: rs.length, note: "Captured order components", icon: ReceiptText },
        ];
        return (
            <ListShell key="p" {...common} rows={rows} cols={cols} rowLabel="payables" searchPlaceholder="Search order, client, provider, product…"
                filterFields={payFields} cards={cards} exportName={`payables-${mode}`}
                match={(r, q, f) => (!q || [r.orderId, r.client, r.env, r.provider, r.product].some((v) => v.toLowerCase().includes(q))) && inScope(r, f) &&
                    (f.provider === "all" || r.provider === f.provider) && (f.status === "all" || r.status === f.status)}
                extraActions={[{ label: "View order", icon: <Eye className="size-4" />, onClick: (id) => viewOrder(id.replace(/-C$/, "")) }]} />
        );
    }

    if (ledger === "receivables") {
        const rows = receivables(mode).map((r) => receipts[r.id] ? { ...r, paid: r.billed, balance: 0, status: "Paid" as const, reference: receipts[r.id] } : r);
        const cols: Col<Receivable>[] = [
            { key: "id", label: "Order", sticky: 140, render: (r) => <button type="button" onClick={() => viewOrder(r.id)} className="text-left font-semibold text-link hover:underline">{r.id}</button> },
            { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
            { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
            { key: "date", label: "Capture date", render: (r) => r.date },
            { key: "billed", label: "Master invoice", align: "right", render: (r) => money(r.billed), exportValue: (r) => dollars(r.billed) },
            { key: "paid", label: "Client payment", align: "right", render: (r) => money(r.paid), exportValue: (r) => dollars(r.paid) },
            { key: "balance", label: "Outstanding", align: "right", render: (r) => money(r.balance), exportValue: (r) => dollars(r.balance) },
            { key: "status", label: "Client settlement", render: (r) => <Pill text={r.status} /> },
            { key: "reference", label: "Receipt reference", render: (r) => r.reference || "-" },
        ];
        const cards = (rs: Receivable[]): Stat[] => [
            { label: "Master invoices", value: money(sum(rs, (r) => r.billed)), note: "Client price (W) billed", icon: ReceiptText },
            { label: "Client payments", value: money(sum(rs, (r) => r.paid)), note: "Confirmed receipts", icon: Banknote },
            { label: "Outstanding", value: money(sum(rs, (r) => r.balance)), note: "Client merchant to Master", icon: HandCoins },
            { label: "Awaiting payment", value: rs.filter((r) => r.balance > 0).length, note: "Invoices not settled", icon: Hourglass },
        ];
        return (
            <ListShell key="r" {...common} rows={rows} cols={cols} rowLabel="receivables" searchPlaceholder="Search order, client, reference…"
                filterFields={recvFields} cards={cards} exportName={`receivables-${mode}`}
                match={(r, q, f) => (!q || [r.id, r.client, r.env, r.reference].some((v) => v.toLowerCase().includes(q))) && inScope(r, f) && (f.status === "all" || r.status === f.status)}
                extraActions={[{ label: "Record client receipt", icon: <Banknote className="size-4" />, onClick: (id) => { const r = rows.find((x) => x.id === id); if (r) openDrawer(<ReceiptDrawer row={r} onSave={(ref) => setReceipts((m) => ({ ...m, [id]: ref }))} />); } }]} />
        );
    }

    const rows = batches(mode).map((b) => ({ ...b, ...patches[b.id] }));
    const onPatch = (id: string, p: Partial<Batch>) => setPatches((m) => ({ ...m, [id]: { ...m[id], ...p } }));
    const cols: Col<Batch>[] = [
        { key: "id", label: "Batch", sticky: 140, render: (r) => <button type="button" onClick={() => openDrawer(<BatchDrawer row={r} onPatch={onPatch} />)} className="text-left font-semibold text-link hover:underline">{r.id}</button> },
        { key: "client", label: "Client", sticky: 110, render: (r) => r.client },
        { key: "env", label: "Environment", sticky: 110, render: (r) => r.env },
        { key: "date", label: "Created", render: (r) => r.date },
        { key: "provider", label: "Provider payee", render: (r) => r.provider },
        { key: "amount", label: "Approved payout", align: "right", render: (r) => money(r.amount), exportValue: (r) => dollars(r.amount) },
        { key: "entries", label: "Entries", align: "right", render: (r) => r.entries },
        { key: "status", label: "Approval / payment", render: (r) => <Pill text={r.status} /> },
        { key: "approvedBy", label: "Independent approver", render: (r) => r.approvedBy || "Awaiting approval" },
        { key: "reference", label: "Payment reference", render: (r) => r.reference || "-" },
    ];
    const cards = (rs: Batch[]): Stat[] => [
        { label: "Payout batches", value: rs.length, note: "One client, provider and currency each", icon: Landmark },
        { label: "Reserved unpaid", value: money(sum(rs.filter((r) => !["Paid", "Voided"].includes(r.status)), (r) => r.amount)), note: "No duplicate source allocation", icon: Hourglass },
        { label: "Pending approval", value: rs.filter((r) => r.status === "Pending approval").length, note: "Needs a different approver", icon: HandCoins },
        { label: "Paid", value: money(sum(rs.filter((r) => r.status === "Paid"), (r) => r.amount)), note: "Bank confirmed", icon: Banknote },
    ];
    return (
        <ListShell key="b" {...common} rows={rows} cols={cols} rowLabel="batches" searchPlaceholder="Search batch, client, provider…"
            filterFields={batchFields} cards={cards} exportName={`payout-batches-${mode}`}
            match={(r, q, f) => (!q || [r.id, r.client, r.env, r.provider, r.reference].some((v) => v.toLowerCase().includes(q))) && inScope(r, f) &&
                (f.provider === "all" || r.provider === f.provider) && (f.status === "all" || r.status === f.status)}
            extraActions={[{ label: "View batch", icon: <Eye className="size-4" />, onClick: (id) => { const r = rows.find((x) => x.id === id); if (r) openDrawer(<BatchDrawer row={r} onPatch={onPatch} />); } }]} />
    );
}