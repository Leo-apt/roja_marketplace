import { useMemo } from "react";
import { ledger, payableRows, type LedgerEntry } from "@/domain/ledger";
import { searchMatch, within } from "@/domain/filters";
import { useApp } from "@/hooks/useApp";
import type { Batch } from "@/types";
import type { Column } from "@/types/table";
import PageShell from "@/components/layout/PageShell";
import DataTable from "@/components/shared/DataTable";
import { Cards, Metric } from "@/components/shared/Metric";
import { BatchLink, OrderLink } from "@/components/shared/Links";
import Tag from "@/components/shared/Tag";
import CreateBatchDialog from "@/components/dialogs/CreateBatchDialog";
import BatchDrawer from "@/components/drawers/BatchDrawer";
import { colsToExport, exportCsv } from "@/utils/csv";
import { money, sum } from "@/utils/money";

export default function SettlementsPage() {
    const { filters: f, batches, role, selected, openDialog, openDrawer, toast } = useApp();
    const led = useMemo(() => ledger(batches), [batches]);
    const all = useMemo(() => payableRows(f, batches), [f, batches]);

    const ready = all.filter((r) => r.state === "Ready");
    const held = all.filter((r) => /Held|Awaiting funds/.test(r.state));
    const reserved = all.filter((r) => /Draft|Pending approval|Approved|Payment submitted/.test(r.state));
    const paid = all.filter((r) => r.state === "Paid");

    const batchRows = batches.filter(
        (b) =>
            within(b.created, f) &&
            (f.provider === "all" || b.payee === f.provider) &&
            searchMatch(b, f) &&
            (f.status === "all" || b.status === f.status),
    );

    const startBatch = () => {
        if (role !== "preparer") return toast("Finance preparer role is required.");
        const entries = led.filter((r) => selected.has(r.id));
        if (entries.length !== selected.size || entries.some((r) => r.state !== "Ready" || r.allocated))
            return toast("Some entries are no longer eligible. Refresh the payable ledger.");
        const payees = [...new Set(entries.map((r) => r.provider))];
        if (payees.length !== 1) return toast("Select entries for one supplier/payee only.");
        const amount = sum(entries, "amount");
        if (amount <= 0) return toast("Net payout must be positive. Carry a supplier credit forward to offset a future payable.");
        const credits = led.filter((r) => r.provider === payees[0] && r.amount < 0 && r.state === "Ready" && !r.allocated);
        if (credits.some((r) => !selected.has(r.id))) return toast("Include available confirmed credits for this payee before preparing a payout.");
        openDialog(<CreateBatchDialog payee={payees[0]} amount={amount} entries={entries.map((r) => r.id)} period={`${f.from} to ${f.to}`} />);
    };

    const ledgerCols: Column<LedgerEntry>[] = [
        {
            key: "id", label: "Source / invoice", value: (r) => r.id, render: (r) => (
                <div className="flex flex-col gap-[3px]">
                    <OrderLink id={r.orderId} />
                    <small className="text-xs text-muted font-mono">{r.invoice}{r.amount < 0 ? " · Credit note" : ""}</small>
                </div>
            )
        },
        {
            key: "product", label: "Product / payee", value: (r) => r.product, render: (r) => (
                <div className="flex flex-col gap-[3px]"><span>{r.product}</span><small className="text-xs text-muted">{r.provider}</small></div>
            )
        },
        { key: "cost", label: "Supplier cost", align: "right", value: (r) => r.cost, render: (r) => money(r.cost) },
        { key: "credit", label: "Confirmed credit", align: "right", value: (r) => r.credit, render: (r) => money(r.credit) },
        {
            key: "amount", label: "Net payable", align: "right", value: (r) => r.amount, render: (r) => (
                <span className={`font-semibold ${r.amount < 0 ? "text-bad" : ""}`}>{money(r.amount)}</span>
            )
        },
        {
            key: "state", label: "Settlement / funds", value: (r) => r.state, render: (r) => (
                <><Tag s={r.state} /><div className="text-xs text-muted">Funds {r.funds}</div></>
            )
        },
        {
            key: "hold", label: "Hold / allocation", value: (r) => r.batch || r.hold, render: (r) =>
                r.batch ? <BatchLink id={r.batch} mono>{r.batch}</BatchLink> : <span className="text-xs text-muted">{r.hold || "Fulfillment and payment verified"}</span>
        },
    ];

    const batchCols: Column<Batch>[] = [
        {
            key: "id", label: "Batch / period", value: (b) => b.id, render: (b) => (
                <div className="flex flex-col gap-[3px]"><BatchLink id={b.id} mono>{b.id}</BatchLink><small className="text-xs text-muted">{b.period}</small></div>
            )
        },
        { key: "payee", label: "Payee", value: (b) => b.payee, render: (b) => b.payee },
        { key: "amount", label: "Net payout", align: "right", value: (b) => b.amount, render: (b) => money(b.amount) },
        { key: "entries", label: "Entries", sort: (b) => b.entries.length, value: (b) => b.entries.length, render: (b) => String(b.entries.length) },
        { key: "status", label: "Approval / payout status", value: (b) => b.status, render: (b) => <Tag s={b.status} /> },
        {
            key: "approvedBy", label: "Prepared / approved by", value: (b) => b.preparedBy, render: (b) => (
                <div className="flex flex-col gap-[3px]"><span>{b.preparedBy}</span><small className="text-xs text-muted">{b.approvedBy || "Approval pending"}</small></div>
            )
        },
        {
            key: "reference", label: "Payment evidence", value: (b) => b.reference, render: (b) =>
                b.reference ? (
                    <div className="flex flex-col gap-[3px]"><span className="font-mono">{b.reference}</span><small className="text-xs text-muted">Confirmed {b.paid}</small></div>
                ) : (
                    <span className="text-muted">No bank confirmation</span>
                )
        },
        {
            key: "action", label: "Details", render: (b) => (
                <button
                    className="inline-flex min-h-[29px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => openDrawer(<BatchDrawer id={b.id} />)}
                >
                    View batch
                </button>
            )
        },
    ];

    const onExport = () =>
        f.tab === "batches"
            ? exportCsv({ view: "settlements-batches", filters: f, rows: batchRows, cols: colsToExport(batchCols) })
            : exportCsv({ view: "settlements", filters: f, rows: all, cols: colsToExport(ledgerCols) });

    const tabs: [string, string][] = [
        ["all", "Payable ledger"], ["ready", "Ready"], ["held", "Held / awaiting funds"],
        ["credits", "Supplier credits"], ["batches", "Settlement batches"],
    ];

    return (
        <PageShell view="settlements" onExport={onExport}>
            <Cards>
                <Metric label="Ready net payable" value={money(sum(ready, "amount"))} detail="Eligible, unallocated entries; credits offset payout" />
                <Metric label="Held / awaiting funds" value={money(sum(held, "amount"))} detail="Not eligible to pay yet" />
                <Metric label="Reserved in unpaid batches" value={money(sum(reserved, "amount"))} detail="No duplicate payout allocation" />
                <Metric label="Confirmed paid in scope" value={money(sum(paid, "amount"))} detail="Source entries with bank-paid confirmation" />
            </Cards>

            <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">
                Supplier payout ≠ gateway deposit. This sample uses supplier cost less confirmed credits as the payable model, not ROJA margin. Payee contracts, settlement frequency, reserve policy, and payment method require client confirmation.
            </div>

            {f.tab === "batches" ? (
                <DataTable<Batch>
                    rows={batchRows}
                    cols={batchCols}
                    viewKey="settlements-batches"
                    label="Supplier settlements"
                    tabs={tabs}
                    note="Only eligible, unallocated entries can be selected. A batch is immutable after submission. Maker/checker approval and confirmed external payment evidence are required."
                />
            ) : (
                <DataTable<LedgerEntry>
                    rows={all}
                    cols={ledgerCols}
                    viewKey="settlements"
                    label="Supplier settlements"
                    tabs={tabs}
                    selectable={{ id: (r) => r.id, disabled: (r) => r.state !== "Ready" || r.allocated }}
                    extra={
                        <button
                            className="inline-flex min-h-[29px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-2 py-1 text-xs font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={role !== "preparer" || !selected.size}
                            onClick={startBatch}
                        >
                            Create draft batch{selected.size ? ` (${selected.size})` : ""}
                        </button>
                    }
                    note="Only eligible, unallocated entries can be selected. A batch is immutable after submission. Maker/checker approval and confirmed external payment evidence are required."
                />
            )}
        </PageShell>
    );
}