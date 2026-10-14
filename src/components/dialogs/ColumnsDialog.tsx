import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";

export default function ColumnsDialog({ viewKey, cols }: { viewKey: string; cols: { key: string; label: string }[] }) {
    const { hidden, setHidden, closeDialog } = useApp();
    const [vis, setVis] = useState<string[]>(cols.map((c) => c.key).filter((k) => !(hidden[viewKey] ?? []).includes(k)));
    const [err, setErr] = useState("");

    const apply = () => {
        if (!vis.length) return setErr("Keep at least one column visible.");
        setHidden(viewKey, cols.map((c) => c.key).filter((k) => !vis.includes(k)));
        closeDialog();
    };

    return (
        <Modal
            title="Visible columns"
            error={err}
            footer={
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={apply}
                >
                    Apply columns
                </button>
            }
        >
            <div className="grid grid-cols-2 gap-4 max-[850px]:grid-cols-1">
                {cols.map((c) => (
                    <label className="flex items-start gap-[9px] text-[13px]" key={c.key}>
                        <input
                            className="mt-1 accent-brand"
                            type="checkbox"
                            checked={vis.includes(c.key)}
                            onChange={(e) => setVis(e.target.checked ? [...vis, c.key] : vis.filter((k) => k !== c.key))}
                        />
                        {c.label}
                    </label>
                ))}
            </div>
        </Modal>
    );
}