import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";
import { ASOF } from "@/utils/constants";

export default function PaidDialog({ id }: { id: string }) {
    const { batches, advanceBatch, closeDialog, toast } = useApp();
    const b = batches.find((x) => x.id === id);
    const [ref, setRef] = useState("");
    const [amt, setAmt] = useState(b ? (b.amount / 100).toFixed(2) : "");
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState("");
    if (!b) return null;

    const save = () => {
        if (!ref.trim() || !ok) return setErr("Payment reference and confirmed-payment evidence are required.");
        if (Math.round(Number(amt) * 100) !== b.amount) return setErr("Confirmed payment amount must match the approved batch amount.");
        advanceBatch(id, "Paid", "Bank payment confirmed: " + ref.trim(), { reference: ref.trim(), paid: ASOF });
        closeDialog();
        toast("Confirmed payment recorded locally. No actual transfer was initiated.");
    };

    return (
        <Modal
            title="Record bank-confirmed payment"
            error={err}
            footer={
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={save}
                >
                    Record Paid (demo)
                </button>
            }
        >
            <div className="rounded-[9px] border border-[#f0d8ab] bg-[#fff9ef] px-4 py-3 text-xs text-[#77501b]">
                Demo evidence only. In production, verify bank/gateway confirmation and store restricted payment proof before recording Paid.
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
                External payment reference
                <input
                    className="min-h-9 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                    value={ref}
                    maxLength={80}
                    placeholder="BANK-DEMO-…"
                    onChange={(e) => setRef(e.target.value)}
                />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Confirmed amount (USD)
                <input
                    className="min-h-9 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amt}
                    onChange={(e) => setAmt(e.target.value)}
                />
            </label>
            <label className="flex items-start gap-[9px] text-[13px]">
                <input className="mt-1 accent-brand" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
                I verified the external payment is confirmed, not pending.
            </label>
        </Modal>
    );
}