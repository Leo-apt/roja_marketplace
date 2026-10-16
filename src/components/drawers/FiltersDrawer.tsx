import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import { defaultFilters, type Filters } from "@/domain/filters";
import { ASOF } from "@/utils/constants";
import { viewInfo, type ViewKey } from "@/utils/views";
import Drawer from "@/components/shared/Drawer";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import { btn } from "@/components/catalog/FormBits";

type Draft = Pick<Filters, "from" | "to" | "provider" | "status" | "type" | "stage" | "channel" | "negative">;

const pick = (f: Filters): Draft => ({
    from: f.from, to: f.to, provider: f.provider, status: f.status,
    type: f.type, stage: f.stage, channel: f.channel, negative: f.negative,
});

export default function FiltersDrawer({ view }: { view: ViewKey }) {
    const { filters, setFilters, setSelected, toast } = useApp();
    const v = viewInfo[view];
    const lock = view === "products" || view === "settlements";
    const [d, setD] = useState<Draft>(() => pick(filters));
    const [showMore, setShowMore] = useState(
        () => filters.type !== "all" || filters.stage !== "all" || filters.channel !== "all" || filters.negative,
    );
    const moreActive = d.type !== "all" || d.stage !== "all" || d.channel !== "all" || d.negative;
    const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

    const apply = (close: () => void) => {
        if (!d.from || !d.to || d.from > d.to || d.to > ASOF) {
            toast("Choose a valid date range ending on or before 7 Oct 2026.");
            return;
        }
        setFilters({ ...d, stage: lock ? "all" : d.stage, channel: lock ? "all" : d.channel });
        setSelected(new Set());
        close();
    };

    return (
        <Drawer
            title="Filters"
            kicker="Refine this view"
            width="min(460px, calc(100vw - 20px))"
            footer={(close) => (
                <>
                    <button className={btn.secondary} onClick={() => setD(pick(defaultFilters))}>Clear</button>
                    <button className={btn.primary} onClick={() => apply(close)}>Apply filters</button>
                </>
            )}
        >
            <div className="grid grid-cols-1 gap-4">
                <DatePicker label={`${v.dateLabel} · from`} value={d.from} maxDate={d.to < ASOF ? d.to : ASOF} onChange={(val) => set({ from: val })} />
                <DatePicker label="To" value={d.to} minDate={d.from} maxDate={ASOF} onChange={(val) => set({ to: val })} />
                <Dropdownbox
                    label="Supplier / payee" name="provider" value={d.provider}
                    options={[
                        { value: "all", label: "All payees" },
                        { value: "ARS", label: "ARS" },
                        { value: "Wellness supplier (sample)", label: "Wellness supplier (sample)" },
                    ]}
                    onChange={(e) => set({ provider: e.target.value })} rounded="rounded-lg" compact
                />
                {v.statuses.length > 0 && (
                    <Dropdownbox
                        label={v.statusLabel} name="status" value={d.status}
                        options={v.statuses.map((s) => ({ value: s, label: s === "all" ? "All statuses" : s }))}
                        onChange={(e) => set({ status: e.target.value })} rounded="rounded-lg" compact
                    />
                )}
            </div>

            <button
                type="button"
                className="inline-flex min-h-9 w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg"
                onClick={() => setShowMore((s) => !s)}
                aria-expanded={showMore}
            >
                <span>More filters{moreActive ? " •" : ""}</span>
                <span className={`transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}>▾</span>
            </button>

            {showMore && (
                <div className="flex flex-col gap-4">
                    <Dropdownbox
                        label="Purchase model" name="type" value={d.type}
                        options={[
                            { value: "all", label: "All models" },
                            { value: "One-time", label: "One-time" },
                            { value: "Subscription", label: "Subscription" },
                            { value: "Trial", label: "Trial" },
                        ]}
                        onChange={(e) => set({ type: e.target.value })} rounded="rounded-lg" compact
                    />
                    <Dropdownbox
                        label="Current EWA stage" name="stage" value={d.stage} disabled={lock}
                        options={[
                            { value: "all", label: "All stages" },
                            ...["1", "2A", "2B", "3", "4"].map((s) => ({ value: s, label: `Stage ${s}` })),
                        ]}
                        onChange={(e) => set({ stage: e.target.value })} rounded="rounded-lg" compact
                    />
                    <Dropdownbox
                        label="Purchase channel" name="channel" value={d.channel} disabled={lock}
                        options={[
                            { value: "all", label: "All channels" },
                            { value: "iOS", label: "iOS" },
                            { value: "Android", label: "Android" },
                            { value: "Web", label: "Web" },
                        ]}
                        onChange={(e) => set({ channel: e.target.value })} rounded="rounded-lg" compact
                    />
                    {view === "margin" && (
                        <label className="flex items-start gap-[9px] text-[13px]">
                            <input className="mt-1 accent-brand" type="checkbox" checked={d.negative} onChange={(e) => set({ negative: e.target.checked })} />
                            Only negative-contribution order lines
                        </label>
                    )}
                </div>
            )}
        </Drawer>
    );
}