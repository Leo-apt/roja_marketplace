import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";
import { Kv } from "@/components/shared/Kv";
import BatchDrawer from "@/components/drawers/BatchDrawer";
import { money } from "@/utils/money";

interface Props {
    payee: string;
    amount: number;
    entries: string[];
    period: string;
}

export default function CreateBatchDialog({ payee, amount, entries, period }: Props) {
    const { createBatch, setSelected, closeDialog, openDrawer, toast } = useApp();
    const [note, setNote] = useState("");
    const [err, setErr] = useState("");

    const confirm = () => {
        if (!note.trim()) return setErr("A preparation note is required.");
        const id = createBatch({ payee, amount, entries, note: note.trim(), period });
        setSelected(new Set());
        closeDialog();
        openDrawer(<BatchDrawer id={id} />);
        toast("Draft created. Source entries are reserved; no money moved.");
    };

    return (
        <Modal
            title="Create supplier settlement draft"
            error={err}
            footer={
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={confirm}
                >
                    Create draft
                </button>
            }
        >
            <Kv items={[["Payee", payee], ["Net payout", money(amount)], ["Source entries", String(entries.length)], ["Reporting currency", "USD"]]} />
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Preparation note
                <textarea
                    className="min-h-[90px] w-full resize-y rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                    value={note}
                    placeholder="Reason, invoice checks, and any approved exceptions…"
                    onChange={(e) => setNote(e.target.value)}
                />
            </label>
            <div className="rounded-[9px] border border-[#cbdcf9] bg-[#f1f6ff] px-4 py-3 text-xs text-[#415d83]">Entries will be reserved against duplicate allocation. This does not send money.</div>
        </Modal>
    );
}