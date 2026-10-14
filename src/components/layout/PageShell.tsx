import { useState, type ReactNode } from "react";
import { useApp } from "@/hooks/useApp";
import { viewInfo, type ViewKey } from "@/utils/views";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SavedViewsDialog from "@/components/dialogs/SavedViewsDialog";
import FiltersDrawer from "@/components/drawers/FiltersDrawer";

export default function PageShell({ view, onExport, children }: { view: ViewKey; onExport: () => void; children: ReactNode }) {
    const { filters: f, setFilters, resetFilters, resetDemo, openDialog, openDrawer, setSelected } = useApp();
    const [showReset, setShowReset] = useState(false);
    const v = viewInfo[view];

    const active = f.type !== "all" || f.stage !== "all" || f.channel !== "all" || f.negative || f.provider !== "all" || f.status !== "all";

    return (
        <>
            <div className="mb-3 flex flex-wrap items-end gap-3 print:hidden">
                <label className="flex min-w-[230px] max-w-[340px] flex-1 flex-col gap-1.5 text-xs font-semibold max-[850px]:min-w-full max-[850px]:max-w-none">
                    Search {v.search}
                    <input
                        className="min-h-9 w-full rounded-lg border border-line bg-white px-2.5 py-2 text-ink"
                        type="search"
                        placeholder="Search within this view…"
                        value={f.q}
                        onChange={(e) => { setFilters({ q: e.target.value }); setSelected(new Set()); }}
                    />
                </label>

                <div className="flex flex-1 flex-wrap items-center justify-center gap-2.5 max-[850px]:justify-start">
                    <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-line bg-white px-[9px] py-[5px] text-[11px] text-[#566a88] before:size-1.5 before:rounded-full before:bg-[#e8a239]">
                        Interactive sample · 7 Oct 2026
                    </span>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setShowReset(true)}
                    >
                        Reset demo
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-[7px] max-[1180px]:ml-0 max-[850px]:flex-wrap">
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => openDrawer(<FiltersDrawer view={view} />)}
                    >
                        Filters{active ? " •" : ""}
                    </button>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-[7px] font-semibold text-ink hover:enabled:border-[#bfd0ec] hover:enabled:bg-[#f4f7fe] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => openDialog(<SavedViewsDialog view={view} />)}
                    >
                        Saved views
                    </button>
                    <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-brand bg-brand px-3 py-[7px] font-semibold text-white hover:enabled:border-brandhover hover:enabled:bg-brandhover disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={onExport}
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className=" mb-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>{v.scope}</span>
                <span className="rounded-[5px] bg-[#eef2fa] px-[7px] py-[3px] text-[11px] text-[#5d7293]">USD · UTC</span>
                {f.type !== "all" && <span className="rounded-[5px] bg-[#eef2fa] px-[7px] py-[3px] text-[11px] text-[#5d7293]">{f.type}</span>}
                {f.stage !== "all" && <span className="rounded-[5px] bg-[#eef2fa] px-[7px] py-[3px] text-[11px] text-[#5d7293]">Current EWA stage {f.stage}</span>}
                <button className="border-0 bg-transparent p-0 text-left text-xs font-semibold text-brand" onClick={resetFilters}>Clear filters</button>
            </div>

            <div className="flex flex-col gap-[18px]">{children}</div>

            <ConfirmDialog
                isOpen={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={() => { resetDemo(); setShowReset(false); }}
                type="warning"
                title="Reset demo?"
                message="This clears the sample batches and saved views you created on this device."
                confirmText="Reset"
            />
        </>
    );
}