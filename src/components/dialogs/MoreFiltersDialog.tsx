import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import Modal from "@/components/shared/Modal";
import Dropdownbox from "@/components/shared/Dropdownbox";
import type { ViewKey } from "@/utils/views";

export default function MoreFiltersDialog({ view }: { view: ViewKey }) {
    const { filters, setFilters, setSelected, closeDialog } = useApp();
    const [type, setType] = useState(filters.type);
    const [stage, setStage] = useState(filters.stage);
    const [channel, setChannel] = useState(filters.channel);
    const [negative, setNegative] = useState(filters.negative);
    const lock = view === "products" || view === "settlements";

    const apply = () => {
        setFilters({ type, stage: lock ? "all" : stage, channel: lock ? "all" : channel, negative });
        setSelected(new Set());
        closeDialog();
    };

    return (
        <Modal
            title="More filters"
            footer={
                <button
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-btn-primary bg-btn-primary px-3 py-[7px] font-semibold text-white hover:enabled:border-btn-primary-hover hover:enabled:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={apply}
                >
                    Apply filters
                </button>
            }
        >
            <div className="grid grid-cols-2 gap-4 max-[850px]:grid-cols-1">
                <Dropdownbox
                    label="Purchase model"
                    name="type"
                    value={type}
                    options={[
                        { value: "all", label: "All models" },
                        { value: "One-time", label: "One-time" },
                        { value: "Subscription", label: "Subscription" },
                        { value: "Trial", label: "Trial" },
                    ]}
                    onChange={(e) => setType(e.target.value)}
                    rounded="rounded-lg"
                    compact
                />
                <Dropdownbox
                    label="Current EWA stage"
                    name="stage"
                    value={stage}
                    disabled={lock}
                    options={[
                        { value: "all", label: "All stages" },
                        ...["1", "2A", "2B", "3", "4"].map((s) => ({ value: s, label: `Stage ${s}` })),
                    ]}
                    onChange={(e) => setStage(e.target.value)}
                    rounded="rounded-lg"
                    compact
                />
                <Dropdownbox
                    label="Purchase channel"
                    name="channel"
                    value={channel}
                    disabled={lock}
                    options={[
                        { value: "all", label: "All channels" },
                        { value: "iOS", label: "iOS" },
                        { value: "Android", label: "Android" },
                        { value: "Web", label: "Web" },
                    ]}
                    onChange={(e) => setChannel(e.target.value)}
                    rounded="rounded-lg"
                    compact
                />
            </div>
            {view === "margin" && (
                <label className="flex items-start gap-[9px] text-[13px]">
                    <input className="mt-1 accent-brand" type="checkbox" checked={negative} onChange={(e) => setNegative(e.target.checked)} />
                    Only negative-contribution order lines
                </label>
            )}
            <div className="rounded-[9px] border border-note-info-border bg-note-info-bg px-4 py-3 text-xs text-note-info-text">
                Production filters also include product/category, bundle, price version, payment/fulfillment/entitlement state, refund state, state/ZIP eligibility, and settlement hold reason. The sample implements the fields above.
            </div>
        </Modal>
    );
}