import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";

export default function VoidDialog({ id }: { id: string }) {
    const { advanceBatch, closeLayers, toast } = useApp();
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");

    const confirm = () => {
        if (!reason.trim()) return setErr("Provide a reason.");
        advanceBatch(id, "Voided", "Draft voided: " + reason.trim());
        closeLayers();
        toast("Draft voided; entries released. Audit history retained.");
    };

    return (
        <Modal
            title="Void draft batch"
            error={err}
            footer={
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-bad hover:enabled:border-btn-secondary-hover-border hover:enabled:bg-btn-secondary-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={confirm}
                >
                    Void draft
                </button>
            }
        >
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Reason
                <input
                    className="min-h-9 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                    value={reason}
                    placeholder="Required"
                    onChange={(e) => setReason(e.target.value)}
                />
            </label>
        </Modal>
    );
}