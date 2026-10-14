import { ledger } from "@/domain/ledger";
import { useApp } from "@/hooks/useApp";
import Drawer from "@/components/shared/Drawer";
import Tag from "@/components/shared/Tag";
import { DetailTable, Kv } from "@/components/shared/Kv";
import { OrderLink } from "@/components/shared/Links";
import { useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PaidDialog from "@/components/dialogs/PaidDialog";
import { money } from "@/utils/money";

export default function BatchDrawer({ id }: { id: string }) {
    const { batches, role, actor, advanceBatch, openDialog, closeLayers, toast } = useApp();
    const [showVoid, setShowVoid] = useState(false);
    const [voidReason, setVoidReason] = useState("");
    const b = batches.find((x) => x.id === id);
    if (!b) return null;

    const entries = ledger(batches).filter((r) => b.entries.includes(r.id));
    const canApprove = role === "approver" && b.preparedBy !== actor;

    return (
        <><ConfirmDialog
            isOpen={showVoid}
            onClose={() => setShowVoid(false)}
            onConfirm={() => {
                advanceBatch(id, "Voided", "Draft voided: " + voidReason.trim());
                setShowVoid(false);
                closeLayers();
                toast("Draft voided; entries released. Audit history retained.");
            }}
            type="warning"
            title="Void draft batch"
            message="Source entries will be released and the batch can't be submitted. Audit history is kept."
            confirmText="Void draft"
            reasonRequired
            reasonLabel="Reason"
            reasonPlaceholder="Why is this draft being voided?"
            reason={voidReason}
            onReasonChange={setVoidReason} /><Drawer
                title={id}
                kicker={`${b.payee} · supplier payout`}
                footer={<>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={closeLayers}
                    >
                        Close
                    </button>
                    {b.status === "Draft" && (
                        <>
                            <button
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-bad hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={role !== "preparer"}
                                onClick={() => setShowVoid(true)}
                            >
                                Void draft
                            </button>
                            <button
                                className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={role !== "preparer"}
                                onClick={() => advanceBatch(id, "Pending approval", "Submitted for independent approval")}
                            >
                                Submit for approval
                            </button>
                        </>
                    )}
                    {b.status === "Pending approval" && (
                        <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canApprove}
                            onClick={() => advanceBatch(id, "Approved", "Approved by separate finance actor", { approvedBy: actor })}
                        >
                            Approve batch (demo)
                        </button>
                    )}
                    {b.status === "Approved" && (
                        <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={role !== "approver"}
                            onClick={() => advanceBatch(id, "Payment submitted", "External payment submission recorded; not yet paid")}
                        >
                            Record payment submission (demo)
                        </button>
                    )}
                    {b.status === "Payment submitted" && (
                        <button
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={role !== "approver"}
                            onClick={() => setShowVoid(true)}
                        >
                            Record confirmed payment (demo)
                        </button>
                    )}
                </>}
            >
                <div className="flex flex-wrap items-center gap-2.5">
                    <Tag s={b.status} />
                    <Tag s="USD" c="blue" />
                </div>
                <Kv
                    items={[
                        ["Payee / destination", `${b.payee} · Verified bank ••4821 (sample)`],
                        ["Period", b.period],
                        ["Prepared by", b.preparedBy],
                        ["Approved by", b.approvedBy || "Awaiting approval"],
                        ["Net payout", money(b.amount)],
                        ["Payout reference", b.reference || "No bank confirmation"],
                    ]} />
                <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">{b.note}</div>
                <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center justify-between gap-2.5 border-b border-line px-5 py-[17px]"><h3 className="text-sm font-semibold">Immutable source allocation</h3></div>
                    <DetailTable head={["Source", "Invoice / credit", "Net payable"]} rows={entries.map((r) => [<OrderLink id={r.orderId} />, r.invoice, money(r.amount)])} />
                </div>
                <ol className="m-0 list-none p-0">
                    {b.timeline.map(([d, l, a], i) => (
                        <li
                            key={i}
                            className="relative flex gap-3 pb-5 before:mt-[7px] before:size-[7px] before:shrink-0 before:rounded-full before:bg-[#5f91e5] after:absolute after:left-[3px] after:top-[18px] after:h-[calc(100%-12px)] after:w-px after:bg-line last:after:hidden"
                        >
                            <div>
                                <strong className="text-xs">{l}</strong>
                                <small className="block text-xs text-muted">{d} UTC · {a}</small>
                            </div>
                        </li>
                    ))}
                </ol>
                <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">
                    All actions below simulate an approval workflow only. No bank, gateway, or ARS request is sent. Pending or ambiguous transfers must not be blindly retried.
                </div>
            </Drawer></>
    );
}