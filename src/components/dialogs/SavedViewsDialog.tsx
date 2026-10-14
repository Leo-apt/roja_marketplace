import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";

export default function SavedViewsDialog({ view }: { view: string }) {
    const { savedViews, saveView, setFilters, setSelected, closeDialog, toast } = useApp();
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const mine = savedViews.filter((v) => v.view === view);

    const save = () => {
        if (!name.trim()) return setErr("Enter a view name.");
        saveView(name.trim(), view);
        closeDialog();
        toast("Saved current view on this device.");
    };

    return (
        <Modal title="Saved views" error={err}>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
                Save current filters as
                <input
                    className="min-h-9 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                    value={name}
                    maxLength={70}
                    placeholder="e.g. ARS · negative margin"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <button
                className="inline-flex min-h-9 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={save}
            >
                Save view
            </button>
            <div className="flex flex-col gap-1.5">
                {mine.length === 0 && <p className="text-xs text-muted">No saved views for this page yet.</p>}
                {mine.map((v, i) => (
                    <button
                        key={i}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                            setFilters(v.filters);
                            setSelected(new Set());
                            closeDialog();
                        }}
                    >
                        {v.name}
                    </button>
                ))}
            </div>
            <small className="text-xs text-muted">
                Stored on this device for the presentation. Production saved views belong to the instance and administrator.
            </small>
        </Modal>
    );
}