// History > calls of one environment: Sandbox / Live tabs, filters, server paging, row click opens the drawer.
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Dropdownbox from "@/components/shared/Dropdownbox";
import DatePicker from "@/components/shared/DatePicker";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import Tabs from "@/components/shared/Tabs";
import { btn, Field } from "@/components/catalog/FormBits";
import { ErrorBox } from "@/components/catalog/PageState";
import { useApp } from "@/hooks/useApp";
import { historyService, type HistoryRow } from "@/services/history.service";
import CallDrawer from "./CallDrawer";
import { CallStatus, money, td, th, when } from "./format";
import { useEnv } from "@/env/EnvContext";

const SIZE = 10;
const ACTIONS = [
    "create-customer", "update-customer", "create-product", "update-product", "create-plan", "update-plan",
    "create-price", "update-price", "attach-card", "detach-card", "create-setup-intent", "verify-setup-intent",
    "create-account", "retrieve-account", "create-external-account", "create-account-link",
    "create-transfer", "create-payout", "create-subscription", "create-payment",
];
const actionOpts = [{ value: "all", label: "All actions" }, ...ACTIONS.map((a) => ({ value: a, label: a }))];
const statusOpts = [{ value: "all", label: "All statuses" }, { value: "success", label: "Success" }, { value: "failed", label: "Failed" }];

export default function HistoryCalls() {
    const { subEntityId = "" } = useParams();
    const [sp] = useSearchParams();
    const { openDrawer } = useApp();
    const { mode: env, setMode: setEnv } = useEnv();
    const [action, setAction] = useState("all");
    const [status, setStatus] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<{ rows: HistoryRow[]; total: number }>({ rows: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let live = true;
        setLoading(true);
        historyService.list({
            subEntityId, env, page, limit: SIZE,
            action: action === "all" ? undefined : action, status: status === "all" ? undefined : status,
            from: from || undefined, to: to || undefined,
        })
            .then((r) => { if (live) { setData(r); setError(""); } })
            .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Failed to load calls"); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [subEntityId, env, action, status, from, to, page, tick]);

    const filtersOn = action !== "all" || status !== "all" || !!from || !!to;
    const reset = () => { setAction("all"); setStatus("all"); setFrom(""); setTo(""); setPage(1); };
    const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
    const pages = Math.max(1, Math.ceil(data.total / SIZE));
    const start = (page - 1) * SIZE;

    // opened from a Live or Sandbox cell: switch the whole site to it
    useEffect(() => {
        const e = sp.get("env");
        if (e === "live" || e === "sandbox") setEnv(e);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // switching from the top bar goes back to page 1
    useEffect(() => { setPage(1); }, [env]);

    if (error) return <ErrorBox message={error} onRetry={() => { setError(""); setTick((t) => t + 1); }} backTo="/history" />;

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-line bg-white">
                <Tabs label="Environment" large value={env} onChange={(k) => { setEnv(k as "sandbox" | "live"); setPage(1); }}
                    tabs={[["sandbox", "Sandbox"], ["live", "Live"]]} />
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Field label="Action">
                        <Dropdownbox name="action" value={action} options={actionOpts} rounded="rounded-md" compact searchable
                            onChange={(e) => change(setAction)(e.target.value)} />
                    </Field>
                    <Field label="Status">
                        <Dropdownbox name="status" value={status} options={statusOpts} rounded="rounded-md" compact
                            onChange={(e) => change(setStatus)(e.target.value)} />
                    </Field>
                    <Field label="From">
                        <DatePicker value={from} maxDate={to || undefined} placeholder="Select date" onChange={(v) => change(setFrom)(v)} />
                    </Field>
                    <Field label="To">
                        <DatePicker value={to} minDate={from || undefined} placeholder="Select date" onChange={(v) => change(setTo)(v)} />
                    </Field>
                    <div className="flex items-end">
                        <button className={btn.secondary} disabled={!filtersOn} onClick={reset}>Clear filters</button>
                    </div>
                </div>
            </div>

            <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
                <div className={`w-full overflow-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr>
                                <th className={`${th} pl-5`}>S.No</th><th className={th}>Time</th><th className={th}>Action</th>
                                <th className={th}>Status</th><th className={th}>Amount</th><th className={th}>Object id</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((r, i) => (
                                <tr key={r._id} onClick={() => openDrawer(<CallDrawer id={r._id} />)} className="cursor-pointer hover:bg-row-hover">
                                    <td className={`${td} pl-5`}>{start + i + 1}</td>
                                    <td className={td}>{when(r.createdAt)}</td>
                                    <td className={`${td} font-semibold text-link`}>{r.action}</td>
                                    <td className={td}><CallStatus status={r.status} /></td>
                                    <td className={td}>{r.amount != null ? money(r.amount, r.currency) : "-"}</td>
                                    <td className={td}>{r.stripeObjectId || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.rows.length === 0 && !loading && (
                        <EmptyState title={filtersOn ? "No matching calls" : "No calls yet"}
                            message={filtersOn ? "Try different filters." : `No ${env} API calls have been recorded for this environment.`} />
                    )}
                </div>
                <Pagination currentPage={page} totalPages={pages} start={start} end={Math.min(start + SIZE, data.total)}
                    total={data.total} itemLabel="calls" onPageChange={setPage} />
            </section>
        </div>
    );
}